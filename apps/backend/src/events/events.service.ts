import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async findAll(villageId?: number) {
    return this.prisma.event.findMany({
      where: villageId ? { villageId } : undefined,
      orderBy: { name: 'asc' },
      include: {
        village: { select: { id: true, name: true } },
        timeSlots: { orderBy: { time: 'asc' } },
        _count: { select: { timeSlots: true } },
      },
    });
  }

  async findOne(id: number) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        village: true,
        timeSlots: { orderBy: { time: 'asc' } },
      },
    });

    if (!event) throw new NotFoundException(`Event #${id} not found`);
    return event;
  }

  async create(dto: CreateEventDto) {
    try {
      return await this.prisma.event.create({
        data: dto,
        include: { village: { select: { id: true, name: true } } },
      });
    } catch (e) {
      if (e.code === 'P2002') throw new ConflictException('Event name already exists in this village');
      if (e.code === 'P2003') throw new NotFoundException(`Village #${dto.villageId} not found`);
      throw e;
    }
  }

  async update(id: number, dto: UpdateEventDto) {
    await this.findOne(id);
    try {
      return await this.prisma.event.update({
        where: { id },
        data: dto,
        include: { village: { select: { id: true, name: true } } },
      });
    } catch (e) {
      if (e.code === 'P2002') throw new ConflictException('Event name already exists in this village');
      throw e;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.event.delete({ where: { id } });
  }
}
