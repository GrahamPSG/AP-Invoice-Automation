import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { HoldReason } from '@paris/shared';

@ApiTags('Review')
@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('holds')
  @ApiOperation({ summary: 'List all items on hold' })
  @ApiQuery({ name: 'reason', required: false, enum: ['MISSING_PO', 'VARIANCE_EXCEEDED', 'NEGATIVE_QUANTITY', 'NO_TECH_TRUCK', 'UNREADABLE', 'DUPLICATE', 'NO_VENDOR_MATCH', 'SERVICE_STOCK'] })
  @ApiQuery({ name: 'unresolved', required: false, type: Boolean })
  async getHolds(
    @Query('reason') reason?: HoldReason,
    @Query('unresolved') unresolved?: boolean,
  ) {
    return this.reviewService.getHolds({ reason, unresolved });
  }

  @Get('holds/:id')
  @ApiOperation({ summary: 'Get hold details' })
  async getHoldDetails(@Param('id') id: string) {
    return this.reviewService.getHoldDetails(id);
  }

  @Post('holds/:id/resolve')
  @ApiOperation({ summary: 'Resolve a hold' })
  async resolveHold(
    @Param('id') id: string,
    @Body() body: {
      resolution: string;
      action: 'approve' | 'reject' | 'override';
      jobId?: string;
      vendorId?: string;
      allowVariance?: boolean;
      markAsStock?: boolean;
    },
  ) {
    return this.reviewService.resolveHold(id, body);
  }

  @Post('holds/:id/reassign')
  @ApiOperation({ summary: 'Reassign hold to different job/vendor' })
  async reassignHold(
    @Param('id') id: string,
    @Body() body: {
      jobId?: string;
      vendorId?: string;
      poNumber?: string;
    },
  ) {
    return this.reviewService.reassignHold(id, body);
  }

  @Get('suggestions/:documentId')
  @ApiOperation({ summary: 'Get job/vendor suggestions for a document' })
  async getSuggestions(@Param('documentId') documentId: string) {
    return this.reviewService.getSuggestions(documentId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get hold statistics' })
  async getStats() {
    return this.reviewService.getHoldStats();
  }
}