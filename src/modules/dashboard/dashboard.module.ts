import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { User } from '../auth/entities/user.entity';
import { Subscription } from '../payments/entities/subscription.entity';
import { Streak } from '../streaks/entities/streak.entity';
import { Event } from '../events/entities/event.entity';
import { ChildProfile } from '../children-profiles/entities/child-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Subscription, Streak, Event, ChildProfile]),
  ],
  controllers: [DashboardController],
})
export class DashboardModule {}
