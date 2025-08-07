import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProjectsController } from './projects.controller'
import { ProjectsService } from './projects.service'
import { Project } from './project.entity'
import { ExcelModule } from '../excel/excel.module'
import { AppCacheModule } from '../cache/cache.module'
import { PerformanceModule } from '../performance/performance.module'
import { CacheService } from '../cache/cache.service'
import { PerformanceService } from '../performance/performance.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]), 
    ExcelModule, 
    AppCacheModule, 
    PerformanceModule
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, CacheService, PerformanceService],
  exports: [ProjectsService],
})
export class ProjectsModule {}