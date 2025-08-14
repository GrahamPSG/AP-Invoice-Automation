import { Job } from 'bullmq';
import { QueueMessage, ProcessingResult, normalizeVendorName, categorizeItem, isServiceStock } from '@paris/shared';
import { DocumentIntelligenceClient } from '../clients/document-intelligence.client';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import * as crypto from 'crypto';
import * as fs from 'fs';

const prisma = new PrismaClient();
const documentIntelligence = new DocumentIntelligenceClient();

export class DocumentParseProcessor {
  static async process(job: Job<QueueMessage>): Promise<ProcessingResult> {
    const { id, payload } = job.data;
    
    try {
      logger.info(`Processing document parse: ${id}`);
      
      const { attachmentId, pdfPath, supplierHint } = payload;
      
      // Read PDF file
      const pdfBuffer = fs.readFileSync(pdfPath);
      const sha256 = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
      
      // Check if we've already processed this document
      const existingDoc = await prisma.document.findFirst({
        where: {
          sourcePdfPath: pdfPath,
        },
      });
      
      if (existingDoc) {
        logger.info(`Document already processed: ${existingDoc.id}`);
        return {
          success: true,
          message: 'Document already processed',
          data: { documentId: existingDoc.id },
          nextStep: 'servicetitan-match'
        };
      }

      // Analyze document with Azure Document Intelligence
      const analysis = await documentIntelligence.analyzeInvoice(pdfBuffer, supplierHint);
      
      if (analysis.confidence < 0.5) {
        logger.warn(`Low confidence analysis: ${analysis.confidence}`);
        
        // Create hold for manual review
        const document = await this.createDocumentWithHold(
          attachmentId,
          pdfPath,
          analysis,
          'UNREADABLE',
          `Low OCR confidence: ${(analysis.confidence * 100).toFixed(1)}%`
        );
        
        return {
          success: true,
          message: 'Document created with hold due to low confidence',
          data: { documentId: document.id },
          nextStep: 'notification'
        };
      }

      // Validate required fields
      if (!analysis.supplierName || !analysis.invoiceNumber || !analysis.total) {
        const document = await this.createDocumentWithHold(
          attachmentId,
          pdfPath,
          analysis,
          'UNREADABLE',
          'Missing required fields: supplier name, invoice number, or total'
        );
        
        return {
          success: true,
          message: 'Document created with hold due to missing fields',
          data: { documentId: document.id },
          nextStep: 'notification'
        };
      }

      // Normalize vendor name and check for synonyms
      const normalizedVendor = normalizeVendorName(analysis.supplierName);
      let resolvedVendor = await this.resolveVendorName(analysis.supplierName, normalizedVendor);
      
      // Extract PO number core (remove suffix)
      const poNumberCore = analysis.poNumber?.replace(/-\d+$/, '');
      
      // Check for service stock indicators
      const isStock = isServiceStock(analysis.supplierName + ' ' + (analysis.lineItems[0]?.description || ''));
      
      // Create document record
      const document = await prisma.document.create({
        data: {
          attachmentId,
          supplierNameRaw: analysis.supplierName,
          supplierNameNormalized: normalizedVendor,
          invoiceNumber: analysis.invoiceNumber,
          invoiceDate: new Date(analysis.invoiceDate || Date.now()),
          totalBeforeTax: analysis.totalBeforeTax || 0,
          gst: analysis.gst || 0,
          pst: analysis.pst || 0,
          total: analysis.total,
          poNumberRaw: analysis.poNumber,
          poNumberCore,
          isServiceStock: isStock,
          pageCount: 1, // TODO: Get from PDF analysis
          sourcePdfPath: pdfPath,
          lineItems: {
            create: analysis.lineItems.map(item => ({
              sku: undefined, // TODO: SKU matching
              description: item.description,
              qty: item.quantity || 1,
              unitPrice: item.unitPrice,
              total: item.total,
              category: categorizeItem(item.description),
              inPricebook: false, // TODO: Pricebook lookup
            }))
          }
        },
        include: {
          lineItems: true,
        }
      });

      // Check for duplicates
      const duplicateCheck = await this.checkForDuplicates(
        normalizedVendor,
        analysis.invoiceNumber,
        document.id
      );
      
      if (duplicateCheck.isDuplicate) {
        await this.createHold(
          document.id,
          'DUPLICATE',
          `Duplicate invoice found: ${duplicateCheck.existingDocumentId}`,
          ['Review duplicate invoice', 'Verify if legitimate']
        );
        
        return {
          success: true,
          message: 'Document created with duplicate hold',
          data: { documentId: document.id },
          nextStep: 'notification'
        };
      }

      logger.info(`Document parsing completed successfully: ${document.id}`);
      
      return {
        success: true,
        message: 'Document parsing completed',
        data: { 
          documentId: document.id,
          supplierName: analysis.supplierName,
          invoiceNumber: analysis.invoiceNumber,
          total: analysis.total,
          poNumber: analysis.poNumber,
          isServiceStock: isStock
        },
        nextStep: 'servicetitan-match'
      };
      
    } catch (error) {
      logger.error(`Document parsing failed: ${error.message}`, { id, error });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  private static async resolveVendorName(originalName: string, normalized: string): Promise<string> {
    // Check if we have a synonym mapping
    const synonym = await prisma.vendorSynonym.findUnique({
      where: { normalized },
      include: { vendor: true },
    });
    
    if (synonym) {
      return synonym.vendor.normalized;
    }
    
    // Check for similar vendor names (fuzzy matching could be added here)
    const similarVendors = await prisma.vendor.findMany({
      where: {
        normalized: {
          contains: normalized.substring(0, 5), // Simple similarity check
        },
      },
    });
    
    if (similarVendors.length === 1) {
      // Auto-create synonym if we find exactly one similar vendor
      await prisma.vendorSynonym.create({
        data: {
          vendorId: similarVendors[0].id,
          synonym: originalName,
          normalized,
        },
      });
      
      return similarVendors[0].normalized;
    }
    
    return normalized;
  }

  private static async checkForDuplicates(vendorNormalized: string, invoiceNumber: string, currentDocId: string) {
    const windowStart = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
    
    const existing = await prisma.document.findFirst({
      where: {
        supplierNameNormalized: vendorNormalized,
        invoiceNumber,
        createdAt: { gte: windowStart },
        id: { not: currentDocId },
      },
    });
    
    return {
      isDuplicate: !!existing,
      existingDocumentId: existing?.id,
    };
  }

  private static async createDocumentWithHold(
    attachmentId: string,
    pdfPath: string,
    analysis: any,
    reason: string,
    details: string
  ) {
    const document = await prisma.document.create({
      data: {
        attachmentId,
        supplierNameRaw: analysis.supplierName || 'Unknown',
        supplierNameNormalized: normalizeVendorName(analysis.supplierName || 'unknown'),
        invoiceNumber: analysis.invoiceNumber || 'Unknown',
        invoiceDate: new Date(analysis.invoiceDate || Date.now()),
        totalBeforeTax: analysis.totalBeforeTax || 0,
        gst: analysis.gst || 0,
        pst: analysis.pst || 0,
        total: analysis.total || 0,
        poNumberRaw: analysis.poNumber,
        poNumberCore: analysis.poNumber?.replace(/-\d+$/, ''),
        isServiceStock: false,
        pageCount: 1,
        sourcePdfPath: pdfPath,
      },
    });

    await this.createHold(document.id, reason as any, details, [
      'Review document manually',
      'Check OCR accuracy',
      'Verify supplier information'
    ]);

    return document;
  }

  private static async createHold(
    documentId: string,
    reason: string,
    details: string,
    suggestedActions: string[]
  ) {
    return await prisma.hold.create({
      data: {
        documentId,
        reason: reason as any,
        details,
        suggestedActions,
      },
    });
  }
}