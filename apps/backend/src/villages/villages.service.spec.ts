import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { VillagesService } from './villages.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  village: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('VillagesService', () => {
  let service: VillagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VillagesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<VillagesService>(VillagesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns all villages', async () => {
      const villages = [{ id: 1, name: 'Sunrise Village' }];
      mockPrismaService.village.findMany.mockResolvedValue(villages);
      expect(await service.findAll()).toEqual(villages);
    });
  });

  describe('findOne', () => {
    it('returns a village by id', async () => {
      const village = { id: 1, name: 'Sunrise Village', events: [] };
      mockPrismaService.village.findUnique.mockResolvedValue(village);
      expect(await service.findOne(1)).toEqual(village);
    });

    it('throws NotFoundException when village not found', async () => {
      mockPrismaService.village.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a village', async () => {
      const village = { id: 1, name: 'New Village' };
      mockPrismaService.village.create.mockResolvedValue(village);
      expect(await service.create({ name: 'New Village' })).toEqual(village);
    });

    it('throws ConflictException on duplicate name', async () => {
      mockPrismaService.village.create.mockRejectedValue({ code: 'P2002' });
      await expect(service.create({ name: 'Existing Village' })).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('updates a village', async () => {
      const village = { id: 1, name: 'Updated Village', events: [] };
      mockPrismaService.village.findUnique.mockResolvedValue(village);
      mockPrismaService.village.update.mockResolvedValue({ ...village, name: 'Updated Village' });
      const result = await service.update(1, { name: 'Updated Village' });
      expect(result.name).toBe('Updated Village');
    });

    it('throws NotFoundException when village not found', async () => {
      mockPrismaService.village.findUnique.mockResolvedValue(null);
      await expect(service.update(999, { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes a village', async () => {
      const village = { id: 1, name: 'Village', events: [] };
      mockPrismaService.village.findUnique.mockResolvedValue(village);
      mockPrismaService.village.delete.mockResolvedValue(village);
      expect(await service.remove(1)).toEqual(village);
    });
  });
});
