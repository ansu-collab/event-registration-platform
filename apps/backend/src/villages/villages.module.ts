import { Module } from '@nestjs/common';
import { VillagesService } from './villages.service';
import { VillagesController } from './villages.controller';

@Module({
  controllers: [VillagesController],
  providers: [VillagesService],
  exports: [VillagesService],
})
export class VillagesModule {}
