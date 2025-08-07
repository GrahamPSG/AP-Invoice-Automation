import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { ConflictException } from '@nestjs/common'

describe('AuthController', () => {
  let controller: AuthController
  let service: AuthService

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    service = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('register', () => {
    it('should return 201 and user data on successful registration', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        role: 'viewer' as const,
      }

      const expectedUser = {
        id: '1',
        email: 'test@example.com',
        role: 'viewer',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockAuthService.register.mockResolvedValue(expectedUser)

      const result = await controller.register(registerDto)

      expect(result).toEqual(expectedUser)
      expect(service.register).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
        registerDto.role,
      )
    })

    it('should throw ConflictException for duplicate email', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
      }

      mockAuthService.register.mockRejectedValue(
        new ConflictException('User with this email already exists'),
      )

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      )
    })
  })

  describe('login', () => {
    it('should return JWT token on successful login', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        role: 'viewer' as const,
      }

      const expectedResponse = {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      }

      mockAuthService.login.mockResolvedValue(expectedResponse)

      const result = await controller.login({ user })

      expect(result).toEqual(expectedResponse)
      expect(result.access_token).toBeDefined()
      expect(result.user).toEqual({
        id: user.id,
        email: user.email,
        role: user.role,
      })
      expect(service.login).toHaveBeenCalledWith(user)
    })
  })
})