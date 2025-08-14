import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { QueueManagerService, QueueStats, JobProgress } from '@paris/workers';

@Injectable()
export class QueuesService implements OnModuleInit, OnModuleDestroy {
  private queueManager: QueueManagerService;

  async onModuleInit() {
    this.queueManager = new QueueManagerService();
  }

  async onModuleDestroy() {
    if (this.queueManager) {
      await this.queueManager.close();
    }
  }

  async getQueueStats(): Promise<QueueStats[]> {
    return this.queueManager.getQueueStats();
  }

  async getQueueHealth(): Promise<{
    healthy: boolean;
    issues: string[];
    totalJobs: number;
    activeWorkers: number;
    oldestWaitingJob?: string;
  }> {
    return this.queueManager.getQueueHealth();
  }

  async getJobDetails(queueName: string, jobId: string): Promise<JobProgress | null> {
    return this.queueManager.getJobDetails(queueName, jobId);
  }

  async getRecentJobs(queueName: string, count: number = 50): Promise<JobProgress[]> {
    return this.queueManager.getRecentJobs(queueName, count);
  }

  async retryFailedJob(queueName: string, jobId: string): Promise<boolean> {
    return this.queueManager.retryFailedJob(queueName, jobId);
  }

  async removeJob(queueName: string, jobId: string): Promise<boolean> {
    return this.queueManager.removeJob(queueName, jobId);
  }

  async pauseQueue(queueName: string): Promise<boolean> {
    return this.queueManager.pauseQueue(queueName);
  }

  async resumeQueue(queueName: string): Promise<boolean> {
    return this.queueManager.resumeQueue(queueName);
  }

  async clearQueue(queueName: string, status: 'completed' | 'failed' | 'waiting' = 'completed'): Promise<number> {
    return this.queueManager.clearQueue(queueName, status);
  }

  async processDocument(documentData: {
    attachmentId: string;
    pdfPath: string;
    supplierHint?: string;
  }): Promise<string> {
    return this.queueManager.processDocument(documentData);
  }
}