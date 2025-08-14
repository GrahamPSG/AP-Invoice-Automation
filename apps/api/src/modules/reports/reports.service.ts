import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { formatCurrency } from '@paris/shared';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateDailySummary(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const [
      totalProcessed,
      successfulBills,
      holds,
      errors,
      totalAmount,
      vendorBreakdown,
    ] = await Promise.all([
      this.prisma.document.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      this.prisma.bill.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: 'FINALIZED',
        },
      }),
      this.prisma.hold.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      this.prisma.email.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: 'ERROR',
        },
      }),
      this.prisma.document.aggregate({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _sum: {
          total: true,
        },
      }),
      this.prisma.document.groupBy({
        by: ['supplierNameNormalized'],
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _count: true,
        _sum: {
          total: true,
        },
      }),
    ]);

    const successRate = totalProcessed > 0 
      ? ((successfulBills / totalProcessed) * 100).toFixed(1)
      : '0.0';

    return {
      date: targetDate.toISOString().split('T')[0],
      summary: {
        totalProcessed,
        successfulBills,
        holds,
        errors,
        successRate: `${successRate}%`,
        totalAmount: formatCurrency(totalAmount._sum.total || 0),
      },
      topVendors: vendorBreakdown
        .sort((a, b) => (b._sum.total || 0) - (a._sum.total || 0))
        .slice(0, 10)
        .map(v => ({
          vendor: v.supplierNameNormalized,
          count: v._count,
          total: formatCurrency(v._sum.total || 0),
        })),
      holdReasons: await this.getHoldReasonBreakdown(startOfDay, endOfDay),
      processingTimes: await this.getProcessingTimes(startOfDay, endOfDay),
    };
  }

  async getProcessingStats(from?: string, to?: string) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const stats = await this.prisma.document.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      _count: true,
    });

    const byStatus = await this.prisma.email.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      _count: true,
    });

    return {
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      totalDocuments: stats.reduce((sum, s) => sum + s._count, 0),
      byStatus: byStatus.reduce((acc, s) => {
        acc[s.status] = s._count;
        return acc;
      }, {} as Record<string, number>),
      dailyAverage: Math.round(
        stats.reduce((sum, s) => sum + s._count, 0) / 
        Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000)))
      ),
    };
  }

  async getVendorSummary(days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const vendors = await this.prisma.document.groupBy({
      by: ['supplierNameNormalized'],
      where: {
        createdAt: { gte: since },
      },
      _count: true,
      _sum: {
        total: true,
      },
      _avg: {
        total: true,
      },
    });

    return vendors
      .sort((a, b) => b._count - a._count)
      .map(v => ({
        vendor: v.supplierNameNormalized,
        invoiceCount: v._count,
        totalAmount: formatCurrency(v._sum.total || 0),
        averageAmount: formatCurrency(Math.round(v._avg.total || 0)),
      }));
  }

  async getErrorReport(days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const errors = await this.prisma.email.findMany({
      where: {
        status: 'ERROR',
        createdAt: { gte: since },
      },
      select: {
        id: true,
        messageId: true,
        from: true,
        subject: true,
        error: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    const errorTypes = errors.reduce((acc, e) => {
      const errorType = this.categorizeError(e.error || '');
      acc[errorType] = (acc[errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      period: `Last ${days} days`,
      totalErrors: errors.length,
      errorTypes,
      recentErrors: errors.slice(0, 10),
    };
  }

  async getVarianceAnalysis(threshold: number) {
    const matchResults = await this.prisma.matchResult.findMany({
      where: {
        variance: {
          not: 0,
        },
      },
      include: {
        document: true,
      },
    });

    const overThreshold = matchResults.filter(m => Math.abs(m.variance) > threshold);
    const totalVariance = matchResults.reduce((sum, m) => sum + m.variance, 0);

    return {
      thresholdCents: threshold,
      totalRecords: matchResults.length,
      overThreshold: overThreshold.length,
      totalVariance: formatCurrency(totalVariance),
      averageVariance: formatCurrency(
        matchResults.length > 0 ? Math.round(totalVariance / matchResults.length) : 0
      ),
      topVariances: overThreshold
        .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
        .slice(0, 10)
        .map(m => ({
          documentId: m.documentId,
          supplier: m.document.supplierNameRaw,
          invoiceNumber: m.document.invoiceNumber,
          variance: formatCurrency(m.variance),
          percentage: ((m.variance / m.document.total) * 100).toFixed(2) + '%',
        })),
    };
  }

  async getPerformanceMetrics() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [
      recentProcessing,
      queueDepth,
      avgProcessingTime,
    ] = await Promise.all([
      this.prisma.document.count({
        where: {
          createdAt: { gte: oneHourAgo },
        },
      }),
      this.prisma.email.count({
        where: {
          status: 'QUEUED',
        },
      }),
      this.getAverageProcessingTime(),
    ]);

    return {
      timestamp: now.toISOString(),
      metrics: {
        documentsPerHour: recentProcessing,
        queueDepth,
        avgProcessingTimeMs: avgProcessingTime,
        health: this.calculateHealthScore(recentProcessing, queueDepth, avgProcessingTime),
      },
    };
  }

  private async getHoldReasonBreakdown(startOfDay: Date, endOfDay: Date) {
    const holds = await this.prisma.hold.groupBy({
      by: ['reason'],
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _count: true,
    });

    return holds.reduce((acc, h) => {
      acc[h.reason] = h._count;
      return acc;
    }, {} as Record<string, number>);
  }

  private async getProcessingTimes(startOfDay: Date, endOfDay: Date) {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (e."processedAt" - e."receivedAt")) * 1000) as avg_ms,
        MIN(EXTRACT(EPOCH FROM (e."processedAt" - e."receivedAt")) * 1000) as min_ms,
        MAX(EXTRACT(EPOCH FROM (e."processedAt" - e."receivedAt")) * 1000) as max_ms
      FROM "Email" e
      WHERE e."processedAt" IS NOT NULL
        AND e."createdAt" >= ${startOfDay}
        AND e."createdAt" <= ${endOfDay}
    `;

    const times = result[0] || { avg_ms: 0, min_ms: 0, max_ms: 0 };

    return {
      average: Math.round(times.avg_ms || 0),
      min: Math.round(times.min_ms || 0),
      max: Math.round(times.max_ms || 0),
    };
  }

  private async getAverageProcessingTime(): Promise<number> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT AVG(EXTRACT(EPOCH FROM (e."processedAt" - e."receivedAt")) * 1000) as avg_ms
      FROM "Email" e
      WHERE e."processedAt" IS NOT NULL
        AND e."createdAt" >= NOW() - INTERVAL '1 hour'
    `;

    return Math.round(result[0]?.avg_ms || 0);
  }

  private categorizeError(error: string): string {
    if (error.includes('timeout')) return 'Timeout';
    if (error.includes('auth')) return 'Authentication';
    if (error.includes('parse')) return 'Parsing';
    if (error.includes('network')) return 'Network';
    if (error.includes('duplicate')) return 'Duplicate';
    return 'Other';
  }

  private calculateHealthScore(docsPerHour: number, queueDepth: number, avgTime: number): string {
    let score = 100;

    // Penalize for low throughput
    if (docsPerHour < 10) score -= 20;
    
    // Penalize for high queue depth
    if (queueDepth > 50) score -= 20;
    if (queueDepth > 100) score -= 20;
    
    // Penalize for slow processing
    if (avgTime > 60000) score -= 20; // > 1 minute
    if (avgTime > 120000) score -= 20; // > 2 minutes

    if (score >= 80) return 'Healthy';
    if (score >= 60) return 'Degraded';
    return 'Unhealthy';
  }
}