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
import { logger } from './utils/logger';

async function main() {
  logger.info('Starting PARIS AP Workers...');

  const connection = createConnection();

  // Create workers for each queue
  const workers = [
    new Worker(QUEUE_NAMES.INGEST, EmailIngestProcessor.process, { connection }),
    new Worker(QUEUE_NAMES.SPLIT, DocumentSplitProcessor.process, { connection }),
    new Worker(QUEUE_NAMES.PARSE, DocumentParseProcessor.process, { connection }),
    new Worker(QUEUE_NAMES.MATCH, ServiceTitanMatchProcessor.process, { connection }),
    new Worker(QUEUE_NAMES.BILL, ServiceTitanBillProcessor.process, { connection }),
    new Worker(QUEUE_NAMES.WRITE, FileWriteProcessor.process, { connection }),
    new Worker(QUEUE_NAMES.NOTIFY, NotificationProcessor.process, { connection }),
  ];\n\n  // Handle graceful shutdown\n  process.on('SIGINT', async () => {\n    logger.info('Shutting down workers...');\n    await Promise.all(workers.map(worker => worker.close()));\n    process.exit(0);\n  });\n\n  logger.info('All workers started successfully');\n}\n\nmain().catch((error) => {\n  logger.error('Failed to start workers', error);\n  process.exit(1);\n});"