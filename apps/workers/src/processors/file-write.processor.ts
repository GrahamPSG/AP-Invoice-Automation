import { Job } from 'bullmq';
import { QueueMessage, ProcessingResult, generateInvoiceFilename, getSharePointFolder, CompanyIdentification } from '@paris/shared';
import { GraphClient } from '../clients/graph.client';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import * as fs from 'fs';

const graphClient = new GraphClient();
const prisma = new PrismaClient();

export class FileWriteProcessor {
  static async process(job: Job<QueueMessage>): Promise<ProcessingResult> {
    const { id, payload } = job.data;

    try {
      logger.info(`Processing file write: ${id}`);

      const { documentId } = payload;

      // Fetch document details from database
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          attachment: true
        }
      });

      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Read the PDF file from disk
      const pdfBuffer = fs.readFileSync(document.sourcePdfPath);

      // Generate renamed filename: [VendorName]_[InvoiceNumber]_[Date].pdf
      const invoiceDate = document.invoiceDate.toISOString();
      const newFileName = generateInvoiceFilename(
        document.supplierNameRaw,
        document.invoiceNumber,
        invoiceDate
      );

      // Get the appropriate SharePoint folder based on company
      const sharepointFolder = getSharePointFolder(document.company as CompanyIdentification);

      if (!sharepointFolder) {
        throw new Error(`SharePoint folder not configured for company: ${document.company}`);
      }

      logger.info(`Uploading ${newFileName} to SharePoint folder: ${sharepointFolder}`, {
        documentId,
        company: document.company
      });

      // Upload to SharePoint
      const uploadResult = await graphClient.uploadToSharePoint(
        newFileName,
        pdfBuffer,
        sharepointFolder
      );

      // Construct SharePoint path for reference
      const sharepointPath = `${sharepointFolder}/${newFileName}`;

      // Update document record with new paths
      await prisma.document.update({
        where: { id: documentId },
        data: {
          renamedPdfPath: newFileName,
          sharepointPath: sharepointPath
        }
      });

      logger.info(`File write completed successfully: ${newFileName}`, {
        documentId,
        sharepointPath
      });

      return {
        success: true,
        message: `File uploaded to SharePoint: ${newFileName}`,
        data: {
          documentId,
          fileName: newFileName,
          sharepointPath,
          company: document.company
        },
        nextStep: 'notification'
      };

    } catch (error: any) {
      logger.error(`File write failed: ${error.message}`, { id, error });

      return {
        success: false,
        error: error.message
      };
    }
  }
}