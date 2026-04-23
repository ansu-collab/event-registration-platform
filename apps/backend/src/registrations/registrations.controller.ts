import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('registrations')
export class RegistrationsController {
  constructor(private registrationsService: RegistrationsService) {}

  @Get()
  findAll(
    @Query('date') date?: string,
    @Query('villageId') villageId?: string,
  ) {
    return this.registrationsService.findAll({
      date,
      villageId: villageId ? parseInt(villageId) : undefined,
    });
  }

  @Get('export/csv')
  async exportCsv(
    @Query('date') date?: string,
    @Query('villageId') villageId?: string,
    @Res() res?: Response,
  ) {
    const csv = await this.registrationsService.exportCsv({
      date,
      villageId: villageId ? parseInt(villageId) : undefined,
    });

    const filename = `registrations-${date ?? 'all'}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Get('calendar')
  getCalendar(@Query('date') date: string) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date query param required in YYYY-MM-DD format');
    }
    return this.registrationsService.getCalendar(date);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.registrationsService.findOne(id);
  }

  @Public()
  @Post()
  create(@Body() dto: CreateRegistrationDto) {
    return this.registrationsService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.registrationsService.remove(id);
  }
}
