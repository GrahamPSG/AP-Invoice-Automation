import { logger } from '../utils/logger';

export interface TeamsNotification {
  title: string;
  text: string;
  color: 'good' | 'warning' | 'attention';
  facts?: Array<{ name: string; value: string }>;
  actions?: Array<{
    type: 'OpenUri';
    name: string;
    targets: Array<{ os: string; uri: string }>;
  }>;
}

export class TeamsClient {
  private webhookUrl: string;
  private channelId: string;

  constructor() {
    this.webhookUrl = process.env.TEAMS_WEBHOOK_URL || '';
    this.channelId = process.env.TEAMS_CHANNEL_ID || '';
    
    if (!this.webhookUrl) {
      logger.warn('Teams webhook URL not configured - notifications will be logged only');
    }
  }

  async sendHoldAlert(holdData: {
    documentId: string;
    reason: string;
    details: string;
    supplierName: string;
    invoiceNumber: string;
    total: number;
    adminUIUrl?: string;
    sharepointUrl?: string;
  }): Promise<void> {
    const notification: TeamsNotification = {
      title: `🚨 Invoice Hold Created: ${holdData.reason.replace('_', ' ')}`,
      text: `**${holdData.supplierName}** - Invoice ${holdData.invoiceNumber} requires attention`,
      color: 'attention',
      facts: [
        { name: 'Supplier', value: holdData.supplierName },
        { name: 'Invoice #', value: holdData.invoiceNumber },
        { name: 'Amount', value: this.formatCurrency(holdData.total) },
        { name: 'Reason', value: holdData.reason.replace('_', ' ') },
        { name: 'Details', value: holdData.details },
      ],
      actions: this.createActions(holdData.documentId, holdData.adminUIUrl, holdData.sharepointUrl),
    };

    await this.sendNotification(notification);
  }

  async sendVarianceAlert(varianceData: {
    documentId: string;
    supplierName: string;
    invoiceNumber: string;
    invoiceTotal: number;
    poTotal: number;
    variance: number;
    serviceTitanBillId?: string;
    adminUIUrl?: string;
  }): Promise<void> {
    const notification: TeamsNotification = {
      title: `⚠️ Variance Alert: ${this.formatCurrency(Math.abs(varianceData.variance))}`,
      text: `**${varianceData.supplierName}** - Invoice ${varianceData.invoiceNumber} has a significant variance`,
      color: 'warning',
      facts: [
        { name: 'Supplier', value: varianceData.supplierName },
        { name: 'Invoice #', value: varianceData.invoiceNumber },
        { name: 'Invoice Total', value: this.formatCurrency(varianceData.invoiceTotal) },
        { name: 'PO Total', value: this.formatCurrency(varianceData.poTotal) },
        { name: 'Variance', value: this.formatCurrency(varianceData.variance) },
        { name: 'Status', value: 'Draft bill created - requires approval' },
      ],
      actions: this.createActions(varianceData.documentId, varianceData.adminUIUrl),
    };

    await this.sendNotification(notification);
  }

  async sendDailySummary(summaryData: {
    date: string;
    totalProcessed: number;
    successfulBills: number;
    holds: number;
    errors: number;
    successRate: string;
    totalAmount: string;
    topVendors: Array<{ vendor: string; count: number; total: string }>;
    adminUIUrl?: string;
  }): Promise<void> {
    const emoji = summaryData.holds > 5 ? '🔴' : summaryData.holds > 0 ? '🟡' : '🟢';
    
    const topVendorsText = summaryData.topVendors
      .slice(0, 3)
      .map(v => `• ${v.vendor}: ${v.count} invoices (${v.total})`)
      .join('\n');

    const notification: TeamsNotification = {
      title: `${emoji} Daily AP Summary - ${summaryData.date}`,
      text: `Processed **${summaryData.totalProcessed}** invoices with **${summaryData.successRate}** success rate`,
      color: summaryData.holds > 5 ? 'attention' : summaryData.holds > 0 ? 'warning' : 'good',
      facts: [
        { name: 'Total Processed', value: summaryData.totalProcessed.toString() },
        { name: 'Successfully Billed', value: summaryData.successfulBills.toString() },
        { name: 'Items on Hold', value: summaryData.holds.toString() },
        { name: 'Errors', value: summaryData.errors.toString() },
        { name: 'Success Rate', value: summaryData.successRate },
        { name: 'Total Amount', value: summaryData.totalAmount },
        { name: 'Top Vendors', value: topVendorsText || 'None' },
      ],
      actions: summaryData.adminUIUrl ? [{
        type: 'OpenUri' as const,
        name: 'View Admin Dashboard',
        targets: [{ os: 'default', uri: summaryData.adminUIUrl }],
      }] : undefined,
    };

    await this.sendNotification(notification);
  }

