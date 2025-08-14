import { Job } from 'bullmq';
import { QueueMessage, ProcessingResult, isWithinVariance } from '@paris/shared';
import { ServiceTitanClient, ServiceTitanPO } from '../clients/servicetitan.client';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const serviceTitanClient = new ServiceTitanClient();
const prisma = new PrismaClient();

export class ServiceTitanMatchProcessor {
  static async process(job: Job<QueueMessage>): Promise<ProcessingResult> {
    const { id, payload } = job.data;
    
    try {
      logger.info(`Processing ServiceTitan match: ${id}`);
      
      const { documentId } = payload;
      
      // Get document details
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: { lineItems: true },
      });
      
      if (!document) {
        throw new Error(`Document ${documentId} not found`);
      }

      // Get variance threshold from config
      const varianceThreshold = parseInt(process.env.VARIANCE_CENTS || '2500');
      
      let matchResult: any = {
        documentId,
        poFound: false,
        variance: 0,
        action: 'hold_for_review',
        reasons: [],
        suggestions: null,
      };

      // Handle service stock vs PO orders differently
      if (document.isServiceStock) {
        return await this.handleServiceStock(document, matchResult);
      }

      // Try to find PO if we have a PO number
      if (document.poNumberCore) {
        const po = await serviceTitanClient.findPO(document.poNumberCore);
        
        if (po) {
          matchResult = await this.processPOMatch(document, po, varianceThreshold);
        } else {
          // PO not found - create hold
          matchResult.reasons.push(`PO ${document.poNumberCore} not found in ServiceTitan`);
          matchResult.action = 'hold_for_review';
          
          await this.createHold(
            documentId,
            'MISSING_PO',
            `PO number ${document.poNumberCore} not found in ServiceTitan`,
            ['Verify PO number', 'Check if PO exists in different business unit', 'Create manual PO']
          );
        }
      } else {
        // No PO number - try to find suggestions
        matchResult = await this.findJobSuggestions(document, matchResult);
      }

      // Save match result
      await prisma.matchResult.upsert({
        where: { documentId },
        update: matchResult,
        create: matchResult,
      });

      logger.info(`ServiceTitan matching completed for ${documentId}: ${matchResult.action}`);
      
