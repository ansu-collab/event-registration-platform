import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';

@Injectable()
export class RegistrationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { date?: string; villageId?: number }) {
    const where: any = {};

    if (filters?.date) {
      where.date = new Date(filters.date);
    }

    if (filters?.villageId) {
      where.timeSlot = { event: { villageId: filters.villageId } };
    }

    return this.prisma.registration.findMany({
      where,
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      include: {
        timeSlot: {
          include: {
            event: {
              include: { village: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const reg = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        timeSlot: {
          include: {
            event: {
              include: { village: true },
            },
          },
        },
      },
    });

    if (!reg) throw new NotFoundException(`Registration #${id} not found`);
    return reg;
  }

  async create(dto: CreateRegistrationDto) {
    const date = new Date(dto.date);

    // Validate the time slot exists
    const timeSlot = await this.prisma.timeSlot.findUnique({
      where: { id: dto.timeSlotId },
      include: { event: true },
    });

    if (!timeSlot) throw new NotFoundException(`TimeSlot #${dto.timeSlotId} not found`);

    return this.prisma.$transaction(async (tx) => {
      // Check max 2 events per day per group
      const groupDayCount = await tx.registration.count({
        where: {
          groupName: dto.groupName,
          date,
        },
      });

      if (groupDayCount >= 2) {
        throw new BadRequestException(
          'This group has already registered for 2 events on this day (maximum reached)',
        );
      }

      // Attempt insert — unique constraint on (timeSlotId, date) is the hard safety net
      try {
        return await tx.registration.create({
          data: {
            groupName: dto.groupName,
            participantCount: dto.participantCount,
            date,
            timeSlotId: dto.timeSlotId,
          },
          include: {
            timeSlot: {
              include: {
                event: {
                  include: { village: { select: { id: true, name: true } } },
                },
              },
            },
          },
        });
      } catch (e) {
        if (e.code === 'P2002') {
          throw new ConflictException(
            'Slot already taken — another group has just registered for this time slot',
          );
        }
        throw e;
      }
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.registration.delete({ where: { id } });
  }

  async exportCsv(filters?: { date?: string; villageId?: number }): Promise<string> {
    const registrations = await this.findAll(filters);

    const headers = [
      'ID',
      'Group Name',
      'Participants',
      'Date',
      'Time',
      'Event',
      'Village',
      'Registered At',
    ];

    const rows = registrations.map((r) => [
      r.id,
      `"${r.groupName.replace(/"/g, '""')}"`,
      r.participantCount,
      r.date.toISOString().split('T')[0],
      r.timeSlot.time,
      `"${r.timeSlot.event.name.replace(/"/g, '""')}"`,
      `"${r.timeSlot.event.village.name.replace(/"/g, '""')}"`,
      r.createdAt.toISOString(),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  async getCalendar(date: string) {
    const targetDate = new Date(date);

    const registrations = await this.prisma.registration.findMany({
      where: { date: targetDate },
      include: {
        timeSlot: {
          include: {
            event: {
              include: { village: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    const allSlots = await this.prisma.timeSlot.findMany({
      include: {
        event: {
          include: { village: { select: { id: true, name: true } } },
        },
      },
    });

    const registrationMap = new Map(
      registrations.map((r) => [r.timeSlotId, r]),
    );

    return allSlots.map((slot) => ({
      slotId: slot.id,
      time: slot.time,
      event: slot.event.name,
      village: slot.event.village.name,
      villageId: slot.event.villageId,
      eventId: slot.eventId,
      available: !registrationMap.has(slot.id),
      registration: registrationMap.get(slot.id) ?? null,
    }));
  }
}
