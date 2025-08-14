import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HoldReason } from '@paris/shared';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getHolds(filters: { reason?: HoldReason; unresolved?: boolean }) {
    const where: any = {};
    
    if (filters.reason) {
      where.reason = filters.reason;
    }
    
    if (filters.unresolved) {
      where.resolvedAt = null;
    }

    const holds = await this.prisma.hold.findMany({
      where,
      include: {
        document: {
          include: {
            attachment: {
              include: {
                email: true,
              },
            },
            matchResult: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return holds.map(hold => ({
      id: hold.id,
      reason: hold.reason,
      details: hold.details,
      createdAt: hold.createdAt,
      resolvedAt: hold.resolvedAt,
      document: {
        id: hold.document.id,
        supplierName: hold.document.supplierNameRaw,
        invoiceNumber: hold.document.invoiceNumber,
        invoiceDate: hold.document.invoiceDate,
        total: hold.document.total,
        poNumber: hold.document.poNumberRaw,
      },
      email: {
        from: hold.document.attachment.email.from,
        subject: hold.document.attachment.email.subject,
        receivedAt: hold.document.attachment.email.receivedAt,
      },
      suggestedActions: hold.suggestedActions,
    }));
  }

  async getHoldDetails(id: string) {
    const hold = await this.prisma.hold.findUnique({
      where: { id },
      include: {
        document: {
          include: {
            attachment: {
              include: {
                email: true,
              },
            },
            matchResult: true,
            lineItems: true,
          },
        },
      },
    });

    if (!hold) {
      throw new NotFoundException(`Hold ${id} not found`);
    }

    return {
      ...hold,
      document: {
        ...hold.document,
        email: hold.document.attachment.email,
      },
    };
  }

  async resolveHold(id: string, resolution: {
    resolution: string;
    action: 'approve' | 'reject' | 'override';
    jobId?: string;
    vendorId?: string;
    allowVariance?: boolean;
    markAsStock?: boolean;
  }) {
    const hold = await this.prisma.hold.findUnique({
      where: { id },
      include: { document: true },
    });

    if (!hold) {
      throw new NotFoundException(`Hold ${id} not found`);
    }

    // Update hold record
    await this.prisma.hold.update({
      where: { id },
      data: {
        resolvedAt: new Date(),
        resolution: resolution.resolution,
        resolvedBy: 'admin', // TODO: Get from auth context
      },
    });

    // Take action based on resolution
    if (resolution.action === 'approve') {
      // Update match result if provided
      if (resolution.jobId || resolution.vendorId) {
        await this.prisma.matchResult.update({
          where: { documentId: hold.documentId },
          data: {
            jobId: resolution.jobId,
            vendorId: resolution.vendorId,
            action: resolution.allowVariance ? 'AUTO_FINALIZE' : 'DRAFT_THEN_ALERT',
          },
        });
      }

      // Queue for reprocessing
      // TODO: Add to processing queue
      this.logger.log(`Hold ${id} approved for reprocessing`);
    } else if (resolution.action === 'reject') {
      // Mark document as rejected
      await this.prisma.document.update({
        where: { id: hold.documentId },
        data: {
          updatedAt: new Date(),
        },
      });
      
      this.logger.log(`Hold ${id} rejected`);
    }

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'Hold',
        entityId: id,
        action: 'RESOLVE',
        userId: 'admin', // TODO: Get from auth context
        after: resolution,
      },
    });

    return { success: true, holdId: id, action: resolution.action };
  }

  async reassignHold(id: string, reassignment: {
    jobId?: string;
    vendorId?: string;
    poNumber?: string;
  }) {
    const hold = await this.prisma.hold.findUnique({
      where: { id },
      include: { document: true },
    });

    if (!hold) {
      throw new NotFoundException(`Hold ${id} not found`);
    }

    // Update document with new assignments
    if (reassignment.poNumber) {
      await this.prisma.document.update({
        where: { id: hold.documentId },
        data: {
          poNumberRaw: reassignment.poNumber,
          poNumberCore: reassignment.poNumber.replace(/-\d+$/, ''),
        },
      });
    }

    // Update or create match result
    await this.prisma.matchResult.upsert({
      where: { documentId: hold.documentId },
      update: {
        jobId: reassignment.jobId,
        vendorId: reassignment.vendorId,
      },
      create: {
        documentId: hold.documentId,
        poFound: !!reassignment.poNumber,
        jobId: reassignment.jobId,
        vendorId: reassignment.vendorId,
        variance: 0,
        action: 'HOLD_FOR_REVIEW',
        reasons: ['Manually reassigned'],
      },
    });

    this.logger.log(`Hold ${id} reassigned`);
    
    return { success: true, holdId: id, reassignment };
  }

  async getSuggestions(documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { matchResult: true },
    });

    if (!document) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    // TODO: Implement smart suggestions based on:
    // - Similar supplier names
    // - Date ranges
    // - Amount ranges
    // - Previous matches
    
    return {
      documentId,
      suggestions: {
        vendors: [],
        jobs: [],
        pos: [],
      },
    };
  }

  async getHoldStats() {
    const [total, unresolved, byReason, avgResolutionTime] = await Promise.all([
      this.prisma.hold.count(),
      this.prisma.hold.count({ where: { resolvedAt: null } }),
      this.prisma.hold.groupBy({
        by: ['reason'],
        _count: true,
        where: { resolvedAt: null },
      }),
      this.prisma.$queryRaw<any[]>`
        SELECT AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt"))/3600) as hours
        FROM "Hold"
        WHERE "resolvedAt" IS NOT NULL
      `,
    ]);

    return {
      total,
      unresolved,
      resolved: total - unresolved,
      byReason: byReason.reduce((acc, item) => {
        acc[item.reason] = item._count;
        return acc;
      }, {} as Record<string, number>),
      avgResolutionTimeHours: avgResolutionTime[0]?.hours || 0,
    };
  }
}