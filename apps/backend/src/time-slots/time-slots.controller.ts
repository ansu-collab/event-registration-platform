import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { TimeSlotsService } from './time-slots.service';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('time-slots')
export class TimeSlotsController {
  constructor(private timeSlotsService: TimeSlotsService) {}

  @Public()
  @Get()
  findAll(
    @Query('eventId') eventId?: string,
    @Query('date') date?: string,
  ) {
    if (eventId && date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new BadRequestException('date must be in YYYY-MM-DD format');
      }
      return this.timeSlotsService.findWithAvailability(parseInt(eventId), date);
    }
    return this.timeSlotsService.findAll(eventId ? parseInt(eventId) : undefined);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.timeSlotsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTimeSlotDto) {
    return this.timeSlotsService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTimeSlotDto) {
    return this.timeSlotsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.timeSlotsService.remove(id);
  }
}
