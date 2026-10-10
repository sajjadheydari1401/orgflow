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
import { CreateRolePermissionDto } from './dto/create-role-permission.dto.js';
import { UpdateRolePermissionDto } from './dto/update-role-permission.dto.js';
import { RolePermissionsService } from './role-permissions.service.js';
import type { RolePermissionData } from './types/role-permission.js';

@ApiTags('Role Permissions')
@Controller('authorization/role-permissions')
export class RolePermissionsController {
  constructor(
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  @Post()
  createRolePermission(
    @Body() input: CreateRolePermissionDto,
  ): Promise<RolePermissionData> {
    return this.rolePermissionsService.createRolePermission(input);
  }

  @Get()
  listRolePermissions(): Promise<RolePermissionData[]> {
    return this.rolePermissionsService.listRolePermissions();
  }

  @Get(':id')
  getRolePermission(@Param('id') id: string): Promise<RolePermissionData> {
    return this.rolePermissionsService.getRolePermission(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  updateRolePermission(
    @Param('id') id: string,
    @Body() input: UpdateRolePermissionDto,
  ): Promise<RolePermissionData> {
    return this.rolePermissionsService.updateRolePermission(id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteRolePermission(@Param('id') id: string) {
    return this.rolePermissionsService.deleteRolePermission(id);
  }
}
