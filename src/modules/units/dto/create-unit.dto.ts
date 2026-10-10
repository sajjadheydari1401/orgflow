import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { UNIT_TYPES, type UnitType } from '../types/unit.js';

export class CreateUnitDto {
  @ApiProperty({ example: 'Finance' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/\S/, { message: 'Name must contain a non-whitespace character' })
  name!: string;

  @ApiProperty({ enum: UNIT_TYPES })
  @IsIn(UNIT_TYPES)
  type!: UnitType;

  @ApiPropertyOptional({ example: 'Finance division' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: 'a8c9f6bb-8a34-4ac5-b0dc-6ea58a282f14',
    description: 'Parent unit ID. Omit or pass null for a root unit.',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
