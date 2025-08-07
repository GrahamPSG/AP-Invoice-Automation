import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiResponse } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ScenariosService } from './scenarios.service'
import { CreateScenarioDto } from './dto/create-scenario.dto'

@ApiTags('scenarios')
@ApiBearerAuth()
@Controller('scenarios')
@UseGuards(JwtAuthGuard)
export class ScenariosController {
  constructor(private readonly scenariosService: ScenariosService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Return all scenarios for user' })
  findAll(@Request() req: any) {
    return this.scenariosService.findAll(req.user.id)
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Return scenario by ID' })
  @ApiResponse({ status: 404, description: 'Scenario not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.scenariosService.findOne(id, req.user.id)
  }

  @Post()
  @ApiResponse({ status: 201, description: 'Scenario created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  create(@Body() createScenarioDto: CreateScenarioDto, @Request() req: any) {
    return this.scenariosService.create(createScenarioDto, req.user.id)
  }

  @Put(':id')
  @ApiResponse({ status: 200, description: 'Scenario updated successfully' })
  @ApiResponse({ status: 404, description: 'Scenario not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateScenarioDto: Partial<CreateScenarioDto>,
    @Request() req: any,
  ) {
    return this.scenariosService.update(id, updateScenarioDto, req.user.id)
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Scenario deleted successfully' })
  @ApiResponse({ status: 404, description: 'Scenario not found' })
  delete(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.scenariosService.delete(id, req.user.id)
  }
}