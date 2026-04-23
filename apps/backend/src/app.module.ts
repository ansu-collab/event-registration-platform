import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { VillagesModule } from './villages/villages.module';
import { EventsModule } from './events/events.module';
import { TimeSlotsModule } from './time-slots/time-slots.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    VillagesModule,
    EventsModule,
    TimeSlotsModule,
    RegistrationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
