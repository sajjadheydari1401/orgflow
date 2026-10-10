import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateUnitDto } from './dto/create-unit.dto.js';
import { MoveUnitDto } from './dto/move-unit.dto.js';
import { SetUnitStatusDto } from './dto/set-unit-status.dto.js';
import { UpdateUnitDto } from './dto/update-unit.dto.js';
import { UnitsService } from './units.service.js';
import type { UnitData } from './types/unit.js';

@ApiTags('Units')
@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  createUnit(@Body() input: CreateUnitDto): Promise<UnitData> {
    return this.unitsService.createUnit(input);
  }

  @Get()
  listUnits(): Promise<UnitData[]> {
    return this.unitsService.listUnits();
  }

  @Get(':id')
  getUnit(@Param('id') id: string): Promise<UnitData> {
    return this.unitsService.getUnit(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  updateUnit(
    @Param('id') id: string,
    @Body() input: UpdateUnitDto,
  ): Promise<UnitData> {
    return this.unitsService.updateUnit(id, input);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  updateUnitStatus(
    @Param('id') id: string,
    @Body() input: SetUnitStatusDto,
  ): Promise<UnitData> {
    return this.unitsService.updateUnitStatus(id, input.isActive);
  }

  @Patch(':id/move')
  @HttpCode(HttpStatus.OK)
  moveUnit(
    @Param('id') id: string,
    @Body() input: MoveUnitDto,
  ): Promise<UnitData> {
    return this.unitsService.moveUnit(id, input.targetUnitId ?? null);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteUnit(@Param('id') id: string) {
    return this.unitsService.deleteUnit(id);
  }
}
