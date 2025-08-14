import { Queue, Worker, QueueEvents } from 'bullmq';
import { createConnection } from '../config/redis';
import { QUEUE_NAMES, QueueMessage, createCorrelationId } from '@paris/shared';
import { logger } from '../utils/logger';

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  workers: number;
}

export interface JobProgress {
  jobId: string;
  queueName: string;
  progress: number;
  data: any;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  createdAt: string;
  processedAt?: string;
  finishedAt?: string;
  error?: string;
}

export class QueueManagerService {
  private queues: Map<string, Queue> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private connection = createConnection();

  constructor() {
    this.initializeQueues();
  }

  private initializeQueues() {
    // Create all queues
    Object.values(QUEUE_NAMES).forEach(queueName => {
      const queue = new Queue(queueName, { 
        connection: this.connection,
        defaultJobOptions: {
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 50,      // Keep last 50 failed jobs
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      const queueEvents = new QueueEvents(queueName, { 
        connection: this.connection 
      });

      this.queues.set(queueName, queue);
      this.queueEvents.set(queueName, queueEvents);

      // Set up event listeners for monitoring
      this.setupQueueEventListeners(queueName, queueEvents);
    });

    logger.info(`Initialized ${this.queues.size} queues`);
  }

  private setupQueueEventListeners(queueName: string, queueEvents: QueueEvents) {
    queueEvents.on('completed', ({ jobId, returnvalue, prev }) => {
      logger.info(`Job completed in ${queueName}`, { jobId, returnvalue });
    });

    queueEvents.on('failed', ({ jobId, failedReason, prev }) => {
      logger.error(`Job failed in ${queueName}`, { jobId, failedReason });
    });

    queueEvents.on('stalled', ({ jobId, prev }) => {
      logger.warn(`Job stalled in ${queueName}`, { jobId });
    });

    queueEvents.on('error', (error) => {
      logger.error(`Queue error in ${queueName}`, error);
    });
  }

  async addJob<T = any>(
    queueName: string, 
    jobName: string, 
    data: T, 
    options: {
      delay?: number;
      priority?: number;
      correlationId?: string;
      retryLimit?: number;
    } = {}
  ): Promise<string> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const correlationId = options.correlationId || createCorrelationId();
    
    const queueMessage: QueueMessage<T> = {
      id: correlationId,
      correlationId,
      timestamp: new Date().toISOString(),
      payload: data,
      retryCount: 0,
      metadata: {
        queueName,
        jobName,
        addedAt: new Date().toISOString(),
      },
    };

    const job = await queue.add(jobName, queueMessage, {
      delay: options.delay,
      priority: options.priority,
      attempts: options.retryLimit || 3,
      jobId: correlationId,
    });

    logger.info(`Job added to ${queueName}`, { 
      jobId: job.id, 
      jobName, 
      correlationId 
    });

    return job.id!;
  }

  async getQueueStats(): Promise<QueueStats[]> {
    const stats: QueueStats[] = [];

    for (const [queueName, queue] of this.queues) {
      try {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaiting(),
          queue.getActive(),
          queue.getCompleted(),
          queue.getFailed(),
          queue.getDelayed(),
        ]);

        const isPaused = await queue.isPaused();
        const workers = await queue.getWorkers();

        stats.push({
          name: queueName,
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          delayed: delayed.length,
          paused: isPaused,
          workers: workers.length,
        });
      } catch (error) {
        logger.error(`Failed to get stats for queue ${queueName}`, error);
        stats.push({
          name: queueName,
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: false,
          workers: 0,
        });
      }
    }

    return stats;
  }

  async getJobDetails(queueName: string, jobId: string): Promise<JobProgress | null> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      const job = await queue.getJob(jobId);
      if (!job) {
        return null;
      }

      const state = await job.getState();
      
