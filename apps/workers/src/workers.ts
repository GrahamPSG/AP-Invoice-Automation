import { Worker } from 'bullmq';
import { createConnection } from './config/redis';
import { QUEUE_NAMES } from '@paris/shared';
import { DocumentSplitProcessor } from './processors/document-split.processor';
import { DocumentParseProcessor } from './processors/document-parse.processor';
import { ServiceTitanMatchProcessor } from './processors/servicetitan-match.processor';
import { ServiceTitanBillProcessor } from './processors/servicetitan-bill.processor';
import { FileWriteProcessor } from './processors/file-write.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { logger } from './utils/logger';

export function createWorkers(): Worker[] {
  const connection = createConnection();
  
  const workers = [
    new Worker(QUEUE_NAMES.SPLIT, DocumentSplitProcessor.process, {
      connection,
      concurrency: 2,
    }),
    
    new Worker(QUEUE_NAMES.PARSE, DocumentParseProcessor.process, {
      connection,
      concurrency: 3,
    }),
    
    new Worker(QUEUE_NAMES.MATCH, ServiceTitanMatchProcessor.process, {
      connection,
      concurrency: 2,
    }),
    
    new Worker(QUEUE_NAMES.BILL, ServiceTitanBillProcessor.process, {
      connection,
      concurrency: 2,
    }),
    
    new Worker(QUEUE_NAMES.WRITE, FileWriteProcessor.process, {
      connection,
      concurrency: 1,
    }),
    
    new Worker(QUEUE_NAMES.NOTIFY, NotificationProcessor.process, {
      connection,
      concurrency: 5,
    }),
  ];

  // Add error handlers to all workers
  workers.forEach((worker, index) => {
    const queueNames = Object.values(QUEUE_NAMES);
    const queueName = queueNames[index];
    
    worker.on('completed', (job, returnvalue) => {
      logger.info(`Job completed in ${queueName}`, { 
        jobId: job.id, 
        returnvalue 
      });
    });

    worker.on('failed', (job, error) => {
      logger.error(`Job failed in ${queueName}`, { 
        jobId: job?.id, 
        error: error.message 
      });
    });

    worker.on('error', (error) => {
      logger.error(`Worker error in ${queueName}`, error);
    });
  });

  return workers;
}

export async function startWorkers(): Promise<Worker[]> {
  logger.info('Starting workers...');
  const workers = createWorkers();
  
  // Wait for all workers to be ready
  await Promise.all(workers.map(worker => worker.waitUntilReady()));
  
  logger.info(`Started ${workers.length} workers`);
  return workers;
}

export async function closeWorkers(workers: Worker[]): Promise<void> {
  logger.info('Closing workers...');
  await Promise.all(workers.map(worker => worker.close()));
  logger.info('All workers closed');
}