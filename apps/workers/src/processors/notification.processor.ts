import { Job } from 'bullmq';
import { QueueMessage, ProcessingResult } from '@paris/shared';
import { TeamsClient } from '../clients/teams.client';
import { EmailClient } from '../clients/email.client';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const teamsClient = new TeamsClient();
const emailClient = new EmailClient();
const prisma = new PrismaClient();

export class NotificationProcessor {
  static async process(job: Job<QueueMessage>): Promise<ProcessingResult> {
    const { id, payload } = job.data;
    
    try {
      logger.info(`Processing notification: ${id}`);
      
      const { type, data } = payload;
      
      switch (type) {
        case 'hold_created':
          return await this.sendHoldNotification(data);
          
        case 'variance_alert':
          return await this.sendVarianceNotification(data);
          
        case 'daily_summary':
          return await this.sendDailySummary(data);
          
        case 'success_notification':
          return await this.sendSuccessNotification(data);
          
        case 'system_alert':
          return await this.sendSystemAlert(data);
          
        default:
          throw new Error(`Unknown notification type: ${type}`);
      }
      
    } catch (error) {
      logger.error(`Notification failed: ${error.message}`, { id, error });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  private static async sendHoldNotification(data: {
    documentId: string;
    holdId: string;
  }): Promise<ProcessingResult> {
    try {
      // Get hold and document details
      const hold = await prisma.hold.findUnique({
        where: { id: data.holdId },
        include: {
          document: {
            include: {
              attachment: {
                include: {
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!hold) {
        throw new Error(`Hold ${data.holdId} not found`);
      }

      const adminUIUrl = process.env.ADMIN_UI_URL || 'http://localhost:3000';
      const sharepointUrl = hold.document.renamedPdfPath 
        ? this.buildSharePointUrl(hold.document.renamedPdfPath)
        : undefined;

      const notificationData = {
        documentId: hold.documentId,
        reason: hold.reason,
        details: hold.details,
        supplierName: hold.document.supplierNameRaw,
        invoiceNumber: hold.document.invoiceNumber,
        total: hold.document.total,
        adminUIUrl,
        sharepointUrl,
      };

      // Send to both Teams and email (parallel)
      await Promise.all([
        teamsClient.sendHoldAlert(notificationData),
        emailClient.sendHoldAlert(notificationData),
      ]);

      logger.info(`Hold notification sent for ${hold.reason}: ${hold.document.supplierNameRaw}`);

      return {
        success: true,
        message: `Hold notification sent: ${hold.reason}`,
      };

    } catch (error) {
      logger.error('Failed to send hold notification', error);
      throw error;
    }
  }

  private static async sendVarianceNotification(data: {
    documentId: string;
    billId: string;
    variance: number;
  }): Promise<ProcessingResult> {
    try {
      // Get document and match result details
      const document = await prisma.document.findUnique({
        where: { id: data.documentId },
        include: {
          matchResult: true,
          bill: true,
        },
      });

      if (!document || !document.matchResult) {
        throw new Error(`Document ${data.documentId} or match result not found`);
      }

      const adminUIUrl = process.env.ADMIN_UI_URL || 'http://localhost:3000';

      // Calculate PO total from document total and variance
      const poTotal = document.total - data.variance;

      const notificationData = {
        documentId: data.documentId,
        supplierName: document.supplierNameRaw,
        invoiceNumber: document.invoiceNumber,
        invoiceTotal: document.total,
        poTotal,
        variance: data.variance,
        serviceTitanBillId: document.bill?.serviceTitanBillId,
        adminUIUrl,
      };

      // Send to both Teams and email (parallel)
      await Promise.all([
        teamsClient.sendVarianceAlert(notificationData),
        emailClient.sendVarianceAlert(notificationData),
      ]);

      logger.info(`Variance notification sent: ${document.supplierNameRaw} (${data.variance/100})`);

      return {
        success: true,
        message: `Variance notification sent: $${Math.abs(data.variance)/100}`,
      };

    } catch (error) {
      logger.error('Failed to send variance notification', error);
      throw error;
    }
  }

  private static async sendDailySummary(data: {
    date: string;
    forceGenerate?: boolean;
  }): Promise<ProcessingResult> {
    try {
      const targetDate = data.date ? new Date(data.date) : new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Generate summary data
      const [
        totalProcessed,
        successfulBills,
        holds,
        errors,
        totalAmount,
        vendorBreakdown,
        holdReasons,
      ] = await Promise.all([
        prisma.document.count({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } }
        }),
        prisma.bill.count({
          where: { 
            createdAt: { gte: startOfDay, lte: endOfDay },
            status: 'FINALIZED'
          }
        }),
        prisma.hold.count({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } }
        }),
        prisma.email.count({
          where: { 
            createdAt: { gte: startOfDay, lte: endOfDay },
            status: 'ERROR'
          }
        }),
        prisma.document.aggregate({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } },
          _sum: { total: true }
        }),
        prisma.document.groupBy({
          by: ['supplierNameNormalized'],
          where: { createdAt: { gte: startOfDay, lte: endOfDay } },
          _count: true,
          _sum: { total: true },
          orderBy: { _count: { _all: 'desc' } },
          take: 10,
        }),
        prisma.hold.groupBy({
          by: ['reason'],
          where: { createdAt: { gte: startOfDay, lte: endOfDay } },
          _count: true,
        }),
      ]);

      const successRate = totalProcessed > 0 
        ? ((successfulBills / totalProcessed) * 100).toFixed(1) + '%'
        : '0.0%';

      const adminUIUrl = process.env.ADMIN_UI_URL || 'http://localhost:3000';

      const summaryData = {
        date: targetDate.toISOString().split('T')[0],
        totalProcessed,
        successfulBills,
        holds,
        errors,
        successRate,
        totalAmount: this.formatCurrency(totalAmount._sum.total || 0),
        topVendors: vendorBreakdown.map(v => ({
          vendor: v.supplierNameNormalized,
          count: v._count,
          total: this.formatCurrency(v._sum.total || 0),
        })),
        holdReasons: holdReasons.reduce((acc, h) => {
          acc[h.reason] = h._count;
          return acc;
        }, {} as Record<string, number>),
        adminUIUrl,
      };

      // Send to both Teams and email (parallel)
      await Promise.all([
        teamsClient.sendDailySummary(summaryData),
        emailClient.sendDailySummary(summaryData),
      ]);

      logger.info(`Daily summary sent for ${summaryData.date}: ${totalProcessed} processed`);

      return {
        success: true,
        message: `Daily summary sent: ${totalProcessed} invoices processed`,
        data: summaryData,
      };

    } catch (error) {
      logger.error('Failed to send daily summary', error);
      throw error;
    }
  }

  private static async sendSuccessNotification(data: {
    documentId: string;
    billId: string;
    processingTimeMs: number;
  }): Promise<ProcessingResult> {
    try {
      const document = await prisma.document.findUnique({
        where: { id: data.documentId },
        include: { bill: true },
      });

      if (!document || !document.bill) {
        throw new Error(`Document ${data.documentId} or bill not found`);
      }

      const notificationData = {
        supplierName: document.supplierNameRaw,
        invoiceNumber: document.invoiceNumber,
        total: document.total,
        serviceTitanBillId: document.bill.serviceTitanBillId || data.billId,
        processingTimeMs: data.processingTimeMs,
      };

      // Only send Teams notification for success (email is opt-in)
      await teamsClient.sendSuccessNotification(notificationData);

      return {
        success: true,
        message: 'Success notification sent',
      };

    } catch (error) {
      logger.error('Failed to send success notification', error);
      // Don't throw for success notifications - they're optional
      return {
        success: true,
        message: 'Success notification failed but processing continues',
      };
    }
  }

  private static async sendSystemAlert(data: {
    level: 'info' | 'warning' | 'error';
    title: string;
    message: string;
    details?: string;
    stackTrace?: string;
  }): Promise<ProcessingResult> {
    try {
      const adminUIUrl = process.env.ADMIN_UI_URL || 'http://localhost:3000';

      const alertData = {
        ...data,
        adminUIUrl,
      };

      // Send to both Teams and email (parallel)
      await Promise.all([
        teamsClient.sendSystemAlert(alertData),
        emailClient.sendSystemAlert(alertData),
      ]);

      logger.info(`System alert sent: ${data.level} - ${data.title}`);

      return {
        success: true,
        message: `System alert sent: ${data.title}`,
      };

    } catch (error) {
      logger.error('Failed to send system alert', error);
      throw error;
    }
  }

  private static buildSharePointUrl(filePath: string): string {
    const baseUrl = process.env.SP_BASE_URL || 'https://parisservicegroup.sharepoint.com';
    const sitePath = process.env.SP_SITE_PATH || '/sites/ParisMechanical';
    
    // Convert file path to SharePoint URL format
    const encodedPath = encodeURIComponent(filePath);
    return `${baseUrl}${sitePath}/_layouts/15/Doc.aspx?sourcedoc=${encodedPath}`;
  }

  private static formatCurrency(cents: number): string {
    const dollars = cents / 100;
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(dollars);
  }
}