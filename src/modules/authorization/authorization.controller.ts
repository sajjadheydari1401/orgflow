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
import { CreateResourceDto } from './dto/create-resource.dto.js';
import { UpdateResourceDto } from './dto/update-resource.dto.js';
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';
import { AuthorizationService } from './authorization.service.js';
import type { PermissionData } from './types/permission.js';
import type { ResourceData } from './types/resource.js';

@ApiTags('Authorization')
@Controller('authorization')
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  @Post('resources')
  createResource(@Body() input: CreateResourceDto): Promise<ResourceData> {
    return this.authorizationService.createResource(input);
  }

  @Get('resources')
  listResources(): Promise<ResourceData[]> {
    return this.authorizationService.listResources();
  }

  @Get('resources/:id')
  getResource(@Param('id') id: string): Promise<ResourceData> {
    return this.authorizationService.getResource(id);
  }

  @Patch('resources/:id')
  @HttpCode(HttpStatus.OK)
  updateResource(
    @Param('id') id: string,
    @Body() input: UpdateResourceDto,
  ): Promise<ResourceData> {
    return this.authorizationService.updateResource(id, input);
  }

  @Delete('resources/:id')
  @HttpCode(HttpStatus.OK)
  deleteResource(@Param('id') id: string) {
    return this.authorizationService.deleteResource(id);
  }

  @Post('permissions')
  createPermission(
    @Body() input: CreatePermissionDto,
  ): Promise<PermissionData> {
    return this.authorizationService.createPermission(input);
  }

  @Get('permissions')
  listPermissions(): Promise<PermissionData[]> {
    return this.authorizationService.listPermissions();
  }

  @Get('permissions/:id')
  getPermission(@Param('id') id: string): Promise<PermissionData> {
    return this.authorizationService.getPermission(id);
  }

  @Patch('permissions/:id')
  @HttpCode(HttpStatus.OK)
  updatePermission(
    @Param('id') id: string,
    @Body() input: UpdatePermissionDto,
  ): Promise<PermissionData> {
    return this.authorizationService.updatePermission(id, input);
  }

  @Delete('permissions/:id')
  @HttpCode(HttpStatus.OK)
  deletePermission(@Param('id') id: string) {
    return this.authorizationService.deletePermission(id);
  }
}
