import { Worker, Queue } from 'bullmq';
import { createConnection } from './config/redis';
import { QUEUE_NAMES } from '@paris/shared';
import { EmailIngestProcessor } from './processors/email-ingest.processor';
import { DocumentSplitProcessor } from './processors/document-split.processor';
import { DocumentParseProcessor } from './processors/document-parse.processor';
import { ServiceTitanMatchProcessor } from './processors/servicetitan-match.processor';
import { ServiceTitanBillProcessor } from './processors/servicetitan-bill.processor';
import { FileWriteProcessor } from './processors/file-write.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { EmailSchedulerService } from './services/email-scheduler.service';
import { logger } from './utils/logger';

async function main() {
  logger.info('Starting PARIS AP Workers...');

  const connection = createConnection();

  // Create workers for each queue (simplified workflow - removed ServiceTitan workers)
  const workers = [
    new Worker(QUEUE_NAMES.INGEST, EmailIngestProcessor.process, { connection, concurrency: 2 }),
    new Worker(QUEUE_NAMES.SPLIT, DocumentSplitProcessor.process, { connection, concurrency: 2 }),
    new Worker(QUEUE_NAMES.PARSE, DocumentParseProcessor.process, { connection, concurrency: 3 }),
    new Worker(QUEUE_NAMES.WRITE, FileWriteProcessor.process, { connection, concurrency: 1 }),
    new Worker(QUEUE_NAMES.NOTIFY, NotificationProcessor.process, { connection, concurrency: 5 }),
  ];

  logger.info(`Started ${workers.length} workers`);

  // Start email scheduler (7am and 2pm daily)
  const emailScheduler = new EmailSchedulerService();
  emailScheduler.startScheduler();

  logger.info('Email scheduler started (7am and 2pm daily)');

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down workers...');
    await Promise.all(workers.map(worker => worker.close()));
    process.exit(0);
  });

  logger.info('All workers and schedulers started successfully');
}

main().catch((error) => {
  logger.error('Failed to start workers', error);
  process.exit(1);
});
