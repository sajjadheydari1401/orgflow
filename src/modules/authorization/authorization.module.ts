import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { PermissionsController } from './permissions/permissions.controller.js';
import { PermissionsService } from './permissions/permissions.service.js';
import { ResourcesController } from './resources/resources.controller.js';
import { ResourcesService } from './resources/resources.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [ResourcesController, PermissionsController],
  providers: [ResourcesService, PermissionsService],
})
export class AuthorizationModule {}
