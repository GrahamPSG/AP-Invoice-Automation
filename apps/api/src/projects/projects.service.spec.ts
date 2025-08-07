import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BadRequestException } from '@nestjs/common'
import { ProjectsService } from './projects.service'
import { Project } from './project.entity'
import { ExcelParserService } from '../excel/excel-parser.service'
import { CreateProjectDto } from './dto/create-project.dto'

describe('ProjectsService', () => {
  let service: ProjectsService
  let projectRepository: jest.Mocked<Repository<Project>>
  let excelParserService: jest.Mocked<ExcelParserService>

  const mockProject: Project = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Project',
    scope: 'plumbing',
    durationWeeks: 12,
    costs: {
      labor: 50000,
      materials: 30000,
      equipment: 15000,
      overhead: 10000,
      profit: 8000,
    },
    crewSize: 4,
    revenuePerTechDay: 500,
    grossProfit: 25000,
    netProfit: 17000,
    uploadedBy: 'user1',
    filePath: 'uploads/test.xlsx',
    columnMap: { 'A': 'name', 'B': 'cost' },
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
    uploader: null,
    scenarios: [],
  } as Project

  const mockUser = {
    id: 'user1',
    email: 'test@example.com',
    role: 'editor' as const,
  }

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    }

    const mockExcelParser = {
      parseExcelFile: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: getRepositoryToken(Project), useValue: mockRepository },
        { provide: ExcelParserService, useValue: mockExcelParser },
      ],
    }).compile()

    service = module.get<ProjectsService>(ProjectsService)
    projectRepository = module.get(getRepositoryToken(Project))
    excelParserService = module.get(ExcelParserService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('should return all projects when no userId provided', async () => {
      const projects = [mockProject]
      projectRepository.find.mockResolvedValue(projects)

      const result = await service.findAll()

      expect(projectRepository.find).toHaveBeenCalledWith({
        relations: ['uploader'],
        order: { createdAt: 'DESC' },
      })
      expect(result).toEqual(projects)
    })

    it('should return user-specific projects when userId provided', async () => {
      const projects = [mockProject]
      projectRepository.find.mockResolvedValue(projects)

      const result = await service.findAll('user1')

      expect(projectRepository.find).toHaveBeenCalledWith({
        where: { uploadedBy: 'user1' },
        relations: ['uploader'],
        order: { createdAt: 'DESC' },
      })
      expect(result).toEqual(projects)
    })

    it('should return empty array when no projects found', async () => {
      projectRepository.find.mockResolvedValue([])

      const result = await service.findAll('user1')

      expect(result).toEqual([])
    })
  })

  describe('findOne', () => {
    it('should return project by id', async () => {
      projectRepository.findOne.mockResolvedValue(mockProject)

      const result = await service.findOne('123e4567-e89b-12d3-a456-426614174000')

      expect(projectRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
        relations: ['uploader'],
      })
      expect(result).toEqual(mockProject)
    })

    it('should return null when project not found', async () => {
      projectRepository.findOne.mockResolvedValue(null)

      const result = await service.findOne('nonexistent-id')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create and save new project', async () => {
      const createProjectDto: CreateProjectDto = {
        name: 'New Project',
        scope: 'hvac',
        durationWeeks: 8,
        costs: {
          labor: 40000,
          materials: 25000,
          equipment: 12000,
          overhead: 8000,
          profit: 6000,
        },
        crewSize: 3,
        revenuePerTechDay: 450,
        grossProfit: 20000,
        netProfit: 12000,
      }

      projectRepository.create.mockReturnValue(mockProject)
      projectRepository.save.mockResolvedValue(mockProject)

      const result = await service.create(createProjectDto, 'user1', 'uploads/test.xlsx')

      expect(projectRepository.create).toHaveBeenCalledWith({
        ...createProjectDto,
        uploadedBy: 'user1',
        filePath: 'uploads/test.xlsx',
      })
      expect(projectRepository.save).toHaveBeenCalledWith(mockProject)
      expect(result).toEqual(mockProject)
    })

    it('should create project without filePath', async () => {
      const createProjectDto: CreateProjectDto = {
        name: 'Manual Project',
        scope: 'electrical',
        durationWeeks: 6,
        costs: {
          labor: 35000,
          materials: 20000,
          equipment: 10000,
          overhead: 5000,
          profit: 5000,
        },
        crewSize: 2,
        revenuePerTechDay: 400,
        grossProfit: 15000,
        netProfit: 10000,
      }

      projectRepository.create.mockReturnValue(mockProject)
      projectRepository.save.mockResolvedValue(mockProject)

      const result = await service.create(createProjectDto, 'user1')

      expect(projectRepository.create).toHaveBeenCalledWith({
        ...createProjectDto,
        uploadedBy: 'user1',
        filePath: undefined,
      })
    })
  })

  describe('updateColumnMap', () => {
    it('should update column mapping and return updated project', async () => {
      const newColumnMap = { 'A': 'labor_cost', 'B': 'material_cost' }
      projectRepository.update.mockResolvedValue({ affected: 1 } as any)
      projectRepository.findOne.mockResolvedValue({ ...mockProject, columnMap: newColumnMap })

      const result = await service.updateColumnMap('123e4567-e89b-12d3-a456-426614174000', newColumnMap)

      expect(projectRepository.update).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        { columnMap: newColumnMap }
      )
      expect(result?.columnMap).toEqual(newColumnMap)
    })

    it('should return null when project not found', async () => {
      projectRepository.update.mockResolvedValue({ affected: 0 } as any)
      projectRepository.findOne.mockResolvedValue(null)

      const result = await service.updateColumnMap('nonexistent-id', {})

      expect(result).toBeNull()
    })
  })

  describe('parseAndCreateProject', () => {
    const mockFileBuffer = Buffer.from('mock excel data')
    const mockFilename = 'test-project.xlsx'
    
    const mockParsedData = {
      projectData: {
        name: 'Parsed Project',
        scope: 'plumbing',
        durationWeeks: 10,
        costs: {
          labor: 45000,
          materials: 28000,
          equipment: 13000,
          overhead: 9000,
          profit: 7000,
        },
        crewSize: 4,
        revenuePerTechDay: 475,
        grossProfit: 22000,
        netProfit: 15000,
        sizeUnits: 150,
        sizeSqFt: 7500,
        sizeDollars: 275000,
      },
      headers: ['Task', 'Labor Cost', 'Material Cost', 'Duration'],
      rows: [
        ['Install pipes', 5000, 3000, 5],
        ['Connect fixtures', 3000, 2000, 3],
      ],
      suggestedMapping: {
        'A': 'task_name',
        'B': 'labor_cost',
        'C': 'material_cost',
        'D': 'duration_days',
      },
    }

    beforeEach(() => {
      excelParserService.parseExcelFile.mockResolvedValue(mockParsedData)
      projectRepository.create.mockReturnValue(mockProject)
      projectRepository.save.mockResolvedValue(mockProject)
    })

    it('should parse Excel file and create project with parsed data', async () => {
      const additionalData = { name: 'Override Name' }

      const result = await service.parseAndCreateProject(
        mockFileBuffer,
        mockFilename,
        additionalData,
        'user1'
      )

      expect(excelParserService.parseExcelFile).toHaveBeenCalledWith(mockFileBuffer, mockFilename)
      
      expect(projectRepository.create).toHaveBeenCalledWith({
        name: 'Override Name', // Should use provided override
        scope: mockParsedData.projectData.scope,
        durationWeeks: mockParsedData.projectData.durationWeeks,
        costs: mockParsedData.projectData.costs,
        crewSize: mockParsedData.projectData.crewSize,
        revenuePerTechDay: mockParsedData.projectData.revenuePerTechDay,
        grossProfit: mockParsedData.projectData.grossProfit,
        netProfit: mockParsedData.projectData.netProfit,
        sizeUnits: mockParsedData.projectData.sizeUnits,
        sizeSqFt: mockParsedData.projectData.sizeSqFt,
        sizeDollars: mockParsedData.projectData.sizeDollars,
        columnMap: mockParsedData.suggestedMapping,
        uploadedBy: 'user1',
        filePath: `uploads/${mockFilename}`,
      })

      expect(result.project).toEqual(mockProject)
      expect(result.parsedData).toEqual({
        headers: mockParsedData.headers,
        rowCount: 2,
        suggestedMapping: mockParsedData.suggestedMapping,
        extractedData: mockParsedData.projectData,
      })
    })

    it('should use default values when parsed data is missing', async () => {
      const incompleteParsedData = {
        projectData: {
          name: null,
          scope: null,
        },
        headers: ['Col1', 'Col2'],
        rows: [['data1', 'data2']],
        suggestedMapping: { 'A': 'col1' },
      }

      excelParserService.parseExcelFile.mockResolvedValue(incompleteParsedData)

      const additionalData = {
        name: 'Manual Name',
        scope: 'electrical',
      }

      const result = await service.parseAndCreateProject(
        mockFileBuffer,
        mockFilename,
        additionalData,
        'user1'
      )

      expect(projectRepository.create).toHaveBeenCalledWith({
        name: 'Manual Name',
        scope: 'electrical',
        durationWeeks: 12, // Default
        costs: {
          labor: 0,
          materials: 0,
          equipment: 0,
          overhead: 0,
          profit: 0,
        }, // Default
        crewSize: 4, // Default
        revenuePerTechDay: 500, // Default
        grossProfit: 0, // Default
        netProfit: 0, // Default
        sizeUnits: undefined,
        sizeSqFt: undefined,
        sizeDollars: undefined,
        columnMap: incompleteParsedData.suggestedMapping,
        uploadedBy: 'user1',
        filePath: `uploads/${mockFilename}`,
      })
    })

    it('should use filename for project name when neither parsed nor provided', async () => {
      const incompleteParsedData = {
        projectData: { name: null },
        headers: [],
        rows: [],
        suggestedMapping: {},
      }

      excelParserService.parseExcelFile.mockResolvedValue(incompleteParsedData)

      const result = await service.parseAndCreateProject(
        mockFileBuffer,
        'important-project.xlsx',
        { scope: 'plumbing' },
        'user1'
      )

      const createCall = projectRepository.create.mock.calls[0][0]
      expect(createCall.name).toBe('Import important-project.xlsx')
    })

    it('should throw BadRequestException when required data is missing', async () => {
      const incompleteParsedData = {
        projectData: { name: null, scope: null },
        headers: [],
        rows: [],
        suggestedMapping: {},
      }

      excelParserService.parseExcelFile.mockResolvedValue(incompleteParsedData)

      await expect(
        service.parseAndCreateProject(mockFileBuffer, mockFilename, {}, 'user1')
      ).rejects.toThrow(BadRequestException)

      await expect(
        service.parseAndCreateProject(mockFileBuffer, mockFilename, {}, 'user1')
      ).rejects.toThrow('Unable to extract required project data from Excel file. Please provide project name and scope.')
    })

    it('should handle Excel parser service errors', async () => {
      excelParserService.parseExcelFile.mockRejectedValue(new Error('Failed to parse Excel file'))

      await expect(
        service.parseAndCreateProject(mockFileBuffer, mockFilename, {}, 'user1')
      ).rejects.toThrow('Failed to parse Excel file')
    })

    it('should handle database save errors', async () => {
      projectRepository.save.mockRejectedValue(new Error('Database save failed'))

      await expect(
        service.parseAndCreateProject(mockFileBuffer, mockFilename, mockParsedData.projectData, 'user1')
      ).rejects.toThrow('Database save failed')
    })

    it('should correctly map all optional size fields', async () => {
      const parsedDataWithSizes = {
        ...mockParsedData,
        projectData: {
          ...mockParsedData.projectData,
          sizeUnits: 200,
          sizeSqFt: 10000,
          sizeDollars: 500000,
        },
      }

      excelParserService.parseExcelFile.mockResolvedValue(parsedDataWithSizes)

      const result = await service.parseAndCreateProject(
        mockFileBuffer,
        mockFilename,
        {},
        'user1'
      )

      const createCall = projectRepository.create.mock.calls[0][0]
      expect(createCall.sizeUnits).toBe(200)
      expect(createCall.sizeSqFt).toBe(10000)
      expect(createCall.sizeDollars).toBe(500000)
    })
  })

  describe('error handling', () => {
    it('should handle repository errors in findAll', async () => {
      projectRepository.find.mockRejectedValue(new Error('Database connection failed'))

      await expect(service.findAll()).rejects.toThrow('Database connection failed')
    })

    it('should handle repository errors in create', async () => {
      const createProjectDto: CreateProjectDto = {
        name: 'Test Project',
        scope: 'plumbing',
        durationWeeks: 10,
        costs: {
          labor: 30000,
          materials: 20000,
          equipment: 10000,
          overhead: 5000,
          profit: 5000,
        },
        crewSize: 3,
        revenuePerTechDay: 400,
        grossProfit: 15000,
        netProfit: 10000,
      }

      projectRepository.create.mockReturnValue(mockProject)
      projectRepository.save.mockRejectedValue(new Error('Save failed'))

      await expect(service.create(createProjectDto, 'user1')).rejects.toThrow('Save failed')
    })
  })
})