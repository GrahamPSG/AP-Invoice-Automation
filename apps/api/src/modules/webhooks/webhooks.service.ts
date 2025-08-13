import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createCorrelationId } from '@paris/shared';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processGraphNotifications(payload: any): Promise<void> {
    try {
      const { value: notifications } = payload;
      
      if (!notifications || !Array.isArray(notifications)) {
        this.logger.warn('Invalid notification payload');
        return;
      }

      for (const notification of notifications) {
        await this.handleNotification(notification);
      }
    } catch (error) {
      this.logger.error('Failed to process Graph notifications', error);
      throw error;
    }
  }

  private async handleNotification(notification: any): Promise<void> {
    const { resourceData, changeType } = notification;
    
    if (changeType !== 'created') {
      return;
    }

    const correlationId = createCorrelationId();
    this.logger.log(`Processing email notification: ${correlationId}`);

    // Queue for processing
    await this.prisma.email.create({
      data: {
        messageId: resourceData.id,
        from: resourceData.from || 'unknown',
        receivedAt: new Date(resourceData.receivedDateTime),
        subject: resourceData.subject || '',
        status: 'QUEUED',
      },
    });

    // TODO: Dispatch to queue for attachment processing
  }
}