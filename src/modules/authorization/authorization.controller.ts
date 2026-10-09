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
import { AuthorizationService } from './authorization.service.js';
import type { ResourceData } from './types/resource.js';

@ApiTags('Authorization')
@Controller('authorization/resources')
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  @Post()
  createResource(@Body() input: CreateResourceDto): Promise<ResourceData> {
    return this.authorizationService.createResource(input);
  }

  @Get()
  listResources(): Promise<ResourceData[]> {
    return this.authorizationService.listResources();
  }

  @Get(':id')
  getResource(@Param('id') id: string): Promise<ResourceData> {
    return this.authorizationService.getResource(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  updateResource(
    @Param('id') id: string,
    @Body() input: UpdateResourceDto,
  ): Promise<ResourceData> {
    return this.authorizationService.updateResource(id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteResource(@Param('id') id: string) {
    return this.authorizationService.deleteResource(id);
  }
}
