import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ROLE_SCOPES, type RoleScope } from '../types/role.js';

export class UpdateRoleDto {
  @ApiProperty({
    example: 'a8c9f6bb-8a34-4ac5-b0dc-6ea58a282f14',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  unitId?: string;

  @ApiProperty({ example: 'Finance Manager', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiProperty({ example: 'Approves payment workflows', required: false })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ enum: ROLE_SCOPES, default: 'DESCENDANTS', required: false })
  @IsOptional()
  @IsIn(ROLE_SCOPES)
  scope?: RoleScope;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
