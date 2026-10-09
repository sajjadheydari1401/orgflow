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
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';
import { PermissionsService } from './permissions.service.js';
import type { PermissionData } from './types/permission.js';

@ApiTags('Permissions')
@Controller('authorization/permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  createPermission(
    @Body() input: CreatePermissionDto,
  ): Promise<PermissionData> {
    return this.permissionsService.createPermission(input);
  }

  @Get()
  listPermissions(): Promise<PermissionData[]> {
    return this.permissionsService.listPermissions();
  }

  @Get(':id')
  getPermission(@Param('id') id: string): Promise<PermissionData> {
    return this.permissionsService.getPermission(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  updatePermission(
    @Param('id') id: string,
    @Body() input: UpdatePermissionDto,
  ): Promise<PermissionData> {
    return this.permissionsService.updatePermission(id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deletePermission(@Param('id') id: string) {
    return this.permissionsService.deletePermission(id);
  }
}
