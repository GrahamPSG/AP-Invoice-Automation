export const QUEUE_API_DOCS = {
  title: 'PARIS AP Queue Management API',
  description: 'Monitor and manage document processing queues',
  version: '1.0.0',
  endpoints: [
    {
      method: 'GET',
      path: '/queues/stats',
      description: 'Get statistics for all queues',
      response: {
        success: true,
        data: [
          {
            name: 'document-split',
            waiting: 0,
            active: 1,
            completed: 245,
            failed: 2,
            delayed: 0,
            paused: false,
            workers: 2,
          }
        ],
        timestamp: '2024-01-01T12:00:00.000Z',
      },
    },
    {
      method: 'GET',
      path: '/queues/health',
      description: 'Get overall queue health status',
      response: {
        success: true,
        data: {
          healthy: true,
          issues: [],
          totalJobs: 15,
          activeWorkers: 12,
          oldestWaitingJob: '2 minutes ago',
        },
        timestamp: '2024-01-01T12:00:00.000Z',
      },
    },
    {
      method: 'GET',
      path: '/queues/:queueName/jobs',
      description: 'Get recent jobs for a specific queue',
      parameters: [
        { name: 'queueName', type: 'string', description: 'Name of the queue' },
        { name: 'count', type: 'number', description: 'Number of jobs to return (1-500, default: 50)', optional: true },
      ],
      response: {
        success: true,
        data: {
          queueName: 'document-parse',
          jobs: [
            {
              jobId: 'abc123',
              queueName: 'document-parse',
              progress: 100,
              data: { correlationId: 'xyz789' },
              status: 'completed',
              createdAt: '2024-01-01T11:55:00.000Z',
              processedAt: '2024-01-01T11:55:30.000Z',
              finishedAt: '2024-01-01T11:56:00.000Z',
            }
          ],
          count: 1,
        },
        timestamp: '2024-01-01T12:00:00.000Z',
      },
    },
    {
      method: 'GET',
      path: '/queues/:queueName/jobs/:jobId',
      description: 'Get details for a specific job',
      parameters: [
        { name: 'queueName', type: 'string', description: 'Name of the queue' },
        { name: 'jobId', type: 'string', description: 'ID of the job' },
      ],
      response: {
        success: true,
        data: {
          jobId: 'abc123',
          queueName: 'document-parse',
          progress: 100,
          data: { correlationId: 'xyz789', documentId: 'doc456' },
          status: 'completed',
          createdAt: '2024-01-01T11:55:00.000Z',
          processedAt: '2024-01-01T11:55:30.000Z',
          finishedAt: '2024-01-01T11:56:00.000Z',
        },
        timestamp: '2024-01-01T12:00:00.000Z',
      },
    },
    {
      method: 'POST',
      path: '/queues/:queueName/jobs/:jobId/retry',
      description: 'Retry a failed job',
      parameters: [
        { name: 'queueName', type: 'string', description: 'Name of the queue' },
        { name: 'jobId', type: 'string', description: 'ID of the job to retry' },
      ],
      response: {
        success: true,
        message: 'Job abc123 queued for retry',
        timestamp: '2024-01-01T12:00:00.000Z',
      },
    },
    {
      method: 'DELETE',
      path: '/queues/:queueName/jobs/:jobId',
      description: 'Remove a job from the queue',
      parameters: [
        { name: 'queueName', type: 'string', description: 'Name of the queue' },
        { name: 'jobId', type: 'string', description: 'ID of the job to remove' },
      ],
      response: {
        success: true,
        message: 'Job abc123 removed from queue document-parse',
        timestamp: '2024-01-01T12:00:00.000Z',
      },
    },
    {
      method: 'PUT',
      path: '/queues/:queueName/pause',
      description: 'Pause a queue (stop processing new jobs)',
      parameters: [
        { name: 'queueName', type: 'string', description: 'Name of the queue to pause' },
      ],
      response: {
        success: true,
        message: 'Queue document-parse paused',
        timestamp: '2024-01-01T12:00:00.000Z',
      },
    },
    {
      method: 'PUT',
      path: '/queues/:queueName/resume',
      description: 'Resume a paused queue',
      parameters: [
        { name: 'queueName', type: 'string', description: 'Name of the queue to resume' },
      ],
      response: {
        success: true,
        message: 'Queue document-parse resumed',
        timestamp: '2024-01-01T12:00:00.000Z',
      },
    },
    {
      method: 'DELETE',
      path: '/queues/:queueName/clear',
      description: 'Clear jobs from a queue',
      parameters: [
        { name: 'queueName', type: 'string', description: 'Name of the queue to clear' },
        { name: 'status', type: 'string', description: 'Type of jobs to clear (completed, failed, waiting)', optional: true },
      ],
      response: {
        success: true,
        message: 'Cleared 50 completed jobs from queue document-parse',
        data: { count: 50, status: 'completed' },
        timestamp: '2024-01-01T12:00:00.000Z',
      },
    },
    {
      method: 'POST',
      path: '/queues/process-document',
      description: 'Start document processing workflow',
      body: {
        attachmentId: 'string (required)',
        pdfPath: 'string (required)',
        supplierHint: 'string (optional)',
      },
      response: {
        success: true,
        message: 'Document processing workflow started',
        data: {
          correlationId: 'xyz789',
          attachmentId: 'att123',
        },
        timestamp: '2024-01-01T12:00:00.000Z',
      },
    },
  ],
  queueNames: [
    'document-split',
    'document-parse', 
    'servicetitan-match',
    'servicetitan-bill',
    'file-write',
    'notification',
  ],
  jobStatuses: [
    'waiting',
    'active', 
    'completed',
    'failed',
    'delayed',
  ],
};