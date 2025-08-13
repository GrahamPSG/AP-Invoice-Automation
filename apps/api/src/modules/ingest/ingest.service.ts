import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);

  async triggerManualIngest(): Promise<void> {
    this.logger.log('Manual ingest triggered');
    // TODO: Implement manual ingestion logic
    // This would query Graph API for new emails
    // and queue them for processing
  }
}