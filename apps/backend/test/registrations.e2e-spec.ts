import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Registrations (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let villageId: number;
  let eventId: number;
  let timeSlotId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Clean up test data
    await prisma.registration.deleteMany({});
    await prisma.timeSlot.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.village.deleteMany({});

    // Get admin token
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    adminToken = loginRes.body.accessToken;

    // Seed test data
    const villageRes = await request(app.getHttpServer())
      .post('/api/villages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Village' });
    villageId = villageRes.body.id;

    const eventRes = await request(app.getHttpServer())
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Event', villageId });
    eventId = eventRes.body.id;

    const slotRes = await request(app.getHttpServer())
      .post('/api/time-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ time: '09:00', eventId });
    timeSlotId = slotRes.body.id;
  });

  afterAll(async () => {
    await prisma.registration.deleteMany({});
    await prisma.timeSlot.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.village.deleteMany({});
    await app.close();
  });

  describe('POST /api/registrations', () => {
    const testDate = '2026-07-01';

    afterEach(async () => {
      await prisma.registration.deleteMany({ where: { date: new Date(testDate) } });
    });

    it('creates a registration', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/registrations')
        .send({
          groupName: 'Test Group',
          participantCount: 10,
          date: testDate,
          timeSlotId,
        });

      expect(res.status).toBe(201);
      expect(res.body.groupName).toBe('Test Group');
      expect(res.body.participantCount).toBe(10);
    });

    it('prevents double booking (409 Conflict)', async () => {
      await request(app.getHttpServer())
        .post('/api/registrations')
        .send({ groupName: 'Group A', participantCount: 5, date: testDate, timeSlotId });

      const res = await request(app.getHttpServer())
        .post('/api/registrations')
        .send({ groupName: 'Group B', participantCount: 5, date: testDate, timeSlotId });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/Slot already taken/);
    });

    it('prevents group from registering more than 2 events per day', async () => {
      // Create two more time slots for the same test
      const slot2Res = await request(app.getHttpServer())
        .post('/api/time-slots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ time: '13:00', eventId });
      const slot2Id = slot2Res.body.id;

      const eventRes2 = await request(app.getHttpServer())
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Event 2', villageId });
      const eventId2 = eventRes2.body.id;

      const slot3Res = await request(app.getHttpServer())
        .post('/api/time-slots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ time: '09:00', eventId: eventId2 });
      const slot3Id = slot3Res.body.id;

      // First registration — OK
      await request(app.getHttpServer())
        .post('/api/registrations')
        .send({ groupName: 'Busy Group', participantCount: 5, date: testDate, timeSlotId });

      // Second registration — OK
      await request(app.getHttpServer())
        .post('/api/registrations')
        .send({ groupName: 'Busy Group', participantCount: 5, date: testDate, timeSlotId: slot2Id });

      // Third registration — should fail
      const res = await request(app.getHttpServer())
        .post('/api/registrations')
        .send({ groupName: 'Busy Group', participantCount: 5, date: testDate, timeSlotId: slot3Id });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/maximum reached/);

      // Cleanup
      await prisma.timeSlot.deleteMany({ where: { id: { in: [slot2Id, slot3Id] } } });
      await prisma.event.delete({ where: { id: eventId2 } });
    });

    it('validates required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/registrations')
        .send({ groupName: 'X' }); // missing required fields

      expect(res.status).toBe(400);
    });
  });

  describe('Race condition — concurrent bookings', () => {
    it('only one booking succeeds when two requests race for the same slot', async () => {
      const testDate = '2026-07-15';
      await prisma.registration.deleteMany({ where: { date: new Date(testDate) } });

      const requests = Array.from({ length: 5 }, (_, i) =>
        request(app.getHttpServer())
          .post('/api/registrations')
          .send({
            groupName: `Racing Group ${i}`,
            participantCount: 5,
            date: testDate,
            timeSlotId,
          }),
      );

      const results = await Promise.all(requests);
      const successes = results.filter((r) => r.status === 201);
      const conflicts = results.filter((r) => r.status === 409);

      expect(successes).toHaveLength(1);
      expect(conflicts.length).toBeGreaterThanOrEqual(4);

      await prisma.registration.deleteMany({ where: { date: new Date(testDate) } });
    });
  });

  describe('GET /api/registrations', () => {
    it('requires authentication', async () => {
      const res = await request(app.getHttpServer()).get('/api/registrations');
      expect(res.status).toBe(401);
    });

    it('returns registrations for admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/registrations')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
