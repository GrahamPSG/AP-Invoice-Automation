import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiResponse } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ProjectsService } from './projects.service'
import { CreateProjectDto } from './dto/create-project.dto'

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Return all projects for user' })
  findAll(@Request() req: any) {
    return this.projectsService.findAll(req.user.id)
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Return project by ID' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.findOne(id)
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async uploadProject(
    @UploadedFile() file: Express.Multer.File,
    @Body() createProjectDto: CreateProjectDto,
    @Request() req: any,
  ) {
    if (!file) {
      // Direct project creation without file
      return this.projectsService.create(createProjectDto, req.user.id)
    }
    
    // Process Excel file
    const parsedData = await this.projectsService.parseAndCreateProject(
      file.buffer,
      file.originalname,
      createProjectDto,
      req.user.id
    )
    
    return parsedData
  }

  @Post(':id/column-map')
  @ApiResponse({ status: 200, description: 'Column mapping updated' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  updateColumnMap(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('columnMap') columnMap: Record<string, string>,
  ) {
    return this.projectsService.updateColumnMap(id, columnMap)
  }
}