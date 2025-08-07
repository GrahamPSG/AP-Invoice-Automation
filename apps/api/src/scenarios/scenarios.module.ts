import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ScenariosController } from './scenarios.controller'
import { ScenariosService } from './scenarios.service'
import { ScenarioComputeService } from './scenario-compute.service'
import { Scenario } from './scenario.entity'
import { ProjectsModule } from '../projects/projects.module'
import { AppCacheModule } from '../cache/cache.module'
import { PerformanceModule } from '../performance/performance.module'
import { CacheService } from '../cache/cache.service'
import { PerformanceService } from '../performance/performance.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Scenario]), 
    ProjectsModule, 
    AppCacheModule, 
    PerformanceModule
  ],
  controllers: [ScenariosController],
  providers: [ScenariosService, ScenarioComputeService, CacheService, PerformanceService],
  exports: [ScenariosService],
})
export class ScenariosModule {}