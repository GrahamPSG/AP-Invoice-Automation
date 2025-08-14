import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Param,
  Query,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { QueuesService } from './queues.service';
import { QUEUE_API_DOCS } from './queues-docs';

@Controller('queues')
export class QueuesController {
  constructor(private readonly queuesService: QueuesService) {}

  @Get('docs')
  getApiDocumentation() {
    return {
      success: true,
      data: QUEUE_API_DOCS,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('stats')
  async getQueueStats() {
    try {
      const stats = await this.queuesService.getQueueStats();
      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get queue stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  async getQueueHealth() {
    try {
      const health = await this.queuesService.getQueueHealth();
      return {
        success: true,
        data: health,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get queue health: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':queueName/jobs')
  async getRecentJobs(
    @Param('queueName') queueName: string,
    @Query('count') count?: string,
  ) {
    try {
      const jobCount = count ? parseInt(count, 10) : 50;
      if (isNaN(jobCount) || jobCount < 1 || jobCount > 500) {
        throw new HttpException(
          'Count must be a number between 1 and 500',
          HttpStatus.BAD_REQUEST,
        );
      }

      const jobs = await this.queuesService.getRecentJobs(queueName, jobCount);
      return {
        success: true,
        data: {
          queueName,
          jobs,
          count: jobs.length,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Failed to get recent jobs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':queueName/jobs/:jobId')
  async getJobDetails(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ) {
    try {
      const job = await this.queuesService.getJobDetails(queueName, jobId);
      if (!job) {
        throw new HttpException(
          `Job ${jobId} not found in queue ${queueName}`,
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        data: job,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Failed to get job details: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':queueName/jobs/:jobId/retry')
  async retryJob(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ) {
    try {
      const success = await this.queuesService.retryFailedJob(queueName, jobId);
      if (!success) {
        throw new HttpException(
          `Job ${jobId} not found or cannot be retried`,
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: `Job ${jobId} queued for retry`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Failed to retry job: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':queueName/jobs/:jobId')
  async removeJob(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ) {
    try {
      const success = await this.queuesService.removeJob(queueName, jobId);
      if (!success) {
        throw new HttpException(
          `Job ${jobId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: `Job ${jobId} removed from queue ${queueName}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Failed to remove job: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':queueName/pause')
  async pauseQueue(@Param('queueName') queueName: string) {
    try {
      const success = await this.queuesService.pauseQueue(queueName);
      if (!success) {
        throw new HttpException(
          `Failed to pause queue ${queueName}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        success: true,
        message: `Queue ${queueName} paused`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Failed to pause queue: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':queueName/resume')
  async resumeQueue(@Param('queueName') queueName: string) {
    try {
      const success = await this.queuesService.resumeQueue(queueName);
      if (!success) {
        throw new HttpException(
          `Failed to resume queue ${queueName}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        success: true,
        message: `Queue ${queueName} resumed`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Failed to resume queue: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':queueName/clear')
  async clearQueue(
    @Param('queueName') queueName: string,
    @Query('status') status?: 'completed' | 'failed' | 'waiting',
  ) {
    try {
      const clearStatus = status || 'completed';
      if (!['completed', 'failed', 'waiting'].includes(clearStatus)) {
        throw new HttpException(
          'Status must be one of: completed, failed, waiting',
          HttpStatus.BAD_REQUEST,
        );
      }

      const count = await this.queuesService.clearQueue(queueName, clearStatus);
      return {
        success: true,
        message: `Cleared ${count} ${clearStatus} jobs from queue ${queueName}`,
        data: { count, status: clearStatus },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Failed to clear queue: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('process-document')
  async processDocument(
    @Body() documentData: {
      attachmentId: string;
      pdfPath: string;
      supplierHint?: string;
    },
  ) {
    try {
      const { attachmentId, pdfPath, supplierHint } = documentData;
      
      if (!attachmentId || !pdfPath) {
        throw new HttpException(
          'attachmentId and pdfPath are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const correlationId = await this.queuesService.processDocument({
        attachmentId,
        pdfPath,
        supplierHint,
      });

      return {
        success: true,
        message: 'Document processing workflow started',
        data: {
          correlationId,
          attachmentId,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Failed to start document processing: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}