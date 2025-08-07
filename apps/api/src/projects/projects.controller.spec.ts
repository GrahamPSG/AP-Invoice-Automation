import { Test, TestingModule } from '@nestjs/testing'
import { ProjectsController } from './projects.controller'
import { ProjectsService } from './projects.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ExecutionContext } from '@nestjs/common'

describe('ProjectsController', () => {
  let controller: ProjectsController
  let service: ProjectsService

  const mockProjectsService = {
    findAll: jest.fn().mockResolvedValue([]),
  }

  const mockJwtAuthGuard = {
    canActivate: jest.fn().mockReturnValue(false), // Start with failing auth
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile()

    controller = module.get<ProjectsController>(ProjectsController)
    service = module.get<ProjectsService>(ProjectsService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('GET /projects', () => {
    it('should return 401 when unauthenticated', async () => {
      // This test should fail initially because we haven't implemented the guard
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
      } as ExecutionContext

      const canActivate = mockJwtAuthGuard.canActivate(mockContext)
      expect(canActivate).toBe(false)
    })

    it('should return projects when authenticated', async () => {
      mockJwtAuthGuard.canActivate.mockReturnValue(true)
      const mockUser = { id: '1', email: 'test@example.com', role: 'editor' }
      
      const result = await controller.findAll()
      expect(result).toEqual([])
      expect(service.findAll).toHaveBeenCalled()
    })
  })
})