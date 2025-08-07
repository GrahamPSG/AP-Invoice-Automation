import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project } from './project.entity'
import { CreateProjectDto } from './dto/create-project.dto'
import { ExcelParserService } from '../excel/excel-parser.service'
import { CacheService } from '../cache/cache.service'
import { PerformanceService } from '../performance/performance.service'

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name)

  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    private excelParserService: ExcelParserService,
    private cacheService: CacheService,
    private performanceService: PerformanceService,
  ) {}

  async findAll(userId?: string): Promise<Project[]> {
    const startTime = Date.now()
    
    try {
      // Check cache first
      const cacheKey = userId ? 
        this.cacheService.generateUserProjectsKey(userId) : 
        'projects:all'
      
      let cached = await this.cacheService.get<Project[]>(cacheKey)
      if (cached) {
        this.performanceService.recordCacheHit(true)
        this.logger.debug(`Cache hit for projects: ${cacheKey}`)
        return cached
      }
      
      this.performanceService.recordCacheHit(false)
      
      // Fetch from database
      let projects: Project[]
      if (userId) {
        projects = await this.projectsRepository.find({
          where: { uploadedBy: userId },
          relations: ['uploader'],
          order: { createdAt: 'DESC' },
        })
      } else {
        projects = await this.projectsRepository.find({
          relations: ['uploader'],
          order: { createdAt: 'DESC' },
        })
      }
      
      // Cache the result for 10 minutes
      await this.cacheService.set(cacheKey, projects, 600)
      
      const duration = Date.now() - startTime
      if (duration > 100) {
        this.performanceService.recordSlowQuery(`findAll projects for user ${userId}`, duration)
      }
      
      return projects
    } catch (error) {
      this.logger.error(`Failed to fetch projects for user ${userId}:`, error)
      throw error
    }
  }

  async findOne(id: string): Promise<Project | null> {
    const startTime = Date.now()
    
    try {
      // Check cache first
      const cacheKey = this.cacheService.generateProjectKey(id)
      let cached = await this.cacheService.get<Project>(cacheKey)
      
      if (cached) {
        this.performanceService.recordCacheHit(true)
        this.logger.debug(`Cache hit for project: ${id}`)
        return cached
      }
      
      this.performanceService.recordCacheHit(false)
      
      // Fetch from database
      const project = await this.projectsRepository.findOne({
        where: { id },
        relations: ['uploader'],
      })
      
      if (project) {
        // Cache the result for 15 minutes
        await this.cacheService.set(cacheKey, project, 900)
      }
      
      const duration = Date.now() - startTime
      if (duration > 50) {
        this.performanceService.recordSlowQuery(`findOne project ${id}`, duration)
      }
      
      return project
    } catch (error) {
      this.logger.error(`Failed to fetch project ${id}:`, error)
      throw error
    }
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
    
    const savedProject = await this.projectsRepository.save(project)
    
    // Invalidate relevant caches
    await this.cacheService.del(this.cacheService.generateUserProjectsKey(uploadedBy))
    await this.cacheService.del('projects:all')
    
    this.logger.log(`Created new project: ${savedProject.id}`)
    
    return savedProject
  }

  async updateColumnMap(
    id: string,
    columnMap: Record<string, string>,
  ): Promise<Project | null> {
    await this.projectsRepository.update(id, { columnMap })
    
    // Invalidate project cache
    await this.cacheService.del(this.cacheService.generateProjectKey(id))
    
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