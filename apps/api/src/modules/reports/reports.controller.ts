import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily')
  @ApiOperation({ summary: 'Generate daily summary report' })
  @ApiQuery({ name: 'date', required: false, description: 'Date in YYYY-MM-DD format' })
  async getDailySummary(@Query('date') date?: string) {
    return this.reportsService.generateDailySummary(date);
  }

  @Get('processing-stats')
  @ApiOperation({ summary: 'Get processing statistics' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async getProcessingStats(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getProcessingStats(from, to);
  }

  @Get('vendor-summary')
  @ApiOperation({ summary: 'Get vendor processing summary' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getVendorSummary(@Query('days') days: number = 30) {
    return this.reportsService.getVendorSummary(days);
  }

  @Get('error-report')
  @ApiOperation({ summary: 'Get error report' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getErrorReport(@Query('days') days: number = 7) {
    return this.reportsService.getErrorReport(days);
  }

  @Get('variance-analysis')
  @ApiOperation({ summary: 'Get variance analysis report' })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  async getVarianceAnalysis(@Query('threshold') threshold: number = 2500) {
    return this.reportsService.getVarianceAnalysis(threshold);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get system performance metrics' })
  async getPerformanceMetrics() {
    return this.reportsService.getPerformanceMetrics();
  }
}