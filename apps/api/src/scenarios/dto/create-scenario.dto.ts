import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsObject,
  Min,
  Max,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

class ProjectSizeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  units?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  dollars?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  sqFt?: number
}

export class CreateScenarioDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean

  @ApiProperty({ type: ProjectSizeDto })
  @IsObject()
  @ValidateNested()
  @Type(() => ProjectSizeDto)
  projectSize: ProjectSizeDto

  @ApiProperty({
    type: [String],
    enum: ['plumbing', 'hvac', 'combined'],
  })
  @IsArray()
  @IsEnum(['plumbing', 'hvac', 'combined'], { each: true })
  scope: ('plumbing' | 'hvac' | 'combined')[]

  @ApiProperty()
  @IsNumber()
  @Min(-10)
  @Max(10)
  crewChange: number

  @ApiProperty()
  @IsNumber()
  @Min(-52)
  @Max(52)
  scheduleChangeWeeks: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(-50)
  @Max(50)
  overheadChangePct?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(-50)
  @Max(100)
  materialInflationPct?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(-50)
  @Max(100)
  laborRateChangePct?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  targetProfitPct?: number
}