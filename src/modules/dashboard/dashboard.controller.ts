import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Between } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, User } from '../auth/entities/user.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../payments/entities/subscription.entity';
import { Streak } from '../streaks/entities/streak.entity';
import { Event } from '../events/entities/event.entity';
import { ChildProfile } from '../children-profiles/entities/child-profile.entity';

@ApiTags('Admin - Dashboard')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class DashboardController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Streak)
    private readonly streakRepository: Repository<Streak>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(ChildProfile)
    private readonly childProfileRepository: Repository<ChildProfile>,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadisticas consolidadas del dashboard' })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Periodo en dias (default: 7)',
  })
  @ApiResponse({ status: 200, description: 'Estadisticas del dashboard' })
  async getStats(@Query('days') days?: number) {
    const periodDays = days || 7;
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const periodStart = new Date(todayStart);
    periodStart.setDate(periodStart.getDate() - periodDays);

    // Format today as YYYY-MM-DD for date column comparisons
    const todayStr = todayStart.toISOString().split('T')[0];

    // Execute all queries in parallel
    const [
      // Users
      totalUsers,
      usersToday,
      usersPeriod,
      activeUsers,
      recentUsers,

      // Subscriptions
      totalSubscriptions,
      activeSubscriptions,
      trialSubscriptions,
      cancelledPeriod,
      recentSubscriptions,

      // Child Profiles (Letrito)
      totalChildProfiles,
      childProfilesToday,
      activeChildProfiles,

      // Streaks
      totalStreaks,
      activeStreaksToday,
      avgStreak,

      // Events
      eventsToday,
      eventsPeriod,
      timeline,
    ] = await Promise.all([
      // Users queries
      this.userRepository.count(),
      this.userRepository.count({
        where: { createdAt: MoreThanOrEqual(todayStart) },
      }),
      this.userRepository.count({
        where: { createdAt: MoreThanOrEqual(periodStart) },
      }),
      this.userRepository.count({ where: { isActive: true } }),
      this.userRepository.find({
        select: ['id', 'firstName', 'lastName', 'email', 'createdAt'],
        order: { createdAt: 'DESC' },
        take: 5,
      }),

      // Subscriptions queries
      this.subscriptionRepository.count(),
      this.subscriptionRepository.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      this.subscriptionRepository.count({
        where: { status: SubscriptionStatus.PENDING_PAYMENT },
      }),
      this.subscriptionRepository.count({
        where: {
          status: SubscriptionStatus.CANCELLED,
          cancelledAt: MoreThanOrEqual(periodStart),
        },
      }),
      this.subscriptionRepository
        .createQueryBuilder('sub')
        .leftJoin('sub.user', 'user')
        .select([
          'sub.id',
          'sub.planType',
          'sub.status',
          'sub.createdAt',
          'user.firstName',
          'user.lastName',
          'user.email',
        ])
        .orderBy('sub.createdAt', 'DESC')
        .take(5)
        .getMany(),

      // Child Profiles queries (Letrito)
      this.childProfileRepository.count(),
      this.childProfileRepository.count({
        where: { createdAt: MoreThanOrEqual(todayStart) },
      }),
      this.childProfileRepository.count({ where: { isActive: true } }),

      // Streaks queries
      this.streakRepository.count(),
      this.streakRepository.count({ where: { lastActiveDate: todayStr } }),
      this.streakRepository
        .createQueryBuilder('streak')
        .select('AVG(streak.currentStreak)', 'avg')
        .getRawOne(),

      // Events queries
      this.eventRepository.count({
        where: { createdAt: MoreThanOrEqual(todayStart) },
      }),
      this.eventRepository.count({
        where: { createdAt: MoreThanOrEqual(periodStart) },
      }),
      this.getTimeline(periodDays),
    ]);

    return {
      users: {
        total: totalUsers,
        today: usersToday,
        period: usersPeriod,
        active: activeUsers,
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        trial: trialSubscriptions,
        cancelledPeriod: cancelledPeriod,
      },
      childProfiles: {
        total: totalChildProfiles,
        today: childProfilesToday,
        active: activeChildProfiles,
      },
      streaks: {
        total: totalStreaks,
        activeToday: activeStreaksToday,
        average: Math.round(parseFloat(avgStreak?.avg || '0')),
      },
      events: {
        today: eventsToday,
        period: eventsPeriod,
      },
      periodDays,
      timeline,
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        createdAt: u.createdAt,
      })),
      recentSubscriptions: recentSubscriptions.map((s) => ({
        id: s.id,
        userName: s.user ? `${s.user.firstName} ${s.user.lastName}` : 'N/A',
        userEmail: s.user?.email || 'N/A',
        planType: s.planType,
        status: s.status,
        createdAt: s.createdAt,
      })),
    };
  }

  private async getTimeline(
    days: number,
  ): Promise<{ date: string; count: number }[]> {
    const result: { date: string; count: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const startOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const count = await this.eventRepository.count({
        where: {
          createdAt: Between(startOfDay, endOfDay),
        },
      });

      result.push({ date: dateStr, count });
    }

    return result;
  }
}
