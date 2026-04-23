import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { VillagesService } from './villages.service';
import { CreateVillageDto } from './dto/create-village.dto';
import { UpdateVillageDto } from './dto/update-village.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('villages')
export class VillagesController {
  constructor(private villagesService: VillagesService) {}

  @Public()
  @Get()
  findAll() {
    return this.villagesService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.villagesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateVillageDto) {
    return this.villagesService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVillageDto) {
    return this.villagesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.villagesService.remove(id);
  }
}
