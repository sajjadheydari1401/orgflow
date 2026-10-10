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
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { RolesService } from './roles.service.js';
import type { RoleData } from './types/role.js';

@ApiTags('Roles')
@Controller('authorization/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  createRole(@Body() input: CreateRoleDto): Promise<RoleData> {
    return this.rolesService.createRole(input);
  }

  @Get()
  listRoles(): Promise<RoleData[]> {
    return this.rolesService.listRoles();
  }

  @Get(':id')
  getRole(@Param('id') id: string): Promise<RoleData> {
    return this.rolesService.getRole(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  updateRole(
    @Param('id') id: string,
    @Body() input: UpdateRoleDto,
  ): Promise<RoleData> {
    return this.rolesService.updateRole(id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
  }
}
