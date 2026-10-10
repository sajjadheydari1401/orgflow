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
import { CreateRoleAssignmentDto } from './dto/create-role-assignment.dto.js';
import { UpdateRoleAssignmentDto } from './dto/update-role-assignment.dto.js';
import { RoleAssignmentsService } from './role-assignments.service.js';
import type { RoleAssignmentData } from './types/role-assignment.js';

@ApiTags('Role Assignments')
@Controller('authorization/role-assignments')
export class RoleAssignmentsController {
  constructor(
    private readonly roleAssignmentsService: RoleAssignmentsService,
  ) {}

  @Post()
  createRoleAssignment(
    @Body() input: CreateRoleAssignmentDto,
  ): Promise<RoleAssignmentData> {
    return this.roleAssignmentsService.createRoleAssignment(input);
  }

  @Get()
  listRoleAssignments(): Promise<RoleAssignmentData[]> {
    return this.roleAssignmentsService.listRoleAssignments();
  }

  @Get(':id')
  getRoleAssignment(@Param('id') id: string): Promise<RoleAssignmentData> {
    return this.roleAssignmentsService.getRoleAssignment(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  updateRoleAssignment(
    @Param('id') id: string,
    @Body() input: UpdateRoleAssignmentDto,
  ): Promise<RoleAssignmentData> {
    return this.roleAssignmentsService.updateRoleAssignment(id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteRoleAssignment(@Param('id') id: string) {
    return this.roleAssignmentsService.deleteRoleAssignment(id);
  }
}
