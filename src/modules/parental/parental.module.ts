import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentalController } from './parental.controller';
import { ParentalService } from './parental.service';
import { ParentalControl } from './entities/parental-control.entity';
import { DailyUsageSummary } from './entities/daily-usage-summary.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { ChildProfile } from '../children-profiles/entities/child-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParentalControl,
      DailyUsageSummary,
      ActivityLog,
      ChildProfile,
    ]),
  ],
  controllers: [ParentalController],
  providers: [ParentalService],
  exports: [ParentalService],
})
export class ParentalModule {}
