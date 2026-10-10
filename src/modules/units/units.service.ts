import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateUnitDto } from './dto/create-unit.dto.js';
import { UpdateUnitDto } from './dto/update-unit.dto.js';
import type { UnitData } from './types/unit.js';

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  //CREATE UNIT
  async createUnit(input: CreateUnitDto): Promise<UnitData> {
    const parentId = input.parentId ?? null;
    const name = input.name.trim();
    const description = input.description?.trim() || null;

    if (parentId) {
      const parent = await this.prisma.public.Unit.where({
        id: parentId,
      }).first();

      if (!parent) {
        throw new NotFoundException('Parent unit not found');
      }
    }

    // Keep sibling unit names unique, including root units.
    const duplicate = await this.prisma.public.Unit.where({
      parentId,
      name,
    }).first();

    if (duplicate) {
      throw new ConflictException(
        'A unit with this name already exists under this parent',
      );
    }

    return this.prisma.public.Unit.create({
      parentId,
      name,
      description,
      type: input.type,
    });
  }

  //READ UNITS
  async listUnits(): Promise<UnitData[]> {
    return await this.prisma.public.Unit.orderBy((unit) =>
      unit.name.asc(),
    ).all();
  }

  //READ UNIT BY ID
  async getUnit(id: string): Promise<UnitData> {
    const unit = await this.prisma.public.Unit.where({ id }).first();

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    return unit;
  }

  //UPDATE UNIT
  async updateUnit(id: string, input: UpdateUnitDto): Promise<UnitData> {
    const existing = await this.prisma.public.Unit.where({ id }).first();

    if (!existing) {
      throw new NotFoundException('Unit not found');
    }

    const name = input.name.trim();

    // Keep sibling unit names unique, including root units.
    const duplicate = await this.prisma.public.Unit.where({
      parentId: existing.parentId,
      name,
    }).first();

    if (duplicate && duplicate.id !== id) {
      throw new ConflictException(
        'A unit with this name already exists under this parent',
      );
    }

    const updated = await this.prisma.public.Unit.where({ id }).update({
      name,
      type: input.type,
      description: input.description?.trim() || null,
      isActive: input.isActive,
    });

    if (!updated) {
      throw new NotFoundException('Unit not found');
    }

    return updated;
  }

  //UPDATE UNIT STATUS
  async updateUnitStatus(id: string, isActive: boolean): Promise<UnitData> {
    const unit = await this.prisma.public.Unit.where({ id }).update({
      isActive,
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    return unit;
  }

  //DELETE UNIT
  async deleteUnit(id: string): Promise<{ deleted: true }> {
    const existing = await this.prisma.public.Unit.where({ id }).first();

    if (!existing) {
      throw new NotFoundException('Unit not found');
    }

    // Check for child units or roles before deletion
    const child = await this.prisma.public.Unit.where({ parentId: id }).first();

    if (child) {
      throw new ConflictException(
        'Cannot delete a unit while it has child units',
      );
    }

    // Check for roles associated with the unit before deletion
    const role = await this.prisma.public.Role.where({ unitId: id }).first();

    if (role) {
      throw new ConflictException('Cannot delete a unit while it has roles');
    }

    // Delete the unit if no child units or roles are associated with it
    await this.prisma.public.Unit.where({ id }).delete();

    return { deleted: true };
  }
}
