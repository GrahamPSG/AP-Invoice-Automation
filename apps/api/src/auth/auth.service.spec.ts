import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'
import * as bcrypt from 'bcryptjs'

// Mock bcrypt
jest.mock('bcryptjs')
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

describe('AuthService', () => {
  let service: AuthService
  let usersService: jest.Mocked<UsersService>
  let jwtService: jest.Mocked<JwtService>

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: 'viewer' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    }

    const mockJwtService = {
      sign: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    usersService = module.get(UsersService)
    jwtService = module.get(JwtService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser)
      mockedBcrypt.compare.mockResolvedValue(true as never)

      const result = await service.validateUser('test@example.com', 'password')

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        role: 'viewer',
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      })
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com')
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedpassword')
    })

    it('should return null when user is not found', async () => {
      usersService.findByEmail.mockResolvedValue(null)

      const result = await service.validateUser('test@example.com', 'password')

      expect(result).toBeNull()
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com')
      expect(bcrypt.compare).not.toHaveBeenCalled()
    })

    it('should return null when password is invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser)
      mockedBcrypt.compare.mockResolvedValue(false as never)

      const result = await service.validateUser('test@example.com', 'wrongpassword')

      expect(result).toBeNull()
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com')
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword')
    })
  })

  describe('login', () => {
    it('should return access token and user info', async () => {
      const userWithoutPassword = {
        id: '1',
        email: 'test@example.com',
        role: 'viewer',
      }

      jwtService.sign.mockReturnValue('jwt.token.here')

      const result = await service.login(userWithoutPassword)

      expect(result).toEqual({
        access_token: 'jwt.token.here',
        user: userWithoutPassword,
      })
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'test@example.com',
        sub: '1',
        role: 'viewer',
      })
    })
  })

  describe('register', () => {
    it('should create user with hashed password', async () => {
      const newUser = {
        ...mockUser,
        id: '2',
        email: 'new@example.com',
      }

      mockedBcrypt.hash.mockResolvedValue('hashedpassword123' as never)
      usersService.create.mockResolvedValue(newUser)

      const result = await service.register('new@example.com', 'password123', 'editor')

      expect(result).toEqual({
        id: '2',
        email: 'new@example.com',
        role: 'viewer',
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      })
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10)
      expect(usersService.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'hashedpassword123',
        role: 'editor',
      })
    })

    it('should default to viewer role when no role specified', async () => {
      const newUser = { ...mockUser, id: '2', email: 'new@example.com' }
      
      mockedBcrypt.hash.mockResolvedValue('hashedpassword123' as never)
      usersService.create.mockResolvedValue(newUser)

      await service.register('new@example.com', 'password123')

      expect(usersService.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'hashedpassword123',
        role: 'viewer',
      })
    })
  })
})