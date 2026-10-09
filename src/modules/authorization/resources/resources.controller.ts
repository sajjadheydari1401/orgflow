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
import { ResourcesService } from './resources.service.js';
import type { ResourceData } from './types/resource.js';

@ApiTags('Resources')
@Controller('authorization/resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  createResource(@Body() input: CreateResourceDto): Promise<ResourceData> {
    return this.resourcesService.createResource(input);
  }

  @Get()
  listResources(): Promise<ResourceData[]> {
    return this.resourcesService.listResources();
  }

  @Get(':id')
  getResource(@Param('id') id: string): Promise<ResourceData> {
    return this.resourcesService.getResource(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  updateResource(
    @Param('id') id: string,
    @Body() input: UpdateResourceDto,
  ): Promise<ResourceData> {
    return this.resourcesService.updateResource(id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteResource(@Param('id') id: string) {
    return this.resourcesService.deleteResource(id);
  }
}