  async sendSuccessNotification(successData: {
    supplierName: string;
    invoiceNumber: string;
    total: number;
    serviceTitanBillId: string;
    processingTimeMs: number;
  }): Promise<void> {
    // Only send success notifications for large amounts or when specifically enabled
    const shouldNotify = successData.total > 500000 || // > $5000
                        process.env.NOTIFY_ALL_SUCCESS === 'true';
    
    if (!shouldNotify) return;

    const notification: TeamsNotification = {
      title: `✅ Invoice Processed Successfully`,
      text: `**${successData.supplierName}** - Invoice ${successData.invoiceNumber} completed`,
      color: 'good',
      facts: [
        { name: 'Supplier', value: successData.supplierName },
        { name: 'Invoice #', value: successData.invoiceNumber },
        { name: 'Amount', value: this.formatCurrency(successData.total) },
        { name: 'ServiceTitan Bill ID', value: successData.serviceTitanBillId },
        { name: 'Processing Time', value: `${(successData.processingTimeMs / 1000).toFixed(1)}s` },
      ],
    };

    await this.sendNotification(notification);
  }

  async sendSystemAlert(alertData: {
    level: 'info' | 'warning' | 'error';
    title: string;
    message: string;
    details?: string;
    adminUIUrl?: string;
  }): Promise<void> {
    const colorMap = {
      info: 'good' as const,
      warning: 'warning' as const,
      error: 'attention' as const,
    };

    const emojiMap = {
      info: '💡',
      warning: '⚠️',
      error: '🚨',
    };

    const notification: TeamsNotification = {
      title: `${emojiMap[alertData.level]} ${alertData.title}`,
      text: alertData.message,
      color: colorMap[alertData.level],
      facts: alertData.details ? [
        { name: 'Details', value: alertData.details }
      ] : undefined,
      actions: alertData.adminUIUrl ? [{
        type: 'OpenUri' as const,
        name: 'View Admin Panel',
        targets: [{ os: 'default', uri: alertData.adminUIUrl }],
      }] : undefined,
    };

    await this.sendNotification(notification);
  }

  private async sendNotification(notification: TeamsNotification): Promise<void> {
    try {
      if (!this.webhookUrl) {
        logger.info('Teams notification (webhook not configured)', notification);
        return;
      }

      const payload = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        themeColor: this.getThemeColor(notification.color),
        summary: notification.title,
        sections: [
          {
            activityTitle: notification.title,
            activityText: notification.text,
            facts: notification.facts || [],
          }
        ],
        potentialAction: notification.actions || [],
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Teams API error: ${response.status} ${response.statusText}`);
      }

      logger.info(`Teams notification sent: ${notification.title}`);

    } catch (error) {
      logger.error('Failed to send Teams notification', error);
      // Don't throw - notifications are not critical
    }
  }

  private createActions(
    documentId: string, 
    adminUIUrl?: string, 
    sharepointUrl?: string
  ): TeamsNotification['actions'] {
    const actions: NonNullable<TeamsNotification['actions']> = [];

    if (adminUIUrl) {
      actions.push({
        type: 'OpenUri',
        name: 'Review in Admin UI',
        targets: [{ os: 'default', uri: `${adminUIUrl}/review/${documentId}` }],
      });
    }

    if (sharepointUrl) {
      actions.push({
        type: 'OpenUri',
        name: 'View PDF in SharePoint',
        targets: [{ os: 'default', uri: sharepointUrl }],
      });
    }

    return actions.length > 0 ? actions : undefined;
  }

  private getThemeColor(color: TeamsNotification['color']): string {
    switch (color) {
      case 'good': return '28a745';
      case 'warning': return 'ffc107';
      case 'attention': return 'dc3545';
      default: return '007bff';
    }
  }

  private formatCurrency(cents: number): string {
    const dollars = cents / 100;
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(dollars);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.sendSystemAlert({
        level: 'info',
        title: 'Teams Integration Test',
        message: 'PARIS AP Agent Teams integration is working correctly',
        details: 'This is a test message to verify Teams webhook connectivity',
      });
      return true;
    } catch (error) {
      logger.error('Teams connection test failed', error);
      return false;
    }
  }
}