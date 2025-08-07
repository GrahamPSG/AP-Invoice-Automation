import { Injectable, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project } from './project.entity'
import { CreateProjectDto } from './dto/create-project.dto'
import { ExcelParserService } from '../excel/excel-parser.service'

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    private excelParserService: ExcelParserService,
  ) {}

  async findAll(userId?: string): Promise<Project[]> {
    if (userId) {
      return this.projectsRepository.find({
        where: { uploadedBy: userId },
        relations: ['uploader'],
        order: { createdAt: 'DESC' },
      })
    }
    
    return this.projectsRepository.find({
      relations: ['uploader'],
      order: { createdAt: 'DESC' },
    })
  }

  async findOne(id: string): Promise<Project | null> {
    return this.projectsRepository.findOne({
      where: { id },
      relations: ['uploader'],
    })
  }

  async create(
    createProjectDto: CreateProjectDto,
    uploadedBy: string,
    filePath?: string,
  ): Promise<Project> {
    const project = this.projectsRepository.create({
      ...createProjectDto,
      uploadedBy,
      filePath,
    })
    
    return this.projectsRepository.save(project)
  }

  async updateColumnMap(
    id: string,
    columnMap: Record<string, string>,
  ): Promise<Project | null> {
    await this.projectsRepository.update(id, { columnMap })
    return this.findOne(id)
  }

  async parseAndCreateProject(
    fileBuffer: Buffer,
    filename: string,
    additionalData: Partial<CreateProjectDto>,
    uploadedBy: string,
  ): Promise<{ project: Project; parsedData: any }> {
    // Parse the Excel file
    const parsedData = await this.excelParserService.parseExcelFile(fileBuffer, filename)
    
    // Merge parsed data with any additional provided data
    const projectData: CreateProjectDto = {
      name: additionalData.name || parsedData.projectData.name || `Import ${filename}`,
      scope: additionalData.scope || parsedData.projectData.scope || 'combined',
      durationWeeks: additionalData.durationWeeks || parsedData.projectData.durationWeeks || 12,
      costs: additionalData.costs || parsedData.projectData.costs || {
        labor: 0,
        materials: 0,
        equipment: 0,
        overhead: 0,
        profit: 0,
      },
      crewSize: additionalData.crewSize || parsedData.projectData.crewSize || 4,
      revenuePerTechDay: additionalData.revenuePerTechDay || parsedData.projectData.revenuePerTechDay || 500,
      grossProfit: additionalData.grossProfit || parsedData.projectData.grossProfit || 0,
      netProfit: additionalData.netProfit || parsedData.projectData.netProfit || 0,
      sizeUnits: additionalData.sizeUnits || parsedData.projectData.sizeUnits,
      sizeSqFt: additionalData.sizeSqFt || parsedData.projectData.sizeSqFt,
      sizeDollars: additionalData.sizeDollars || parsedData.projectData.sizeDollars,
      columnMap: parsedData.suggestedMapping,
    }

    // Validate the extracted data
    if (!projectData.name || !projectData.scope) {
      throw new BadRequestException('Unable to extract required project data from Excel file. Please provide project name and scope.')
    }

    // Create the project
    const project = await this.create(projectData, uploadedBy, `uploads/${filename}`)

    return {
      project,
      parsedData: {
        headers: parsedData.headers,
        rowCount: parsedData.rows.length,
        suggestedMapping: parsedData.suggestedMapping,
        extractedData: parsedData.projectData,
      }
    }
  }
}