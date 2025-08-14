// Export queue management services
export { QueueManagerService } from './services/queue-manager.service';
export type { QueueStats, JobProgress } from './services/queue-manager.service';

// Export all processors
export { DocumentSplitProcessor } from './processors/document-split.processor';
export { DocumentParseProcessor } from './processors/document-parse.processor';
export { ServiceTitanMatchProcessor } from './processors/servicetitan-match.processor';
export { ServiceTitanBillProcessor } from './processors/servicetitan-bill.processor';
export { FileWriteProcessor } from './processors/file-write.processor';
export { NotificationProcessor } from './processors/notification.processor';

// Export clients
export { ServiceTitanClient } from './clients/servicetitan.client';
export { AzureDocumentClient } from './clients/azure-document.client';
export { TeamsClient } from './clients/teams.client';
export { EmailClient } from './clients/email.client';
export { SharePointClient } from './clients/sharepoint.client';

// Export worker setup
export { createWorkers, startWorkers } from './workers';