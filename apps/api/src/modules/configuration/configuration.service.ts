import { Injectable, Logger } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Config, DEFAULT_CONFIG, normalizeVendorName } from '@paris/shared';

@Injectable()
export class ConfigurationService {
  private readonly logger = new Logger(ConfigurationService.name);
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly nestConfig: NestConfigService,
  ) {}

  async getConfig(): Promise<Config> {
    const dbConfig = await this.prisma.configuration.findMany();
    const config: Config = {
      varianceCents: this.nestConfig.get('VARIANCE_CENTS', DEFAULT_CONFIG.varianceCents),
      dedupeWindowDays: this.nestConfig.get('DEDUPE_WINDOW_DAYS', DEFAULT_CONFIG.dedupeWindowDays),
      dailySummaryHourPT: this.nestConfig.get('DAILY_SUMMARY_HOUR_PT', DEFAULT_CONFIG.dailySummaryHourPT),
      runScheduleCron: this.nestConfig.get('RUN_SCHEDULE_CRON', DEFAULT_CONFIG.runScheduleCron),
      retentionYears: DEFAULT_CONFIG.retentionYears,
      paths: {
        processedDir: this.nestConfig.get('SP_PROCESSED_DIR', ''),
        rawDir: this.nestConfig.get('SP_RAW_DIR', ''),
      },
      teams: {
        channelId: this.nestConfig.get('TEAMS_CHANNEL_ID', ''),
        webhookUrl: this.nestConfig.get('TEAMS_WEBHOOK_URL'),
      },
      notifications: {
        emails: this.nestConfig.get('NOTIFICATION_EMAILS', '').split(',').filter(Boolean),
      },
    };

    // Override with database config if exists
    for (const dbSetting of dbConfig) {
      const path = dbSetting.key.split('.');
      let target: any = config;
      
      for (let i = 0; i < path.length - 1; i++) {
        if (!target[path[i]]) target[path[i]] = {};
        target = target[path[i]];
      }
      
      target[path[path.length - 1]] = dbSetting.value;
    }

    return config;
  }

  async getVendors() {
    const vendors = await this.prisma.vendor.findMany({
      include: {
        synonyms: true,
      },
    });

    return vendors.map(v => ({
      id: v.id,
      name: v.name,
      normalized: v.normalized,
      synonyms: v.synonyms.map(s => s.synonym),
    }));
  }

  async upsertVendorSynonyms(vendorName: string, synonyms: string[]) {
    const normalized = normalizeVendorName(vendorName);
    
    // Find or create vendor
    let vendor = await this.prisma.vendor.findUnique({
      where: { normalized },
    });

    if (!vendor) {
      vendor = await this.prisma.vendor.create({
        data: {
          name: vendorName,
          normalized,
        },
      });
    }

    // Add new synonyms
    const existingSynonyms = await this.prisma.vendorSynonym.findMany({
      where: { vendorId: vendor.id },
    });

    const existingNames = new Set(existingSynonyms.map(s => s.synonym));
    const newSynonyms = synonyms.filter(s => !existingNames.has(s));

    if (newSynonyms.length > 0) {
      await this.prisma.vendorSynonym.createMany({
        data: newSynonyms.map(synonym => ({
          vendorId: vendor.id,
          synonym,
          normalized: normalizeVendorName(synonym),
        })),
        skipDuplicates: true,
      });
    }

    this.logger.log(`Updated vendor ${vendorName} with ${newSynonyms.length} new synonyms`);
    
    return {
      vendor: vendor.name,
      synonymsAdded: newSynonyms.length,
      totalSynonyms: existingSynonyms.length + newSynonyms.length,
    };
  }

  async updateSetting(key: string, value: any) {
    const setting = await this.prisma.configuration.upsert({
      where: { key },
      update: {
        value,
        updatedAt: new Date(),
      },
      create: {
        key,
        value,
      },
    });

    // Log audit trail
    await this.prisma.auditLog.create({
      data: {
        entityType: 'Configuration',
        entityId: setting.id,
        action: 'UPDATE',
        after: value,
      },
    });

    this.logger.log(`Configuration updated: ${key}`);
    
    return { success: true, key, value };
  }

  async testNotifications() {
    // TODO: Implement test notifications to Teams and email
    this.logger.log('Testing notification settings');
    
    return {
      teams: {
        configured: !!this.nestConfig.get('TEAMS_WEBHOOK_URL'),
        testSent: false,
      },
      email: {
        configured: !!this.nestConfig.get('NOTIFICATION_EMAILS'),
        recipients: this.nestConfig.get('NOTIFICATION_EMAILS', '').split(','),
        testSent: false,
      },
    };
  }
}