      return {
        jobId: job.id!,
        queueName,
        progress: job.progress as number || 0,
        data: job.data,
        status: state as JobProgress['status'],
        createdAt: new Date(job.timestamp).toISOString(),
        processedAt: job.processedOn ? new Date(job.processedOn).toISOString() : undefined,
        finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
        error: job.failedReason,
      };
    } catch (error) {
      logger.error(`Failed to get job details for ${jobId}`, error);
      return null;
    }
  }

  async getRecentJobs(queueName: string, count: number = 50): Promise<JobProgress[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaiting(0, Math.min(count / 4, 10)),
        queue.getActive(0, Math.min(count / 4, 10)),
        queue.getCompleted(0, Math.min(count / 2, 20)),
        queue.getFailed(0, Math.min(count / 4, 10)),
      ]);

      const allJobs = [...waiting, ...active, ...completed, ...failed];
      const jobDetails = await Promise.all(
        allJobs.map(async (job) => {
          const state = await job.getState();
          return {
            jobId: job.id!,
            queueName,
            progress: job.progress as number || 0,
            data: job.data,
            status: state as JobProgress['status'],
            createdAt: new Date(job.timestamp).toISOString(),
            processedAt: job.processedOn ? new Date(job.processedOn).toISOString() : undefined,
            finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
            error: job.failedReason,
          };
        })
      );

      // Sort by creation time, newest first
      return jobDetails.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      logger.error(`Failed to get recent jobs for ${queueName}`, error);
      return [];
    }
  }

  async retryFailedJob(queueName: string, jobId: string): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      const job = await queue.getJob(jobId);
      if (!job) {
        return false;
      }

      await job.retry();
      logger.info(`Job ${jobId} in ${queueName} queued for retry`);
      return true;
    } catch (error) {
      logger.error(`Failed to retry job ${jobId}`, error);
      return false;
    }
  }

  async removeJob(queueName: string, jobId: string): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      const job = await queue.getJob(jobId);
      if (!job) {
        return false;
      }

      await job.remove();
      logger.info(`Job ${jobId} removed from ${queueName}`);
      return true;
    } catch (error) {
      logger.error(`Failed to remove job ${jobId}`, error);
      return false;
    }
  }

  async pauseQueue(queueName: string): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      await queue.pause();
      logger.info(`Queue ${queueName} paused`);
      return true;
    } catch (error) {
      logger.error(`Failed to pause queue ${queueName}`, error);
      return false;
    }
  }

  async resumeQueue(queueName: string): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      await queue.resume();
      logger.info(`Queue ${queueName} resumed`);
      return true;
    } catch (error) {
      logger.error(`Failed to resume queue ${queueName}`, error);
      return false;
    }
  }

  async clearQueue(queueName: string, status: 'completed' | 'failed' | 'waiting' = 'completed'): Promise<number> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      let count = 0;
      
      switch (status) {
        case 'completed':
          count = await queue.clean(0, 0, 'completed');
          break;
        case 'failed':
          count = await queue.clean(0, 0, 'failed');
          break;
        case 'waiting':
          const waitingJobs = await queue.getWaiting();
          await Promise.all(waitingJobs.map(job => job.remove()));
          count = waitingJobs.length;
          break;
      }

      logger.info(`Cleared ${count} ${status} jobs from ${queueName}`);
      return count;
    } catch (error) {
      logger.error(`Failed to clear ${status} jobs from ${queueName}`, error);
      return 0;
    }
  }

  async getQueueHealth(): Promise<{
    healthy: boolean;
    issues: string[];
    totalJobs: number;
    activeWorkers: number;
    oldestWaitingJob?: string;
  }> {
    const issues: string[] = [];
    let totalJobs = 0;
    let activeWorkers = 0;
    let oldestWaitingTime: number | undefined;

    try {
      const stats = await this.getQueueStats();
      
      for (const stat of stats) {
        totalJobs += stat.waiting + stat.active + stat.delayed;
        activeWorkers += stat.workers;

        // Check for issues
        if (stat.paused) {
          issues.push(`Queue ${stat.name} is paused`);
        }

        if (stat.workers === 0 && (stat.waiting > 0 || stat.active > 0)) {
          issues.push(`Queue ${stat.name} has jobs but no workers`);
        }

        if (stat.waiting > 100) {
          issues.push(`Queue ${stat.name} has ${stat.waiting} waiting jobs`);
        }

        if (stat.failed > 20) {
          issues.push(`Queue ${stat.name} has ${stat.failed} failed jobs`);
        }

        // Check oldest waiting job
        if (stat.waiting > 0) {
          const queue = this.queues.get(stat.name);
          if (queue) {
            const waitingJobs = await queue.getWaiting(0, 1);
            if (waitingJobs.length > 0) {
              const age = Date.now() - waitingJobs[0].timestamp;
              if (!oldestWaitingTime || age > oldestWaitingTime) {
                oldestWaitingTime = age;
              }
            }
          }
        }
      }

      // Check for stale jobs (waiting >10 minutes)
      if (oldestWaitingTime && oldestWaitingTime > 10 * 60 * 1000) {
        issues.push(`Oldest waiting job is ${Math.round(oldestWaitingTime / 60000)} minutes old`);
      }

      const healthy = issues.length === 0;

      return {
        healthy,
        issues,
        totalJobs,
        activeWorkers,
        oldestWaitingJob: oldestWaitingTime 
          ? `${Math.round(oldestWaitingTime / 60000)} minutes ago`
          : undefined,
      };
    } catch (error) {
      logger.error('Failed to check queue health', error);
      return {
        healthy: false,
        issues: ['Failed to check queue health'],
        totalJobs: 0,
        activeWorkers: 0,
      };
    }
  }

  // Process a complete document workflow
  async processDocument(documentData: {
    attachmentId: string;
    pdfPath: string;
    supplierHint?: string;
  }): Promise<string> {
    const correlationId = createCorrelationId();
    
    // Start with document splitting
    await this.addJob(
      QUEUE_NAMES.SPLIT,
      'split-document',
      documentData,
      { correlationId }
    );

    logger.info(`Started document processing workflow`, { 
      correlationId,
      attachmentId: documentData.attachmentId 
    });

    return correlationId;
  }

  // Chain jobs in the correct sequence
  async chainNextJob(
    currentQueueName: string,
    correlationId: string,
    nextStep: string,
    data: any
  ): Promise<void> {
    const queueMap: Record<string, string> = {
      'document-split': QUEUE_NAMES.PARSE,
      'document-parse': QUEUE_NAMES.MATCH,
      'servicetitan-match': QUEUE_NAMES.BILL,
      'servicetitan-bill': QUEUE_NAMES.WRITE,
      'file-write': QUEUE_NAMES.NOTIFY,
    };

    const nextQueue = queueMap[nextStep];
    if (!nextQueue) {
      if (nextStep === 'notification') {
        await this.addJob(
          QUEUE_NAMES.NOTIFY,
          'send-notification',
          data,
          { correlationId }
        );
      }
      return;
    }

    await this.addJob(
      nextQueue,
      nextStep,
      data,
      { correlationId }
    );

    logger.info(`Chained job to ${nextQueue}`, { 
      correlationId, 
      nextStep 
    });
  }

  async close(): Promise<void> {
    logger.info('Closing queue manager...');
    
    // Close all queues and events
    await Promise.all([
      ...Array.from(this.queues.values()).map(queue => queue.close()),
      ...Array.from(this.queueEvents.values()).map(events => events.close()),
    ]);

    await this.connection.quit();
    logger.info('Queue manager closed');
  }
}