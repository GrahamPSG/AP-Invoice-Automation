import { Module } from '@nestjs/common'
import { ExportsController } from './exports.controller'
import { ExportsService } from './exports.service'
import { ScenariosModule } from '../scenarios/scenarios.module'

@Module({
  imports: [ScenariosModule],
  controllers: [ExportsController],
  providers: [ExportsService],
  exports: [ExportsService],
})
export class ExportsModule {}