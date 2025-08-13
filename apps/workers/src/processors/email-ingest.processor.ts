import { Job } from 'bullmq';
import { QueueMessage, ProcessingResult } from '@paris/shared';
import { GraphClient } from '../clients/graph.client';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const graphClient = new GraphClient();

export class EmailIngestProcessor {
  static async process(job: Job<QueueMessage>): Promise<ProcessingResult> {
    const { id, payload } = job.data;
    
    try {
      logger.info(`Processing email ingest: ${id}`);
      
      // Fetch email details from Graph API
      const emailData = await graphClient.getMessage(payload.messageId);
      
      // Process attachments
      const attachments = [];
      for (const attachment of emailData.attachments || []) {
        if (attachment.contentType === 'application/pdf') {
          const attachmentData = await graphClient.getAttachment(
            payload.messageId, 
            attachment.id
          );
          
          // Store attachment and queue for processing
          attachments.push(attachmentData);
        }
      }
      
      // Update database
      await prisma.email.update({
        where: { messageId: payload.messageId },
        data: {
          status: 'PROCESSING',
          attachments: {
            create: attachments.map(att => ({
              name: att.name,
              contentType: att.contentType,
              size: att.size,
              sha256: att.sha256
            }))
          }
        }
      });
      
      return {
        success: true,
        message: `Processed ${attachments.length} attachments`,
        nextStep: 'document-split'
      };
      
    } catch (error) {
      logger.error(`Email ingest failed: ${error.message}`, { id, error });
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}