import { Queue } from 'bullmq';
import { createConnection } from '../config/redis';
import { QUEUE_NAMES, createCorrelationId } from '@paris/shared';
import { GraphClient } from '../clients/graph.client';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const graphClient = new GraphClient();

export class EmailSchedulerService {
  private ingestQueue: Queue;

  constructor() {
    const connection = createConnection();
    this.ingestQueue = new Queue(QUEUE_NAMES.INGEST, { connection });
  }

  /**
   * Fetch emails from the shared mailbox and queue them for processing
   */
  async checkForNewEmails(): Promise<void> {
    try {
      logger.info('Checking for new emails from ap@parisservicegroup.com...');

      // List recent unread emails with attachments
      const messages = await graphClient.listMessages(50);

      if (!messages.value || messages.value.length === 0) {
        logger.info('No new emails found');
        return;
      }

      logger.info(`Found ${messages.value.length} emails to process`);

      let queuedCount = 0;

      for (const message of messages.value) {
        // Only process emails with attachments
        if (!message.hasAttachments) {
          continue;
        }

        // Check if we've already processed this email
        const existingEmail = await prisma.email.findUnique({
          where: { messageId: message.id },
        });

        if (existingEmail) {
          logger.debug(`Email already processed: ${message.id}`);
          continue;
        }

        // Create email record
        await prisma.email.create({
          data: {
            messageId: message.id,
            from: message.from?.emailAddress?.address || 'unknown',
            receivedAt: new Date(message.receivedDateTime),
            subject: message.subject || 'No subject',
            status: 'QUEUED',
          },
        });

        // Add to email ingestion queue
        await this.ingestQueue.add(
          'email-ingest',
          {
            id: createCorrelationId(),
            payload: {
              messageId: message.id,
            },
          },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
          }
        );

        queuedCount++;
        logger.info(`Queued email for processing: ${message.subject}`, {
          messageId: message.id,
        });
      }

      logger.info(`Email check completed. Queued ${queuedCount} emails for processing.`);
    } catch (error: any) {
      logger.error(`Email check failed: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Start the email scheduler (7am and 2pm daily)
   */
  startScheduler(): void {
    // Schedule for 7am daily
    this.scheduleAt('7:00', 'Morning email check');

    // Schedule for 2pm (14:00) daily
    this.scheduleAt('14:00', 'Afternoon email check');

    logger.info('Email scheduler started (7am and 2pm daily)');
  }

  /**
   * Schedule email check at a specific time
   * @param time - Time in HH:MM format (24-hour)
   * @param description - Description for logging
   */
  private scheduleAt(time: string, description: string): void {
    const [hours, minutes] = time.split(':').map(Number);

    const scheduleCheck = () => {
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);

      // If the scheduled time has passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const delay = scheduledTime.getTime() - now.getTime();

      logger.info(`${description} scheduled for ${scheduledTime.toLocaleString()}`, {
        delayMs: delay,
      });

      setTimeout(() => {
        logger.info(`Running ${description}...`);
        this.checkForNewEmails()
          .then(() => {
            logger.info(`${description} completed successfully`);
          })
          .catch((error) => {
            logger.error(`${description} failed`, error);
          })
          .finally(() => {
            // Schedule the next check (24 hours later)
            scheduleCheck();
          });
      }, delay);
    };

    scheduleCheck();
  }

  /**
   * Manually trigger email check (useful for testing or manual runs)
   */
  async triggerManualCheck(): Promise<void> {
    logger.info('Manual email check triggered');
    await this.checkForNewEmails();
  }
}
