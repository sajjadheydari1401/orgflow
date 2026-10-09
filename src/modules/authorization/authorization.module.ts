import { Module } from '@nestjs/common';
import { AuthorizationController } from './authorization.controller.js';
import { AuthorizationService } from './authorization.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AuthorizationController],
  providers: [AuthorizationService],
})
export class AuthorizationModule {}
