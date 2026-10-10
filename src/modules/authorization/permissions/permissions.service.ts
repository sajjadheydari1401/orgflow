import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';
import type { PermissionData } from './types/permission.js';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  //CREATE PERMISSION
  async createPermission(input: CreatePermissionDto): Promise<PermissionData> {
    // Ensure the resource exists before creating a permission for it.
    const resource = await this.prisma.public.Resource.where({
      id: input.resourceId,
    }).first();

    // If the resource does not exist, throw a NotFoundException.
    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    // Keep each action unique within its resource.
    const existing = await this.prisma.public.Permission.where({
      resourceId: input.resourceId,
      action: input.action,
    }).first();

    // If a permission with the same action already exists for the resource, throw a ConflictException.
    if (existing) {
      throw new ConflictException(
        'This action is already assigned to the resource',
      );
    }

    // Create the new permission with the provided input.
    return this.prisma.public.Permission.create({
      resourceId: input.resourceId,
      action: input.action,
    });
  }

  //READ PERMISSIONS
  async listPermissions(): Promise<PermissionData[]> {
    return await this.prisma.public.Permission.orderBy((permission) =>
      permission.action.asc(),
    ).all();
  }

  //READ PERMISSION BY ID
  async getPermission(id: string): Promise<PermissionData> {
    const permission = await this.prisma.public.Permission.where({
      id,
    }).first();

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return permission;
  }

  //UPDATE PERMISSION
  async updatePermission(
    id: string,
    input: UpdatePermissionDto,
  ): Promise<PermissionData> {
    // Ensure the permission exists before updating it.
    const existing = await this.prisma.public.Permission.where({ id }).first();

    if (!existing) {
      throw new NotFoundException('Permission not found');
    }

    // Ensure the permission is linked to an existing resource.
    const resource = await this.prisma.public.Resource.where({
      id: input.resourceId,
    }).first();

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    // Keep each action unique within its resource.
    const duplicate = await this.prisma.public.Permission.where({
      resourceId: input.resourceId,
      action: input.action,
    }).first();

    if (duplicate && duplicate.id !== id) {
      throw new ConflictException(
        'This action is already assigned to the resource',
      );
    }

    // Save the updated resource/action pair.
    const updated = await this.prisma.public.Permission.where({ id }).update({
      resourceId: input.resourceId,
      action: input.action,
    });

    // Handle a permission removed while the update was in progress.
    if (!updated) {
      throw new NotFoundException('Permission not found');
    }

    return updated;
  }

  //DELETE PERMISSION
  async deletePermission(id: string): Promise<{ deleted: true }> {
    // Ensure the permission exists before attempting to delete it.
    const existing = await this.prisma.public.Permission.where({ id }).first();

    if (!existing) {
      throw new NotFoundException('Permission not found');
    }

    // Preserve role assignments that depend on this permission.
    const rolePermission = await this.prisma.public.RolePermission.where({
      permissionId: id,
    }).first();

    // If the permission is assigned to any roles, prevent deletion.
    if (rolePermission) {
      throw new ConflictException(
        'Cannot delete a permission while it is assigned to roles',
      );
    }

    // Delete only after confirming no roles are assigned to the permission.
    await this.prisma.public.Permission.where({ id }).delete();

    return { deleted: true };
  }
}
