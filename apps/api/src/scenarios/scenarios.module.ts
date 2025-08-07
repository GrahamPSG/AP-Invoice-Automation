import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ScenariosController } from './scenarios.controller'
import { ScenariosService } from './scenarios.service'
import { ScenarioComputeService } from './scenario-compute.service'
import { Scenario } from './scenario.entity'
import { ProjectsModule } from '../projects/projects.module'

@Module({
  imports: [TypeOrmModule.forFeature([Scenario]), ProjectsModule],
  controllers: [ScenariosController],
  providers: [ScenariosService, ScenarioComputeService],
  exports: [ScenariosService],
})
export class ScenariosModule {}