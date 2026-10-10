import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { UnitsController } from './units.controller.js';
import { UnitsService } from './units.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [UnitsController],
  providers: [UnitsService],
})
export class UnitsModule {}