      return {
        success: true,
        message: `Matching completed: ${matchResult.action}`,
        data: {
          documentId,
          action: matchResult.action,
          poFound: matchResult.poFound,
          variance: matchResult.variance,
          reasons: matchResult.reasons,
        },
        nextStep: matchResult.action === 'hold_for_review' ? 'notification' : 'servicetitan-bill'
      };
      
    } catch (error) {
      logger.error(`ServiceTitan matching failed: ${error.message}`, { id, error });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  private static async processPOMatch(
    document: any, 
    po: ServiceTitanPO, 
    varianceThreshold: number
  ) {
    const variance = document.total - po.total;
    const withinVariance = isWithinVariance(document.total, po.total, varianceThreshold);
    
    // Find vendor match
    let vendorMatch = null;
    if (po.vendorName) {
      vendorMatch = await serviceTitanClient.findVendorByName(document.supplierNameNormalized);
    }

    // Get job details and technicians
    let jobId = po.jobId;
    let leadTechId = null;
    let truckLocationId = null;
    
    if (jobId) {
      const technicians = await serviceTitanClient.getTechniciansByJob(jobId);
      if (technicians.length > 0) {
        const leadTech = technicians.find(t => t.truckId) || technicians[0];
        leadTechId = leadTech.id;
        truckLocationId = leadTech.truckId;
      }
    }

    const matchResult = {
      documentId: document.id,
      poFound: true,
      poId: po.id,
      jobId,
      leadTechId,
      truckLocationId,
      vendorId: vendorMatch?.id,
      variance,
      reasons: [],
      suggestions: null,
      action: 'auto_finalize',
    };

    // Determine action based on variance and other factors
    if (!withinVariance) {
      matchResult.action = 'draft_then_alert';
      matchResult.reasons.push(`Variance ${variance/100} exceeds threshold $${varianceThreshold/100}`);
      
      await this.createHold(
        document.id,
        'VARIANCE_EXCEEDED',
        `Invoice total ${document.total/100} vs PO total ${po.total/100} (variance: $${Math.abs(variance)/100})`,
        ['Review pricing differences', 'Check for additional charges', 'Approve variance if legitimate']
      );
    }

    if (!jobId) {
      matchResult.action = 'hold_for_review';
      matchResult.reasons.push('PO not linked to a job');
      
      await this.createHold(
        document.id,
        'NO_TECH_TRUCK',
        'PO is not associated with a job, cannot determine technician or truck location',
        ['Link PO to a job', 'Create non-job bill', 'Assign to service stock']
      );
    }

    if (!leadTechId || !truckLocationId) {
      matchResult.reasons.push('No technician or truck assigned to job');
      // Don't hold for this - can proceed with job-level billing
    }

    if (!vendorMatch) {
      matchResult.reasons.push(`Vendor ${document.supplierNameRaw} not found in ServiceTitan`);
      
      await this.createHold(
        document.id,
        'NO_VENDOR_MATCH',
        `Supplier "${document.supplierNameRaw}" not found in ServiceTitan vendor list`,
        ['Add vendor to ServiceTitan', 'Map vendor name in synonyms', 'Use closest vendor match']
      );
      
      matchResult.action = 'hold_for_review';
    }

    return matchResult;
  }

  private static async handleServiceStock(document: any, matchResult: any) {
    // For service stock, we need to create a non-job bill
    matchResult.action = 'non_job_stock_hold';
    matchResult.reasons.push('Invoice marked as service stock');
    
    // Try to find vendor
    const vendorMatch = await serviceTitanClient.findVendorByName(document.supplierNameNormalized);
    if (vendorMatch) {
      matchResult.vendorId = vendorMatch.id;
    }

    await this.createHold(
      document.id,
      'SERVICE_STOCK',
      'Invoice identified as service stock - requires manual assignment to stock location',
      ['Assign to correct stock location', 'Verify stock items', 'Create stock adjustment if needed']
    );

    await prisma.matchResult.create({ data: matchResult });

    return {
      success: true,
      message: 'Service stock invoice held for review',
      data: { documentId: document.id, action: 'non_job_stock_hold' },
      nextStep: 'notification'
    };
  }

  private static async findJobSuggestions(document: any, matchResult: any) {
    // No PO number - try to suggest jobs based on supplier, date, amount
    const dateRange = {
      from: new Date(document.invoiceDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before
      to: new Date(document.invoiceDate.getTime() + 3 * 24 * 60 * 60 * 1000),   // 3 days after
    };

    const amountRange = {
      min: Math.round(document.total * 0.8), // ±20% of invoice amount
      max: Math.round(document.total * 1.2),
    };

    try {
      const jobSuggestions = await serviceTitanClient.findJobs({
        dateFrom: dateRange.from.toISOString(),
        dateTo: dateRange.to.toISOString(),
        amountRange,
      });

      const suggestions = jobSuggestions.slice(0, 5).map(job => ({
        jobId: job.id,
        confidence: this.calculateJobConfidence(document, job),
        basis: 'date_amount',
        details: {
          jobNumber: job.number,
          customerName: job.customerName,
          address: `${job.address.street}, ${job.address.city}`,
          amount: job.total,
          date: job.appointmentDate,
        }
      }));

      matchResult.suggestions = suggestions;
      
      if (suggestions.length > 0) {
        matchResult.reasons.push(`Found ${suggestions.length} potential job matches`);
      } else {
        matchResult.reasons.push('No matching jobs found by date and amount');
      }

    } catch (error) {
      logger.error('Failed to find job suggestions:', error);
      matchResult.reasons.push('Could not search for job suggestions');
    }

    matchResult.action = 'hold_for_review';
    
    await this.createHold(
      document.id,
      'MISSING_PO',
      'No PO number found on invoice',
      ['Match to suggested job', 'Request PO from supplier', 'Create manual PO', 'Process as service stock']
    );

    return matchResult;
  }

  private static calculateJobConfidence(document: any, job: any): number {
    let confidence = 0;

    // Date proximity (within 7 days = higher confidence)
    const daysDiff = Math.abs(
      (new Date(document.invoiceDate).getTime() - new Date(job.appointmentDate || job.createdOn).getTime()) 
      / (24 * 60 * 60 * 1000)
    );
    
    if (daysDiff <= 1) confidence += 0.4;
    else if (daysDiff <= 3) confidence += 0.3;
    else if (daysDiff <= 7) confidence += 0.2;

    // Amount proximity (within 20% = higher confidence)
    const amountDiff = Math.abs(document.total - (job.total || 0)) / document.total;
    if (amountDiff <= 0.1) confidence += 0.4;
    else if (amountDiff <= 0.2) confidence += 0.3;
    else if (amountDiff <= 0.5) confidence += 0.2;

    // Supplier name matching (basic check)
    if (job.customerName && document.supplierNameRaw.toLowerCase().includes(job.customerName.toLowerCase())) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
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