import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common'
import { Response } from 'express'
import { ApiBearerAuth, ApiTags, ApiResponse } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ExportsService } from './exports.service'
import { ScenariosService } from '../scenarios/scenarios.service'

@ApiTags('exports')
@ApiBearerAuth()
@Controller('exports')
@UseGuards(JwtAuthGuard)
export class ExportsController {
  constructor(
    private readonly exportsService: ExportsService,
    private readonly scenariosService: ScenariosService,
  ) {}

  @Get('scenarios/:id/pdf')
  @ApiResponse({ status: 200, description: 'PDF report generated successfully' })
  @ApiResponse({ status: 404, description: 'Scenario not found' })
  async exportScenarioPdf(
    @Param('id', ParseUUIDPipe) scenarioId: string,
    @Res() res: Response,
  ) {
    const scenario = await this.scenariosService.findOne(scenarioId, 'system')
    if (!scenario) {
      throw new NotFoundException('Scenario not found')
    }

    const pdfBuffer = await this.exportsService.generatePdfReport(scenario)
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="scenario-${scenario.id.slice(0, 8)}-report.pdf"`,
      'Content-Length': pdfBuffer.length,
    })
    
    res.send(pdfBuffer)
  }

  @Get('scenarios/:id/excel')
  @ApiResponse({ status: 200, description: 'Excel report generated successfully' })
  @ApiResponse({ status: 404, description: 'Scenario not found' })
  async exportScenarioExcel(
    @Param('id', ParseUUIDPipe) scenarioId: string,
    @Res() res: Response,
  ) {
    const scenario = await this.scenariosService.findOne(scenarioId, 'system')
    if (!scenario) {
      throw new NotFoundException('Scenario not found')
    }

    const excelBuffer = await this.exportsService.generateExcelReport(scenario)
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="scenario-${scenario.id.slice(0, 8)}-report.xlsx"`,
      'Content-Length': excelBuffer.length,
    })
    
    res.send(excelBuffer)
  }
}