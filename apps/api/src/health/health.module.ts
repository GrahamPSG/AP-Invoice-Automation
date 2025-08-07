import { Module } from '@nestjs/common'
import { HealthController } from './health.controller'
import { PerformanceModule } from '../performance/performance.module'
import { CacheService } from '../cache/cache.service'
import { AppCacheModule } from '../cache/cache.module'

@Module({
  imports: [PerformanceModule, AppCacheModule],
  controllers: [HealthController],
  providers: [CacheService],
})
export class HealthModule {}