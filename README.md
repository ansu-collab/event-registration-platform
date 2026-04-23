# Event Registration Platform

A production-ready event registration system for multi-village events. Handles ~2000 participants with concurrency-safe booking.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 · React · TypeScript · Tailwind CSS · React Query |
| Backend | NestJS · TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (admin only) |

## Features

- **Public**: 6-step registration flow (day → village → event → time slot → form → confirmation)
- **Admin**: Full CRUD for villages, events, time slots; registrations table with CSV export; calendar occupancy view
- **Concurrency safety**: Unique DB constraint on `(timeSlotId, date)` + Prisma transactions prevent double booking
- **Business rules**: Max 2 event registrations per group per day

---

## Quick Start (Docker)

```bash
# 1. Clone & configure
cp .env.example .env
# Edit EVENT_START_DATE, JWT_SECRET as needed

# 2. Start everything
docker-compose up -d

# 3. Run migrations and seed
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run db:seed
```

Visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Admin: http://localhost:3000/admin (username: `admin`, password: `admin123`)

---

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm 9+

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp apps/backend/.env.example apps/backend/.env
cp .env.example .env
# Edit DATABASE_URL in apps/backend/.env

# 3. Run migrations
cd apps/backend
npx prisma migrate dev --name init

# 4. Seed database
npm run db:seed

# 5. Start backend (terminal 1)
npm run backend:dev

# 6. Start frontend (terminal 2)
npm run frontend:dev
```

### Environment Variables

**Backend** (`apps/backend/.env`):

```env
DATABASE_URL=postgresql://reguser:regpassword@localhost:5432/registration_platform
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
PORT=3001
EVENT_START_DATE=2026-07-01
```

**Frontend** (`.env.local` in `apps/frontend/`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_EVENT_START_DATE=2026-07-01
NEXT_PUBLIC_EVENT_DAYS=7
```

---

## Database

### Schema overview

```
Village ──< Event ──< TimeSlot ──< Registration
                                   (unique: timeSlotId + date)
AdminUser
```

### Key constraint (double-booking prevention)

```sql
UNIQUE (time_slot_id, date)  -- on Registration table
```

If two concurrent requests attempt to book the same slot on the same date, exactly one succeeds and the other receives a `409 Conflict` with the message "Slot already taken".

### Seed data

The seed script creates:
- 1 admin user (`admin` / `admin123`)
- 10 villages
- 4 events per village (40 total)
- 2 time slots per event — `09:00` and `13:00` (80 total)

```bash
# From project root
npm run db:seed

# Or from backend directory
cd apps/backend && npm run db:seed
```

### Prisma Studio (DB GUI)

```bash
cd apps/backend && npx prisma studio
```

---

## API Reference

### Public endpoints (no auth)

| Method | Path | Description |
|---|---|---|
| GET | `/api/villages` | List all villages |
| GET | `/api/events?villageId=X` | Events for a village |
| GET | `/api/time-slots?eventId=X&date=YYYY-MM-DD` | Slots with availability |
| POST | `/api/registrations` | Create registration |
| POST | `/api/auth/login` | Admin login |

### Admin endpoints (JWT required)

| Method | Path | Description |
|---|---|---|
| POST | `/api/villages` | Create village |
| PUT | `/api/villages/:id` | Update village |
| DELETE | `/api/villages/:id` | Delete village |
| POST | `/api/events` | Create event |
| PUT/DELETE | `/api/events/:id` | Update/delete event |
| POST | `/api/time-slots` | Create time slot |
| PUT/DELETE | `/api/time-slots/:id` | Update/delete slot |
| GET | `/api/registrations` | All registrations (filterable) |
| GET | `/api/registrations/calendar?date=` | Occupancy calendar |
| GET | `/api/registrations/export/csv` | CSV export |
| DELETE | `/api/registrations/:id` | Delete registration |

### Registration payload

```json
{
  "groupName": "Team Alpha",
  "participantCount": 10,
  "date": "2026-07-01",
  "timeSlotId": 1
}
```

---

## Running Tests

```bash
# Unit tests
npm run test

# Unit tests with coverage
cd apps/backend && npm run test:cov

# E2E tests (requires a running PostgreSQL)
cd apps/backend && npm run test:e2e
```

### What's tested

**Unit tests:**
- `VillagesService` — CRUD operations, conflict handling, not-found errors
- `RegistrationsService` — successful booking, double-booking prevention, max-2-per-day rule, concurrent race condition

**E2E tests (`test/registrations.e2e-spec.ts`):**
- Full registration flow against a real database
- Concurrent booking — fires 5 simultaneous requests for the same slot; asserts exactly 1 succeeds

---

## Project Structure

```
Registration_platform/
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # DB schema
│   │   │   └── seed.ts              # Seed script
│   │   ├── src/
│   │   │   ├── auth/                # JWT auth
│   │   │   ├── villages/            # Villages CRUD
│   │   │   ├── events/              # Events CRUD
│   │   │   ├── time-slots/          # Time slots CRUD
│   │   │   ├── registrations/       # Booking logic
│   │   │   └── prisma/              # PrismaService
│   │   └── test/                    # E2E tests
│   └── frontend/
│       ├── app/
│       │   ├── register/            # Public registration flow
│       │   └── admin/               # Admin panel
│       ├── components/admin/        # Admin UI components
│       └── lib/                     # API client, types, utils
├── docker-compose.yml
└── .env.example
```

---

## Concurrency Safety

The system uses a two-layer approach:

1. **Transaction check** — inside a Prisma `$transaction`, we count how many registrations the group already has on that day (max 2 rule) before inserting.

2. **Database unique constraint** — `@@unique([timeSlotId, date])` on the `Registration` model is the hard safety net. Even if two transactions pass the count check simultaneously, PostgreSQL will allow exactly one `INSERT` and reject the other with a unique constraint violation (`P2002`), which the service layer catches and converts to `409 Conflict`.

This approach is correct under high concurrency without needing serializable isolation or advisory locks.
