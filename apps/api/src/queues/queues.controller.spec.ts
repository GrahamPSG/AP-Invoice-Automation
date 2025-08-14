import { Test, TestingModule } from '@nestjs/testing';
import { QueuesController } from './queues.controller';
import { QueueManagerService } from '../../workers/src/services/queue-manager.service';
import { createMock } from '@golevelup/ts-jest';

describe('QueuesController', () => {
  let controller: QueuesController;
  let queueManagerService: jest.Mocked<QueueManagerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueuesController],
      providers: [
        {
          provide: QueueManagerService,
          useValue: createMock<QueueManagerService>(),
        },
      ],
    }).compile();

    controller = module.get<QueuesController>(QueuesController);
    queueManagerService = module.get(QueueManagerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      // Arrange
      const mockStats = {
        queues: [
          {
            name: 'split',
            waiting: 5,
            active: 2,
            completed: 100,
            failed: 3,
            delayed: 0,
            paused: false,
          },
          {
            name: 'process',
            waiting: 3,
            active: 1,
            completed: 85,
            failed: 2,
            delayed: 1,
            paused: false,
          },
        ],
        totalJobs: 201,
        activeJobs: 3,
        failedJobs: 5,
      };

      queueManagerService.getQueueStats.mockResolvedValue(mockStats);

      // Act
      const result = await controller.getQueueStats();

      // Assert
      expect(result).toEqual(mockStats);
      expect(queueManagerService.getQueueStats).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      // Arrange
      queueManagerService.getQueueStats.mockRejectedValue(
        new Error('Redis connection failed')
      );

      // Act & Assert
      await expect(controller.getQueueStats()).rejects.toThrow(
        'Redis connection failed'
      );
    });
  });

  describe('getJobHistory', () => {
    it('should return job history with default pagination', async () => {
      // Arrange
      const mockHistory = {
        jobs: [
          {
            id: 'job-1',
            name: 'split-document',
            queueName: 'split',
            status: 'completed',
            progress: 100,
            createdAt: '2024-01-15T10:00:00Z',
            completedAt: '2024-01-15T10:01:00Z',
            data: { attachmentId: 'att-1' },
            result: { pages: 2, files: 2 },
          },
          {
            id: 'job-2',
            name: 'process-document',
            queueName: 'process',
            status: 'failed',
            progress: 50,
            createdAt: '2024-01-15T09:00:00Z',
            failedAt: '2024-01-15T09:05:00Z',
            data: { pdfPath: '/tmp/test.pdf' },
            error: 'OCR processing failed',
          },
        ],
        total: 2,
        page: 1,
        limit: 50,
      };

      queueManagerService.getJobHistory.mockResolvedValue(mockHistory);

      // Act
      const result = await controller.getJobHistory();

      // Assert
      expect(result).toEqual(mockHistory);
      expect(queueManagerService.getJobHistory).toHaveBeenCalledWith(1, 50);
    });

    it('should support custom pagination', async () => {
      // Arrange
      const mockHistory = {
        jobs: [],
        total: 100,
        page: 2,
        limit: 25,
      };

      queueManagerService.getJobHistory.mockResolvedValue(mockHistory);

      // Act
      const result = await controller.getJobHistory(2, 25);

      // Assert
      expect(result).toEqual(mockHistory);
      expect(queueManagerService.getJobHistory).toHaveBeenCalledWith(2, 25);
    });
  });

  describe('retryJob', () => {
    it('should retry a failed job successfully', async () => {
      // Arrange
      const jobId = 'failed-job-123';
      const mockResult = {
        id: jobId,
        retried: true,
        newJobId: 'retry-job-456',
      };

      queueManagerService.retryJob.mockResolvedValue(mockResult);

      // Act
      const result = await controller.retryJob(jobId);

      // Assert
      expect(result).toEqual({
        success: true,
        data: mockResult,
      });
      expect(queueManagerService.retryJob).toHaveBeenCalledWith(jobId);
    });

    it('should handle retry errors', async () => {
      // Arrange
      const jobId = 'invalid-job-123';
      queueManagerService.retryJob.mockRejectedValue(
        new Error('Job not found')
      );

      // Act
      const result = await controller.retryJob(jobId);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Job not found',
      });
    });
  });

  describe('removeJob', () => {
    it('should remove a job successfully', async () => {
      // Arrange
      const jobId = 'job-to-remove-123';
      queueManagerService.removeJob.mockResolvedValue(true);

      // Act
      const result = await controller.removeJob(jobId);

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Job removed successfully',
      });
      expect(queueManagerService.removeJob).toHaveBeenCalledWith(jobId);
    });

    it('should handle job removal errors', async () => {
      // Arrange
      const jobId = 'invalid-job-123';
      queueManagerService.removeJob.mockRejectedValue(
        new Error('Job not found')
      );

      // Act
      const result = await controller.removeJob(jobId);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Job not found',
      });
    });
  });

  describe('pauseQueue', () => {
    it('should pause a queue successfully', async () => {
      // Arrange
      const queueName = 'split';
      queueManagerService.pauseQueue.mockResolvedValue(true);

      // Act
      const result = await controller.pauseQueue(queueName);

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Queue paused successfully',
      });
      expect(queueManagerService.pauseQueue).toHaveBeenCalledWith(queueName);
    });

    it('should handle pause errors', async () => {
      // Arrange
      const queueName = 'invalid-queue';
      queueManagerService.pauseQueue.mockRejectedValue(
        new Error('Queue not found')
      );

      // Act
      const result = await controller.pauseQueue(queueName);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Queue not found',
      });
    });
  });

  describe('resumeQueue', () => {
    it('should resume a queue successfully', async () => {
      // Arrange
      const queueName = 'split';
      queueManagerService.resumeQueue.mockResolvedValue(true);

      // Act
      const result = await controller.resumeQueue(queueName);

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Queue resumed successfully',
      });
      expect(queueManagerService.resumeQueue).toHaveBeenCalledWith(queueName);
    });

    it('should handle resume errors', async () => {
      // Arrange
      const queueName = 'invalid-queue';
      queueManagerService.resumeQueue.mockRejectedValue(
        new Error('Queue not found')
      );

      // Act
      const result = await controller.resumeQueue(queueName);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Queue not found',
      });
    });
  });
});