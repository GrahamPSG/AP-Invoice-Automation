import { Controller, Post, Get, Body, Query, Headers, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('graph/mail')
  @HttpCode(202)
  @ApiOperation({ summary: 'Microsoft Graph webhook for email notifications' })
  async handleGraphWebhook(
    @Query('validationToken') validationToken: string | undefined,
    @Body() body: any,
    @Headers('content-type') contentType: string,
  ) {
    // Handle subscription validation
    if (validationToken) {
      return validationToken;
    }

    // Process notifications
    await this.webhooksService.processGraphNotifications(body);
    return { status: 'accepted' };
  }
}