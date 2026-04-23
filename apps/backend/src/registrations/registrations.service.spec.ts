import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  timeSlot: {
    findUnique: jest.fn(),
  },
  registration: {
    count: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('RegistrationsService', () => {
  let service: RegistrationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RegistrationsService>(RegistrationsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = {
      groupName: 'Team Alpha',
      participantCount: 10,
      date: '2026-07-01',
      timeSlotId: 1,
    };

    const mockTimeSlot = {
      id: 1,
      time: '09:00',
      eventId: 1,
      event: { id: 1, name: 'Morning Workshop', villageId: 1 },
    };

    const mockRegistration = {
      id: 1,
      ...dto,
      date: new Date('2026-07-01'),
      timeSlot: {
        ...mockTimeSlot,
        event: { ...mockTimeSlot.event, village: { id: 1, name: 'Sunrise Village' } },
      },
    };

    it('creates a registration successfully', async () => {
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(mockTimeSlot);
      mockPrismaService.$transaction.mockImplementation(async (fn) => {
        mockPrismaService.registration.count.mockResolvedValue(0);
        mockPrismaService.registration.create.mockResolvedValue(mockRegistration);
        return fn(mockPrismaService);
      });

      const result = await service.create(dto);
      expect(result).toEqual(mockRegistration);
      expect(mockPrismaService.registration.count).toHaveBeenCalledWith({
        where: { groupName: dto.groupName, date: new Date(dto.date) },
      });
    });

    it('throws NotFoundException when time slot does not exist', async () => {
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when group has 2 registrations on same day', async () => {
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(mockTimeSlot);
      mockPrismaService.$transaction.mockImplementation(async (fn) => {
        mockPrismaService.registration.count.mockResolvedValue(2);
        return fn(mockPrismaService);
      });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException on unique constraint violation (double booking)', async () => {
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(mockTimeSlot);
      mockPrismaService.$transaction.mockImplementation(async (fn) => {
        mockPrismaService.registration.count.mockResolvedValue(0);
        mockPrismaService.registration.create.mockRejectedValue({ code: 'P2002' });
        return fn(mockPrismaService);
      });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('allows group to register for 2nd event on same day', async () => {
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(mockTimeSlot);
      mockPrismaService.$transaction.mockImplementation(async (fn) => {
        mockPrismaService.registration.count.mockResolvedValue(1);
        mockPrismaService.registration.create.mockResolvedValue(mockRegistration);
        return fn(mockPrismaService);
      });

      const result = await service.create(dto);
      expect(result).toEqual(mockRegistration);
    });
  });

  describe('findAll', () => {
    it('returns all registrations', async () => {
      mockPrismaService.registration.findMany.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });

    it('filters by date', async () => {
      mockPrismaService.registration.findMany.mockResolvedValue([]);
      await service.findAll({ date: '2026-07-01' });
      expect(mockPrismaService.registration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ date: new Date('2026-07-01') }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('removes a registration', async () => {
      const mockReg = { id: 1, groupName: 'Team Alpha' };
      mockPrismaService.registration.findUnique.mockResolvedValue(mockReg);
      mockPrismaService.registration.delete.mockResolvedValue(mockReg);

      const result = await service.remove(1);
      expect(result).toEqual(mockReg);
    });

    it('throws NotFoundException when registration does not exist', async () => {
      mockPrismaService.registration.findUnique.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
