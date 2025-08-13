import { Controller, Post, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IngestService } from './ingest.service';

@ApiTags('Ingest')
@Controller('ingest')
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Post('manual')
  @HttpCode(202)
  @ApiOperation({ summary: 'Manually trigger ingestion window' })
  async triggerManualIngest() {
    await this.ingestService.triggerManualIngest();
    return { status: 'queued' };
  }
}