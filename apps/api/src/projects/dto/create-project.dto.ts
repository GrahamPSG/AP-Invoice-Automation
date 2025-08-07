import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsObject,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

class CostBreakdownDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  labor: number

  @ApiProperty()
  @IsNumber()
  @Min(0)
  materials: number

  @ApiProperty()
  @IsNumber()
  @Min(0)
  equipment: number

  @ApiProperty()
  @IsNumber()
  @Min(0)
  overhead: number

  @ApiProperty()
  @IsNumber()
  @Min(0)
  profit: number
}

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  name: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  sizeUnits?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  sizeSqFt?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  sizeDollars?: number

  @ApiProperty({ enum: ['plumbing', 'hvac', 'combined'] })
  @IsEnum(['plumbing', 'hvac', 'combined'])
  scope: 'plumbing' | 'hvac' | 'combined'

  @ApiProperty()
  @IsInt()
  @Min(1)
  durationWeeks: number

  @ApiProperty({ type: CostBreakdownDto })
  @IsObject()
  @ValidateNested()
  @Type(() => CostBreakdownDto)
  costs: CostBreakdownDto

  @ApiProperty()
  @IsInt()
  @Min(1)
  crewSize: number

  @ApiProperty()
  @IsNumber()
  @Min(0)
  revenuePerTechDay: number

  @ApiProperty()
  @IsNumber()
  grossProfit: number

  @ApiProperty()
  @IsNumber()
  netProfit: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  columnMap?: Record<string, string>
}