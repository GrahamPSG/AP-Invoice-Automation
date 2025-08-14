import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { IngestModule } from './modules/ingest/ingest.module';
import { ConfigurationModule } from './modules/configuration/configuration.module';
import { ReviewModule } from './modules/review/review.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { OpenAIModule } from './modules/openai/openai.module';
import { QueuesModule } from './queues/queues.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    HealthModule,
    WebhooksModule,
    IngestModule,
    ConfigurationModule,
    ReviewModule,
    ReportsModule,
    OpenAIModule,
    QueuesModule,
  ],
})
export class AppModule {}