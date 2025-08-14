import { Job } from 'bullmq';
import { QueueMessage, ProcessingResult, SERVICETITAN_ITEMS } from '@paris/shared';
import { ServiceTitanClient, ServiceTitanBillItem } from '../clients/servicetitan.client';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import * as fs from 'fs';

const serviceTitanClient = new ServiceTitanClient();
const prisma = new PrismaClient();

export class ServiceTitanBillProcessor {
  static async process(job: Job<QueueMessage>): Promise<ProcessingResult> {
    const { id, payload } = job.data;
    
    try {
      logger.info(`Processing ServiceTitan bill: ${id}`);
      
      const { documentId } = payload;
      
      // Get document and match result
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: { 
          lineItems: true,
          matchResult: true,
          attachment: true,
        },
      });
      
      if (!document || !document.matchResult) {
        throw new Error(`Document ${documentId} or match result not found`);
      }

      const matchResult = document.matchResult;
      
      // Handle different actions
      switch (matchResult.action) {
        case 'auto_finalize':
          return await this.processAutoFinalize(document, matchResult);
          
        case 'draft_then_alert':
          return await this.processDraftWithAlert(document, matchResult);
          
        case 'hold_for_review':
          // Already in holds - just proceed to notification
          return {
            success: true,
            message: 'Document is on hold for review',
            nextStep: 'notification'
          };
          
        case 'non_job_stock_hold':
          return await this.processServiceStock(document, matchResult);
          
        default:
          throw new Error(`Unknown match action: ${matchResult.action}`);
      }
      
    } catch (error) {
      logger.error(`ServiceTitan billing failed: ${error.message}`, { id, error });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  private static async processAutoFinalize(document: any, matchResult: any): Promise<ProcessingResult> {
    try {
      // Receive the PO first
      const pdfBuffer = fs.readFileSync(document.sourcePdfPath);
      
      const receiptResult = await serviceTitanClient.receivePO(
        matchResult.poId,
        document.invoiceNumber,
        pdfBuffer,
        this.prepareReceiptItems(document.lineItems)
      );

      if (!receiptResult.success) {
        throw new Error('Failed to receive PO');
      }

      let billId = receiptResult.billId;

      // If no auto-bill was created, create manually
      if (!billId) {
        const bill = await this.createManualBill(document, matchResult);
        billId = bill.id;
      }

      // Adjust bill amount if there's a small variance
      if (Math.abs(matchResult.variance) > 0 && Math.abs(matchResult.variance) <= 2500) {
        await serviceTitanClient.adjustBillAmount(
          billId,
          document.total,
          `Variance adjustment: ${matchResult.variance > 0 ? '+' : ''}$${Math.abs(matchResult.variance)/100}`
        );
      }

      // Finalize the bill
      await serviceTitanClient.finalizeBill(billId);

      // Update our records
      await prisma.bill.create({
        data: {
          documentId: document.id,
          vendorId: matchResult.vendorId,
          invoiceNumber: document.invoiceNumber,
          serviceTitanBillId: billId,
          status: 'FINALIZED',
          pdfPath: document.sourcePdfPath,
        },
      });

      logger.info(`Bill ${billId} auto-finalized for document ${document.id}`);

      return {
        success: true,
        message: `Bill ${billId} automatically finalized`,
        data: { billId, status: 'finalized' },
        nextStep: 'file-write'
      };

    } catch (error) {
      if (error.message.includes('NEGATIVE_QUANTITY_ERROR')) {
        // Create hold for negative quantity
        await this.createHold(
          document.id,
          'NEGATIVE_QUANTITY',
          'ServiceTitan does not allow negative quantities for this receipt',
          ['Check PO quantities', 'Adjust receipt quantities', 'Process as manual bill']
        );

        return {
          success: true,
          message: 'Created hold due to negative quantity error',
          nextStep: 'notification'
        };
      }

      logger.error(`Auto-finalize failed for ${document.id}:`, error);
      throw error;
    }
  }

  private static async processDraftWithAlert(document: any, matchResult: any): Promise<ProcessingResult> {
    try {
      // Create a draft bill without receiving the PO
      const bill = await this.createManualBill(document, matchResult, 'Draft');
      
      // Update our records
      await prisma.bill.create({
        data: {
          documentId: document.id,
          vendorId: matchResult.vendorId,
          invoiceNumber: document.invoiceNumber,
          serviceTitanBillId: bill.id,
          status: 'DRAFT',
          pdfPath: document.sourcePdfPath,
        },
      });

      logger.info(`Draft bill ${bill.id} created for document ${document.id} (variance alert)`);

      return {
        success: true,
        message: `Draft bill ${bill.id} created - variance alert`,
        data: { billId: bill.id, status: 'draft', variance: matchResult.variance },
        nextStep: 'notification'
      };

    } catch (error) {
      logger.error(`Draft billing failed for ${document.id}:`, error);
      throw error;
    }
  }

  private static async processServiceStock(document: any, matchResult: any): Promise<ProcessingResult> {
    // Service stock - create non-job bill if vendor is matched
    if (!matchResult.vendorId) {
      return {
        success: true,
        message: 'Service stock held - no vendor match',
        nextStep: 'notification'
      };
    }

    try {
      const bill = await this.createServiceStockBill(document, matchResult);
      
      await prisma.bill.create({
        data: {
          documentId: document.id,
          vendorId: matchResult.vendorId,
          invoiceNumber: document.invoiceNumber,
          serviceTitanBillId: bill.id,
          status: 'HELD',
          pdfPath: document.sourcePdfPath,
        },
      });

      return {
        success: true,
        message: `Service stock bill ${bill.id} created (held for review)`,
        data: { billId: bill.id, status: 'held' },
        nextStep: 'notification'
      };

    } catch (error) {
      logger.error(`Service stock billing failed for ${document.id}:`, error);
      throw error;
    }
  }

  private static async createManualBill(document: any, matchResult: any, status: string = 'Draft') {
    const lineItems = this.prepareBillItems(document, matchResult);
    
    const billData = {
      vendorId: matchResult.vendorId,
      invoiceNumber: document.invoiceNumber,
      invoiceDate: document.invoiceDate.toISOString().split('T')[0],
      total: document.total,
      lineItems,
      jobId: matchResult.jobId,
      poId: matchResult.poId,
    };

    return await serviceTitanClient.createBill(billData);
  }

  private static async createServiceStockBill(document: any, matchResult: any) {
    // Use stock location instead of job
    const stockLocationId = process.env.ST_SERVICE_STOCK_LOCATION_ID;
    
    const lineItems = this.prepareBillItems(document, matchResult, stockLocationId);
    
    const billData = {
      vendorId: matchResult.vendorId,
      invoiceNumber: document.invoiceNumber,
      invoiceDate: document.invoiceDate.toISOString().split('T')[0],
      total: document.total,
      lineItems,
      // No jobId for service stock
    };

    return await serviceTitanClient.createBill(billData);
  }

  private static prepareBillItems(
    document: any, 
    matchResult: any, 
    overrideLocationId?: string
  ): ServiceTitanBillItem[] {
    const lineItems = document.lineItems || [];
    
    // If >5 line items or items not in pricebook, use lump sum
    const hasUnknownItems = lineItems.some((item: any) => !item.inPricebook);
    const tooManyItems = lineItems.length > 5;
    
    if (hasUnknownItems || tooManyItems) {
      return this.createLumpSumBill(document, matchResult, overrideLocationId);
    }

    // Create line-by-line bill
    return lineItems.map((item: any) => ({
      skuId: item.sku || this.getDefaultSku(item.category),
      description: item.description,
      quantity: item.qty,
      unitCost: item.unitPrice || 0,
      total: item.total || 0,
      jobId: overrideLocationId ? undefined : matchResult.jobId,
      technicianId: overrideLocationId ? undefined : matchResult.leadTechId,
      locationId: overrideLocationId || matchResult.truckLocationId,
    }));
  }

  private static createLumpSumBill(
    document: any, 
    matchResult: any, 
    overrideLocationId?: string
  ): ServiceTitanBillItem[] {
    // Determine if this is primarily PH or HVAC
    const lineItems = document.lineItems || [];
    const phCount = lineItems.filter((item: any) => item.category === 'PH').length;
    const hvacCount = lineItems.filter((item: any) => item.category === 'HVAC').length;
    
    const isPrimaryPH = phCount >= hvacCount;
    const skuId = isPrimaryPH ? SERVICETITAN_ITEMS.PH_LUMPSUM : SERVICETITAN_ITEMS.HVAC_LUMPSUM;
    
    return [{
      skuId,
      description: `Lump sum invoice: ${document.supplierNameRaw} - ${document.invoiceNumber}`,
      quantity: document.totalBeforeTax / 100, // Use quantity as dollar amount
      unitCost: 100, // $1.00 per unit
      total: document.totalBeforeTax,
      jobId: overrideLocationId ? undefined : matchResult.jobId,
      technicianId: overrideLocationId ? undefined : matchResult.leadTechId,
      locationId: overrideLocationId || matchResult.truckLocationId,
    }];
  }

  private static prepareReceiptItems(lineItems: any[]) {
    return lineItems.map(item => ({
      skuId: item.sku || this.getDefaultSku(item.category),
      receivedQuantity: item.qty,
    }));
  }

  private static getDefaultSku(category: string): string {
    switch (category) {
      case 'PH':
        return SERVICETITAN_ITEMS.PH_LUMPSUM;
      case 'HVAC':
        return SERVICETITAN_ITEMS.HVAC_LUMPSUM;
      default:
        return SERVICETITAN_ITEMS.PH_LUMPSUM; // Default to PH
    }
  }

  private static async createHold(
    documentId: string,
    reason: string,
    details: string,
    suggestedActions: string[]
  ) {
    await prisma.hold.create({
      data: {
        documentId,
        reason: reason as any,
        details,
        suggestedActions,
      },
    });
  }
}