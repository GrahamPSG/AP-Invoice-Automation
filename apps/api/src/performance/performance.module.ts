import { Module } from '@nestjs/common'
import { ThrottlerModule } from '@nestjs/throttler'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PerformanceService } from './performance.service'
import { PerformanceInterceptor } from './performance.interceptor'
import { CompressionMiddleware } from './compression.middleware'

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: 1000, // 1 second
            limit: configService.get('THROTTLE_SHORT_LIMIT', 10),
          },
          {
            name: 'medium',
            ttl: 10000, // 10 seconds
            limit: configService.get('THROTTLE_MEDIUM_LIMIT', 20),
          },
          {
            name: 'long',
            ttl: 60000, // 1 minute
            limit: configService.get('THROTTLE_LONG_LIMIT', 100),
          },
        ],
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [PerformanceService, PerformanceInterceptor],
  exports: [PerformanceService, PerformanceInterceptor, ThrottlerModule],
})
export class PerformanceModule {}