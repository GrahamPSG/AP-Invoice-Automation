import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string

  @ApiProperty({ enum: ['viewer', 'editor', 'admin'], default: 'viewer' })
  @IsOptional()
  @IsEnum(['viewer', 'editor', 'admin'])
  role?: 'viewer' | 'editor' | 'admin'
}