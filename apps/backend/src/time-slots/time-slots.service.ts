import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';

@Injectable()
export class TimeSlotsService {
  constructor(private prisma: PrismaService) {}

  async findAll(eventId?: number) {
    return this.prisma.timeSlot.findMany({
      where: eventId ? { eventId } : undefined,
      orderBy: { time: 'asc' },
      include: {
        event: {
          include: { village: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async findWithAvailability(eventId: number, date: string) {
    const slots = await this.prisma.timeSlot.findMany({
      where: { eventId },
      orderBy: { time: 'asc' },
      include: {
        registrations: {
          where: { date: new Date(date) },
          select: { id: true, groupName: true, participantCount: true },
        },
        event: {
          include: { village: { select: { id: true, name: true } } },
        },
      },
    });

    return slots.map((slot) => ({
      ...slot,
      available: slot.registrations.length === 0,
      registration: slot.registrations[0] ?? null,
      registrations: undefined,
    }));
  }

  async findOne(id: number) {
    const slot = await this.prisma.timeSlot.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!slot) throw new NotFoundException(`TimeSlot #${id} not found`);
    return slot;
  }

  async create(dto: CreateTimeSlotDto) {
    try {
      return await this.prisma.timeSlot.create({
        data: dto,
        include: { event: true },
      });
    } catch (e) {
      if (e.code === 'P2002') throw new ConflictException('Time slot already exists for this event');
      if (e.code === 'P2003') throw new NotFoundException(`Event #${dto.eventId} not found`);
      throw e;
    }
  }

  async update(id: number, dto: UpdateTimeSlotDto) {
    await this.findOne(id);
    try {
      return await this.prisma.timeSlot.update({
        where: { id },
        data: dto,
        include: { event: true },
      });
    } catch (e) {
      if (e.code === 'P2002') throw new ConflictException('Time slot already exists for this event');
      throw e;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.timeSlot.delete({ where: { id } });
  }
}
