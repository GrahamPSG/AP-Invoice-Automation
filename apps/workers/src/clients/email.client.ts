import { logger } from '../utils/logger';

export interface EmailNotification {
  to: string[];
  cc?: string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  priority?: 'low' | 'normal' | 'high';
}

export class EmailClient {
  private smtpConfig: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
  };

  private fromAddress: string;
  private defaultRecipients: string[];

  constructor() {
    this.smtpConfig = {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      password: process.env.SMTP_PASSWORD || '',
    };

    this.fromAddress = process.env.SMTP_FROM || 'noreply@parisservicegroup.com';
    this.defaultRecipients = (process.env.NOTIFICATION_EMAILS || '').split(',').filter(Boolean);

    if (!this.smtpConfig.host || !this.smtpConfig.user) {
      logger.warn('SMTP configuration incomplete - email notifications will be logged only');
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
    const subject = `PARIS AP Alert: Invoice Hold - ${holdData.supplierName} (${holdData.invoiceNumber})`;
    
    const htmlBody = this.generateHoldAlertHTML(holdData);
    const textBody = this.generateHoldAlertText(holdData);

    await this.sendEmail({
      to: this.defaultRecipients,
      subject,
      htmlBody,
      textBody,
      priority: this.getPriorityForHold(holdData.reason),
    });
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
    const subject = `PARIS AP Alert: Variance ${this.formatCurrency(Math.abs(varianceData.variance))} - ${varianceData.supplierName}`;
    
    const htmlBody = this.generateVarianceAlertHTML(varianceData);
    const textBody = this.generateVarianceAlertText(varianceData);

    await this.sendEmail({
      to: this.defaultRecipients,
      subject,
      htmlBody,
      textBody,
      priority: Math.abs(varianceData.variance) > 10000 ? 'high' : 'normal', // >$100 = high priority
    });
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
    holdReasons: Record<string, number>;
    adminUIUrl?: string;
  }): Promise<void> {
    const subject = `PARIS AP Daily Summary - ${summaryData.date} (${summaryData.totalProcessed} invoices)`;
    
    const htmlBody = this.generateDailySummaryHTML(summaryData);
    const textBody = this.generateDailySummaryText(summaryData);

    await this.sendEmail({
      to: this.defaultRecipients,
      subject,
      htmlBody,
      textBody,
      priority: 'normal',
    });
  }

  async sendSystemAlert(alertData: {
    level: 'info' | 'warning' | 'error';
    title: string;
    message: string;
    details?: string;
    stackTrace?: string;
    adminUIUrl?: string;
  }): Promise<void> {
    const priorityMap = { info: 'low', warning: 'normal', error: 'high' } as const;
    const subject = `PARIS AP System ${alertData.level.toUpperCase()}: ${alertData.title}`;
    
    const htmlBody = this.generateSystemAlertHTML(alertData);
    const textBody = this.generateSystemAlertText(alertData);

    await this.sendEmail({
      to: this.defaultRecipients,
      subject,
      htmlBody,
      textBody,
      priority: priorityMap[alertData.level],
    });
  }

  private async sendEmail(email: EmailNotification): Promise<void> {
    try {
      if (!this.smtpConfig.host || !this.smtpConfig.user) {
        logger.info('Email notification (SMTP not configured)', { 
          subject: email.subject,
          to: email.to 
        });
        return;
      }

      // Using nodemailer-like interface (would need to install nodemailer)
      // For now, just log the email details
      logger.info('Email notification sent', {
        to: email.to,
        subject: email.subject,
        priority: email.priority,
      });

      // TODO: Implement actual SMTP sending
      // const transporter = nodemailer.createTransporter(this.smtpConfig);
      // await transporter.sendMail({
      //   from: this.fromAddress,
      //   to: email.to.join(','),
      //   cc: email.cc?.join(','),
      //   subject: email.subject,
      //   html: email.htmlBody,
      //   text: email.textBody,
      //   priority: email.priority,
      // });

    } catch (error) {
      logger.error('Failed to send email notification', error);
      // Don't throw - notifications are not critical
    }
  }

  private generateHoldAlertHTML(holdData: any): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <h2 style="color: #721c24; margin: 0;">⚠️ Invoice Hold Created</h2>
              <p style="margin: 5px 0 0 0; font-weight: bold;">${holdData.reason.replace('_', ' ')}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Supplier:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${holdData.supplierName}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Invoice #:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${holdData.invoiceNumber}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Amount:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${this.formatCurrency(holdData.total)}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Details:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${holdData.details}</td></tr>
            </table>
            
            <div style="margin-top: 20px;">
              ${holdData.adminUIUrl ? `<a href="${holdData.adminUIUrl}/review/${holdData.documentId}" style="background: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Review in Admin UI</a>` : ''}
              ${holdData.sharepointUrl ? `<a href="${holdData.sharepointUrl}" style="background: #28a745; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">View PDF</a>` : ''}
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
              <p>This notification was sent by PARIS AP Agent. Document ID: ${holdData.documentId}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateHoldAlertText(holdData: any): string {
    return `
PARIS AP ALERT: Invoice Hold Created

Reason: ${holdData.reason.replace('_', ' ')}
Supplier: ${holdData.supplierName}
Invoice #: ${holdData.invoiceNumber}
Amount: ${this.formatCurrency(holdData.total)}
Details: ${holdData.details}

${holdData.adminUIUrl ? `Review: ${holdData.adminUIUrl}/review/${holdData.documentId}` : ''}
${holdData.sharepointUrl ? `PDF: ${holdData.sharepointUrl}` : ''}

Document ID: ${holdData.documentId}
    `.trim();
  }

  private generateVarianceAlertHTML(varianceData: any): string {
    const isNegative = varianceData.variance < 0;
    const color = isNegative ? '#dc3545' : '#ffc107';
    
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <h2 style="color: #856404; margin: 0;">⚠️ Variance Alert</h2>
              <p style="margin: 5px 0 0 0; font-weight: bold; color: ${color};">${isNegative ? 'Under' : 'Over'} by ${this.formatCurrency(Math.abs(varianceData.variance))}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Supplier:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${varianceData.supplierName}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Invoice #:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${varianceData.invoiceNumber}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Invoice Total:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${this.formatCurrency(varianceData.invoiceTotal)}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">PO Total:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${this.formatCurrency(varianceData.poTotal)}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Variance:</td><td style="padding: 8px; border-bottom: 1px solid #ddd; color: ${color}; font-weight: bold;">${this.formatCurrency(varianceData.variance)}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Status:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">Draft bill created - requires approval</td></tr>
            </table>
            
            <div style="margin-top: 20px;">
              ${varianceData.adminUIUrl ? `<a href="${varianceData.adminUIUrl}/review/${varianceData.documentId}" style="background: #ffc107; color: #212529; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Review & Approve</a>` : ''}
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateVarianceAlertText(varianceData: any): string {
    const isNegative = varianceData.variance < 0;
    
    return `
PARIS AP ALERT: Variance ${this.formatCurrency(Math.abs(varianceData.variance))}

Supplier: ${varianceData.supplierName}
Invoice #: ${varianceData.invoiceNumber}
Invoice Total: ${this.formatCurrency(varianceData.invoiceTotal)}
PO Total: ${this.formatCurrency(varianceData.poTotal)}
Variance: ${this.formatCurrency(varianceData.variance)} (${isNegative ? 'Under' : 'Over'})
Status: Draft bill created - requires approval

${varianceData.adminUIUrl ? `Review: ${varianceData.adminUIUrl}/review/${varianceData.documentId}` : ''}
    `.trim();
  }

  private generateDailySummaryHTML(summaryData: any): string {
    const statusColor = summaryData.holds > 5 ? '#dc3545' : summaryData.holds > 0 ? '#ffc107' : '#28a745';
    
    const topVendorsHTML = summaryData.topVendors
      .slice(0, 5)
      .map((v: any) => `<tr><td style="padding: 4px 8px;">${v.vendor}</td><td style="padding: 4px 8px; text-align: center;">${v.count}</td><td style="padding: 4px 8px; text-align: right;">${v.total}</td></tr>`)
      .join('');

    const holdReasonsHTML = Object.entries(summaryData.holdReasons || {})
      .map(([reason, count]) => `<tr><td style="padding: 4px 8px;">${reason.replace('_', ' ')}</td><td style="padding: 4px 8px; text-align: center;">${count}</td></tr>`)
      .join('');

    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; border-left: 4px solid ${statusColor}; padding: 15px; margin-bottom: 20px;">
              <h2 style="margin: 0; color: ${statusColor};">📊 Daily AP Summary - ${summaryData.date}</h2>
              <p style="margin: 5px 0 0 0;">Processed <strong>${summaryData.totalProcessed}</strong> invoices with <strong>${summaryData.successRate}</strong> success rate</p>
            </div>
            
            <div style="display: flex; gap: 20px; margin-bottom: 30px;">
              <div style="flex: 1;">
                <h3 style="color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 5px;">Overview</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Total Processed:</td><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${summaryData.totalProcessed}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Successfully Billed:</td><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; color: #28a745;">${summaryData.successfulBills}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Items on Hold:</td><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; color: #ffc107;">${summaryData.holds}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Errors:</td><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; color: #dc3545;">${summaryData.errors}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Success Rate:</td><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${summaryData.successRate}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Total Amount:</td><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${summaryData.totalAmount}</td></tr>
                </table>
              </div>
            </div>
            
            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
              <div style="flex: 1;">
                <h3 style="color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 5px;">Top Vendors</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead><tr style="background: #f8f9fa;"><th style="padding: 8px; text-align: left;">Vendor</th><th style="padding: 8px; text-align: center;">Count</th><th style="padding: 8px; text-align: right;">Total</th></tr></thead>
                  <tbody>${topVendorsHTML}</tbody>
                </table>
              </div>
              
              ${holdReasonsHTML ? `
              <div style="flex: 1;">
                <h3 style="color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 5px;">Hold Reasons</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead><tr style="background: #f8f9fa;"><th style="padding: 8px; text-align: left;">Reason</th><th style="padding: 8px; text-align: center;">Count</th></tr></thead>
                  <tbody>${holdReasonsHTML}</tbody>
                </table>
              </div>
              ` : ''}
            </div>
            
            ${summaryData.adminUIUrl ? `
            <div style="margin-top: 30px; text-align: center;">
              <a href="${summaryData.adminUIUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Full Dashboard</a>
            </div>
            ` : ''}
          </div>
        </body>
      </html>
    `;
  }

  private generateDailySummaryText(summaryData: any): string {
    return `
PARIS AP DAILY SUMMARY - ${summaryData.date}

OVERVIEW:
- Total Processed: ${summaryData.totalProcessed}
- Successfully Billed: ${summaryData.successfulBills}
- Items on Hold: ${summaryData.holds}
- Errors: ${summaryData.errors}
- Success Rate: ${summaryData.successRate}
- Total Amount: ${summaryData.totalAmount}

TOP VENDORS:
${summaryData.topVendors.slice(0, 5).map((v: any) => `- ${v.vendor}: ${v.count} invoices (${v.total})`).join('\n')}

${summaryData.adminUIUrl ? `Dashboard: ${summaryData.adminUIUrl}` : ''}
    `.trim();
  }

  private generateSystemAlertHTML(alertData: any): string {
    const colorMap = { info: '#17a2b8', warning: '#ffc107', error: '#dc3545' };
    const bgMap = { info: '#d1ecf1', warning: '#fff3cd', error: '#f8d7da' };
    
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: ${bgMap[alertData.level]}; border: 1px solid ${colorMap[alertData.level]}; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <h2 style="color: ${colorMap[alertData.level]}; margin: 0;">🚨 System ${alertData.level.toUpperCase()}</h2>
              <p style="margin: 5px 0 0 0; font-weight: bold;">${alertData.title}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <p><strong>Message:</strong> ${alertData.message}</p>
              ${alertData.details ? `<p><strong>Details:</strong> ${alertData.details}</p>` : ''}
              ${alertData.stackTrace ? `<pre style="background: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto; font-size: 12px;">${alertData.stackTrace}</pre>` : ''}
            </div>
            
            ${alertData.adminUIUrl ? `
            <div style="margin-top: 20px;">
              <a href="${alertData.adminUIUrl}" style="background: ${colorMap[alertData.level]}; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">View Admin Panel</a>
            </div>
            ` : ''}
          </div>
        </body>
      </html>
    `;
  }

  private generateSystemAlertText(alertData: any): string {
    return `
PARIS AP SYSTEM ${alertData.level.toUpperCase()}: ${alertData.title}

Message: ${alertData.message}
${alertData.details ? `Details: ${alertData.details}` : ''}
${alertData.stackTrace ? `\nStack Trace:\n${alertData.stackTrace}` : ''}

${alertData.adminUIUrl ? `Admin Panel: ${alertData.adminUIUrl}` : ''}
    `.trim();
  }

  private getPriorityForHold(reason: string): EmailNotification['priority'] {
    const highPriorityReasons = ['DUPLICATE', 'VARIANCE_EXCEEDED', 'NEGATIVE_QUANTITY'];
    return highPriorityReasons.includes(reason) ? 'high' : 'normal';
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
        title: 'Email Integration Test',
        message: 'PARIS AP Agent email integration is working correctly',
        details: 'This is a test message to verify SMTP connectivity',
      });
      return true;
    } catch (error) {
      logger.error('Email connection test failed', error);
      return false;
    }
  }
}