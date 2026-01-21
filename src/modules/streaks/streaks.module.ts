import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Streak } from './entities/streak.entity';
import { StreaksService } from './streaks.service';
import { StreaksController } from './streaks.controller';
import { StreaksAdminController } from './streaks-admin.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [TypeOrmModule.forFeature([Streak]), EventsModule],
  controllers: [StreaksController, StreaksAdminController],
  providers: [StreaksService],
  exports: [StreaksService],
})
export class StreaksModule {}
