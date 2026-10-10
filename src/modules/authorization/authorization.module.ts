import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { PermissionsController } from './permissions/permissions.controller.js';
import { PermissionsService } from './permissions/permissions.service.js';
import { RolePermissionsController } from './role-permissions/role-permissions.controller.js';
import { RolePermissionsService } from './role-permissions/role-permissions.service.js';
import { ResourcesController } from './resources/resources.controller.js';
import { ResourcesService } from './resources/resources.service.js';
import { RolesController } from './roles/roles.controller.js';
import { RolesService } from './roles/roles.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [
    ResourcesController,
    PermissionsController,
    RolesController,
    RolePermissionsController,
  ],
  providers: [
    ResourcesService,
    PermissionsService,
    RolesService,
    RolePermissionsService,
  ],
})
export class AuthorizationModule {}
