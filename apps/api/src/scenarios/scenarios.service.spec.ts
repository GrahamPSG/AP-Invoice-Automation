import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { NotFoundException } from '@nestjs/common'
import { ScenariosService } from './scenarios.service'
import { Scenario } from './scenario.entity'
import { ScenarioComputeService } from './scenario-compute.service'
import { ProjectsService } from '../projects/projects.service'
import { CreateScenarioDto } from './dto/create-scenario.dto'

describe('ScenariosService', () => {
  let service: ScenariosService
  let scenariosRepository: jest.Mocked<Repository<Scenario>>
  let scenarioComputeService: jest.Mocked<ScenarioComputeService>
  let projectsService: jest.Mocked<ProjectsService>

  const mockProject = {
    id: 'project-1',
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
  }

  const mockScenario: Scenario = {
    id: 'scenario-1',
    projectId: 'project-1',
    ownerId: 'user-1',
    isPublic: false,
    inputs: {
      projectSize: { units: 100 },
      scope: ['plumbing'],
      crewChange: 1,
      scheduleChangeWeeks: -2,
      overheadChangePct: 5,
      materialInflationPct: 3,
      laborRateChangePct: 2,
      targetProfitPct: 15,
    },
    outputs: {
      totalRevenue: 300000,
      totalCost: 255000,
      profitDollars: 45000,
      profitPct: 15.0,
      grossMarginPct: 18.2,
      laborHours: 2400,
      laborPerUnit: 24.0,
      cashFlowForecast: [
        { week: 1, cash: -50000 },
        { week: 2, cash: 0 },
        { week: 3, cash: 45000 },
      ],
      alerts: [
        { severity: 'warning', message: 'Schedule compression detected' },
      ],
    },
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
    owner: null,
    project: null,
  } as Scenario

  const mockComputedOutputs = {
    totalRevenue: 320000,
    totalCost: 272000,
    profitDollars: 48000,
    profitPct: 15.0,
    grossMarginPct: 17.6,
    laborHours: 2500,
    laborPerUnit: 25.0,
    cashFlowForecast: [
      { week: 1, cash: -60000 },
      { week: 2, cash: -10000 },
      { week: 3, cash: 48000 },
    ],
    alerts: [],
  }

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    }

    const mockComputeService = {
      computeScenario: jest.fn(),
    }

    const mockProjectsServiceImpl = {
      findOne: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScenariosService,
        { provide: getRepositoryToken(Scenario), useValue: mockRepository },
        { provide: ScenarioComputeService, useValue: mockComputeService },
        { provide: ProjectsService, useValue: mockProjectsServiceImpl },
      ],
    }).compile()

    service = module.get<ScenariosService>(ScenariosService)
    scenariosRepository = module.get(getRepositoryToken(Scenario))
    scenarioComputeService = module.get(ScenarioComputeService)
    projectsService = module.get(ProjectsService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('should return user scenarios and public scenarios by default', async () => {
      const scenarios = [mockScenario, { ...mockScenario, id: 'scenario-2', isPublic: true }]
      scenariosRepository.find.mockResolvedValue(scenarios)

      const result = await service.findAll('user-1')

      expect(scenariosRepository.find).toHaveBeenCalledWith({
        where: [{ ownerId: 'user-1' }, { isPublic: true }],
        relations: ['owner', 'project'],
        order: { createdAt: 'DESC' },
      })
      expect(result).toEqual(scenarios)
    })

    it('should return only user scenarios when includePublic is false', async () => {
      const userScenarios = [mockScenario]
      scenariosRepository.find.mockResolvedValue(userScenarios)

      const result = await service.findAll('user-1', false)

      expect(scenariosRepository.find).toHaveBeenCalledWith({
        where: [{ ownerId: 'user-1' }],
        relations: ['owner', 'project'],
        order: { createdAt: 'DESC' },
      })
      expect(result).toEqual(userScenarios)
    })

    it('should return empty array when no scenarios found', async () => {
      scenariosRepository.find.mockResolvedValue([])

      const result = await service.findAll('user-1')

      expect(result).toEqual([])
    })
  })

  describe('findOne', () => {
    it('should return scenario when user is owner', async () => {
      scenariosRepository.findOne.mockResolvedValue(mockScenario)

      const result = await service.findOne('scenario-1', 'user-1')

      expect(scenariosRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'scenario-1' },
        relations: ['owner', 'project'],
      })
      expect(result).toEqual(mockScenario)
    })

    it('should return scenario when it is public', async () => {
      const publicScenario = { ...mockScenario, ownerId: 'other-user', isPublic: true }
      scenariosRepository.findOne.mockResolvedValue(publicScenario)

      const result = await service.findOne('scenario-1', 'user-1')

      expect(result).toEqual(publicScenario)
    })

    it('should throw NotFoundException when scenario is private and user is not owner', async () => {
      const privateScenario = { ...mockScenario, ownerId: 'other-user', isPublic: false }
      scenariosRepository.findOne.mockResolvedValue(privateScenario)

      await expect(service.findOne('scenario-1', 'user-1'))
        .rejects.toThrow(NotFoundException)
      await expect(service.findOne('scenario-1', 'user-1'))
        .rejects.toThrow('Scenario not found')
    })

    it('should return null when scenario does not exist', async () => {
      scenariosRepository.findOne.mockResolvedValue(null)

      const result = await service.findOne('nonexistent', 'user-1')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    const createScenarioDto: CreateScenarioDto = {
      projectSize: { units: 150 },
      scope: ['hvac'],
      crewChange: 2,
      scheduleChangeWeeks: -1,
      overheadChangePct: 10,
      materialInflationPct: 5,
      laborRateChangePct: 3,
      targetProfitPct: 18,
      isPublic: false,
    }

    it('should create scenario without base project', async () => {
      scenarioComputeService.computeScenario.mockReturnValue(mockComputedOutputs)
      scenariosRepository.create.mockReturnValue(mockScenario)
      scenariosRepository.save.mockResolvedValue(mockScenario)

      const result = await service.create(createScenarioDto, 'user-1')

      expect(scenarioComputeService.computeScenario).toHaveBeenCalledWith({
        projectSize: createScenarioDto.projectSize,
        scope: createScenarioDto.scope,
        crewChange: createScenarioDto.crewChange,
        scheduleChangeWeeks: createScenarioDto.scheduleChangeWeeks,
        overheadChangePct: createScenarioDto.overheadChangePct,
        materialInflationPct: createScenarioDto.materialInflationPct,
        laborRateChangePct: createScenarioDto.laborRateChangePct,
        targetProfitPct: createScenarioDto.targetProfitPct,
      }, null)

      expect(scenariosRepository.create).toHaveBeenCalledWith({
        projectId: undefined,
        ownerId: 'user-1',
        isPublic: false,
        inputs: {
          projectSize: createScenarioDto.projectSize,
          scope: createScenarioDto.scope,
          crewChange: createScenarioDto.crewChange,
          scheduleChangeWeeks: createScenarioDto.scheduleChangeWeeks,
          overheadChangePct: createScenarioDto.overheadChangePct,
          materialInflationPct: createScenarioDto.materialInflationPct,
          laborRateChangePct: createScenarioDto.laborRateChangePct,
          targetProfitPct: createScenarioDto.targetProfitPct,
        },
        outputs: mockComputedOutputs,
      })

      expect(result).toEqual(mockScenario)
    })

    it('should create scenario with base project', async () => {
      const dtoWithProject = { ...createScenarioDto, projectId: 'project-1' }
      
      projectsService.findOne.mockResolvedValue(mockProject as any)
      scenarioComputeService.computeScenario.mockReturnValue(mockComputedOutputs)
      scenariosRepository.create.mockReturnValue({ ...mockScenario, projectId: 'project-1' })
      scenariosRepository.save.mockResolvedValue({ ...mockScenario, projectId: 'project-1' })

      const result = await service.create(dtoWithProject, 'user-1')

      expect(projectsService.findOne).toHaveBeenCalledWith('project-1')
      expect(scenarioComputeService.computeScenario).toHaveBeenCalledWith(
        expect.any(Object),
        mockProject
      )
      expect(scenariosRepository.create).toHaveBeenCalledWith({
        projectId: 'project-1',
        ownerId: 'user-1',
        isPublic: false,
        inputs: expect.any(Object),
        outputs: mockComputedOutputs,
      })
    })

    it('should throw NotFoundException when base project not found', async () => {
      const dtoWithProject = { ...createScenarioDto, projectId: 'nonexistent' }
      
      projectsService.findOne.mockResolvedValue(null)

      await expect(service.create(dtoWithProject, 'user-1'))
        .rejects.toThrow(NotFoundException)
      await expect(service.create(dtoWithProject, 'user-1'))
        .rejects.toThrow('Base project not found')
    })

    it('should default isPublic to false when not provided', async () => {
      const dtoWithoutPublic = { ...createScenarioDto }
      delete dtoWithoutPublic.isPublic

      scenarioComputeService.computeScenario.mockReturnValue(mockComputedOutputs)
      scenariosRepository.create.mockReturnValue(mockScenario)
      scenariosRepository.save.mockResolvedValue(mockScenario)

      await service.create(dtoWithoutPublic, 'user-1')

      expect(scenariosRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ isPublic: false })
      )
    })
  })

  describe('update', () => {
    const updateData = {
      crewChange: 3,
      targetProfitPct: 20,
      isPublic: true,
    }

    it('should update scenario when user is owner', async () => {
      scenariosRepository.findOne.mockResolvedValue(mockScenario)
      projectsService.findOne.mockResolvedValue(mockProject as any)
      scenarioComputeService.computeScenario.mockReturnValue(mockComputedOutputs)
      scenariosRepository.update.mockResolvedValue({ affected: 1 } as any)
      
      // Mock the second findOne call (after update)
      const updatedScenario = { ...mockScenario, ...updateData }
      scenariosRepository.findOne
        .mockResolvedValueOnce(mockScenario) // First call in update method
        .mockResolvedValueOnce(updatedScenario) // Second call at end of update method

      const result = await service.update('scenario-1', updateData, 'user-1')

      expect(scenarioComputeService.computeScenario).toHaveBeenCalledWith({
        ...mockScenario.inputs,
        ...updateData,
      }, mockProject)

      expect(scenariosRepository.update).toHaveBeenCalledWith('scenario-1', {
        inputs: {
          ...mockScenario.inputs,
          crewChange: 3,
          targetProfitPct: 20,
        },
        outputs: mockComputedOutputs,
        isPublic: true,
      })
    })

    it('should throw NotFoundException when scenario not found', async () => {
      scenariosRepository.findOne.mockResolvedValue(null)

      await expect(service.update('nonexistent', updateData, 'user-1'))
        .rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException when user is not owner', async () => {
      const otherUserScenario = { ...mockScenario, ownerId: 'other-user' }
      scenariosRepository.findOne.mockResolvedValue(otherUserScenario)

      await expect(service.update('scenario-1', updateData, 'user-1'))
        .rejects.toThrow(NotFoundException)
      await expect(service.update('scenario-1', updateData, 'user-1'))
        .rejects.toThrow('Scenario not found')
    })

    it('should update scenario without base project', async () => {
      const scenarioWithoutProject = { ...mockScenario, projectId: null }
      scenariosRepository.findOne
        .mockResolvedValueOnce(scenarioWithoutProject)
        .mockResolvedValueOnce({ ...scenarioWithoutProject, ...updateData })
      
      scenarioComputeService.computeScenario.mockReturnValue(mockComputedOutputs)
      scenariosRepository.update.mockResolvedValue({ affected: 1 } as any)

      const result = await service.update('scenario-1', updateData, 'user-1')

      expect(scenarioComputeService.computeScenario).toHaveBeenCalledWith(
        expect.any(Object),
        null
      )
      expect(projectsService.findOne).not.toHaveBeenCalled()
    })

    it('should preserve isPublic when not provided in update', async () => {
      const updateDataWithoutPublic = { crewChange: 3 }
      
      scenariosRepository.findOne
        .mockResolvedValueOnce(mockScenario)
        .mockResolvedValueOnce({ ...mockScenario, crewChange: 3 })
      
      projectsService.findOne.mockResolvedValue(mockProject as any)
      scenarioComputeService.computeScenario.mockReturnValue(mockComputedOutputs)
      scenariosRepository.update.mockResolvedValue({ affected: 1 } as any)

      await service.update('scenario-1', updateDataWithoutPublic, 'user-1')

      expect(scenariosRepository.update).toHaveBeenCalledWith('scenario-1', {
        inputs: expect.any(Object),
        outputs: mockComputedOutputs,
        isPublic: mockScenario.isPublic, // Should preserve original value
      })
    })
  })

  describe('delete', () => {
    it('should delete scenario when user is owner', async () => {
      scenariosRepository.findOne.mockResolvedValue(mockScenario)
      scenariosRepository.delete.mockResolvedValue({ affected: 1 } as any)

      await service.delete('scenario-1', 'user-1')

      expect(scenariosRepository.delete).toHaveBeenCalledWith('scenario-1')
    })

    it('should throw NotFoundException when scenario not found', async () => {
      scenariosRepository.findOne.mockResolvedValue(null)

      await expect(service.delete('nonexistent', 'user-1'))
        .rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException when user is not owner', async () => {
      const otherUserScenario = { ...mockScenario, ownerId: 'other-user' }
      scenariosRepository.findOne.mockResolvedValue(otherUserScenario)

      await expect(service.delete('scenario-1', 'user-1'))
        .rejects.toThrow(NotFoundException)
      await expect(service.delete('scenario-1', 'user-1'))
        .rejects.toThrow('Scenario not found')
    })
  })

  describe('error handling', () => {
    it('should handle repository errors in findAll', async () => {
      scenariosRepository.find.mockRejectedValue(new Error('Database connection failed'))

      await expect(service.findAll('user-1')).rejects.toThrow('Database connection failed')
    })

    it('should handle compute service errors in create', async () => {
      const createScenarioDto: CreateScenarioDto = {
        projectSize: { units: 100 },
        scope: ['plumbing'],
        crewChange: 0,
        scheduleChangeWeeks: 0,
      }

      scenarioComputeService.computeScenario.mockImplementation(() => {
        throw new Error('Computation failed')
      })

      await expect(service.create(createScenarioDto, 'user-1'))
        .rejects.toThrow('Computation failed')
    })

    it('should handle save errors in create', async () => {
      const createScenarioDto: CreateScenarioDto = {
        projectSize: { units: 100 },
        scope: ['plumbing'],
        crewChange: 0,
        scheduleChangeWeeks: 0,
      }

      scenarioComputeService.computeScenario.mockReturnValue(mockComputedOutputs)
      scenariosRepository.create.mockReturnValue(mockScenario)
      scenariosRepository.save.mockRejectedValue(new Error('Save failed'))

      await expect(service.create(createScenarioDto, 'user-1'))
        .rejects.toThrow('Save failed')
    })
  })
})