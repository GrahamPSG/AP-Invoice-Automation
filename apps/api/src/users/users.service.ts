import { Injectable, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './user.entity'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } })
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } })
  }

  async create(userData: {
    email: string
    password: string
    role: 'viewer' | 'editor' | 'admin'
  }): Promise<User> {
    const existingUser = await this.findByEmail(userData.email)
    if (existingUser) {
      throw new ConflictException('User with this email already exists')
    }

    const user = this.usersRepository.create(userData)
    return this.usersRepository.save(user)
  }
}