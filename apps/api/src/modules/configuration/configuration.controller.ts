import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigurationService } from './configuration.service';
import { Config } from '@paris/shared';

@ApiTags('Configuration')
@Controller('config')
export class ConfigurationController {
  constructor(private readonly configService: ConfigurationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all configuration settings' })
  async getConfig(): Promise<Config> {
    return this.configService.getConfig();
  }

  @Get('vendors')
  @ApiOperation({ summary: 'Get vendor normalization map' })
  async getVendors() {
    return this.configService.getVendors();
  }

  @Post('vendors')
  @ApiOperation({ summary: 'Add or update vendor synonyms' })
  async upsertVendorSynonyms(
    @Body() body: { vendorName: string; synonyms: string[] }
  ) {
    return this.configService.upsertVendorSynonyms(body.vendorName, body.synonyms);
  }

  @Put('settings/:key')
  @ApiOperation({ summary: 'Update a configuration setting' })
  async updateSetting(
    @Param('key') key: string,
    @Body() body: { value: any }
  ) {
    return this.configService.updateSetting(key, body.value);
  }

  @Get('notifications/test')
  @ApiOperation({ summary: 'Test notification settings' })
  async testNotifications() {
    return this.configService.testNotifications();
  }
}