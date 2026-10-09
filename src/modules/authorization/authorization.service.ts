import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateResourceDto } from './dto/create-resource.dto.js';
import { UpdateResourceDto } from './dto/update-resource.dto.js';
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';
import type { PermissionData } from './types/permission.js';
import type { ResourceData } from './types/resource.js';
import { normalizeRoute } from './utils/string.js';

@Injectable()
export class AuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  //CREATE RESOURCE
  async createResource(input: CreateResourceDto): Promise<ResourceData> {
    const route = normalizeRoute(input.route);
    const existing = await this.prisma.public.Resource.where({ route }).first();

    if (existing) {
      throw new ConflictException('A resource with this route already exists');
    }

    return this.prisma.public.Resource.create({ route });
  }

  //READ RESOURCE
  async listResources(): Promise<ResourceData[]> {
    return await this.prisma.public.Resource.orderBy((resource) =>
      resource.route.asc(),
    ).all();
  }

  //READ RESOURCE BY ID
  async getResource(id: string): Promise<ResourceData> {
    const resource = await this.prisma.public.Resource.where({ id }).first();

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    return resource;
  }

  //UPDATE RESOURCE
  async updateResource(
    id: string,
    input: UpdateResourceDto,
  ): Promise<ResourceData> {
    // Trim and validate the route before querying the database.
    const route = normalizeRoute(input.route);

    // Ensure the requested resource exists.
    const existing = await this.prisma.public.Resource.where({ id }).first();

    if (!existing) {
      throw new NotFoundException('Resource not found');
    }

    // Keep each route unique across resources.
    const duplicate = await this.prisma.public.Resource.where({
      route,
    }).first();

    if (duplicate && duplicate.id !== id) {
      throw new ConflictException('A resource with this route already exists');
    }

    // Save the new route
    const updated = await this.prisma.public.Resource.where({ id }).update({
      route,
    });

    // If it did not affect any rows, it means the resource was not found.
    if (!updated) {
      throw new NotFoundException('Resource not found');
    }

    return updated;
  }

  //DELETE RESOURCE
  async deleteResource(id: string): Promise<{ deleted: true }> {
    const existing = await this.prisma.public.Resource.where({ id }).first();

    if (!existing) {
      throw new NotFoundException('Resource not found');
    }

    // Preserve permissions and role assignments that depend on this resource.
    const permission = await this.prisma.public.Permission.where({
      resourceId: id,
    }).first();

    if (permission) {
      throw new ConflictException(
        'Cannot delete a resource while permissions are assigned to it',
      );
    }

    // Delete the resource only after confirming it has no permissions.
    await this.prisma.public.Resource.where({ id }).delete();

    return { deleted: true };
  }

  //CREATE PERMISSION
  async createPermission(input: CreatePermissionDto): Promise<PermissionData> {
    const resource = await this.prisma.public.Resource.where({
      id: input.resourceId,
    }).first();

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    const existing = await this.prisma.public.Permission.where({
      resourceId: input.resourceId,
      action: input.action,
    }).first();

    if (existing) {
      throw new ConflictException(
        'This action is already assigned to the resource',
      );
    }

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
