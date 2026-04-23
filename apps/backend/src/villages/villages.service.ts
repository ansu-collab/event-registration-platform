import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVillageDto } from './dto/create-village.dto';
import { UpdateVillageDto } from './dto/update-village.dto';

@Injectable()
export class VillagesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.village.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { events: true } } },
    });
  }

  async findOne(id: number) {
    const village = await this.prisma.village.findUnique({
      where: { id },
      include: {
        events: {
          include: { timeSlots: true },
        },
      },
    });

    if (!village) throw new NotFoundException(`Village #${id} not found`);
    return village;
  }

  async create(dto: CreateVillageDto) {
    try {
      return await this.prisma.village.create({ data: dto });
    } catch (e) {
      if (e.code === 'P2002') throw new ConflictException('Village name already exists');
      throw e;
    }
  }

  async update(id: number, dto: UpdateVillageDto) {
    await this.findOne(id);
    try {
      return await this.prisma.village.update({ where: { id }, data: dto });
    } catch (e) {
      if (e.code === 'P2002') throw new ConflictException('Village name already exists');
      throw e;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.village.delete({ where: { id } });
  }
}
