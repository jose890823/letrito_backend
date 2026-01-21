import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Streak } from './entities/streak.entity';
import { User } from '../auth/entities/user.entity';
import {
  StreakResponseDto,
  StreakCheckInResponseDto,
} from './dto/streak-response.dto';
import { EventsService } from '../events/events.service';
import { EventType } from '../events/entities/event.entity';

// Definicion de logros por dias
const ACHIEVEMENTS = [
  { days: 3, key: '3_days', name: '3 dias seguidos' },
  { days: 7, key: '7_days', name: 'Una semana' },
  { days: 14, key: '14_days', name: 'Dos semanas' },
  { days: 21, key: '21_days', name: 'Tres semanas' },
  { days: 30, key: '30_days', name: 'Un mes' },
  { days: 60, key: '60_days', name: 'Dos meses' },
  { days: 90, key: '90_days', name: 'Tres meses' },
  { days: 180, key: '180_days', name: 'Seis meses' },
  { days: 365, key: '365_days', name: 'Un ano' },
];

@Injectable()
export class StreaksService {
  private readonly logger = new Logger(StreaksService.name);

  constructor(
    @InjectRepository(Streak)
    private readonly streakRepository: Repository<Streak>,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Obtener o crear el streak de un usuario
   */
  async getOrCreateStreak(userId: string): Promise<Streak> {
    let streak = await this.streakRepository.findOne({
      where: { userId },
    });

    if (!streak) {
      streak = this.streakRepository.create({ userId });
      await this.streakRepository.save(streak);
      this.logger.log(`Streak creado para usuario ${userId}`);
    }

    return streak;
  }

  /**
   * Obtener estadisticas de streak del usuario
   */
  async getStreakStats(user: User): Promise<StreakResponseDto> {
    const streak = await this.getOrCreateStreak(user.id);
    const today = this.getTodayDate(user.timezone ?? undefined);
    const isActiveToday = streak.lastActiveDate === today;

    // Verificar si la racha esta rota (mas de 1 dia sin actividad)
    const effectiveStreak = this.calculateEffectiveStreak(streak, today);

    return {
      currentStreak: effectiveStreak,
      longestStreak: streak.longestStreak,
      lastActiveDate: streak.lastActiveDate,
      totalDaysActive: streak.totalDaysActive,
      isActiveToday,
      achievements: this.getUnlockedAchievements(streak.longestStreak),
    };
  }

  /**
   * Registrar actividad del dia (check-in)
   */
  async checkIn(user: User): Promise<StreakCheckInResponseDto> {
    const streak = await this.getOrCreateStreak(user.id);
    const today = this.getTodayDate(user.timezone ?? undefined);

    // Si ya hizo check-in hoy, retornar estado actual
    if (streak.lastActiveDate === today) {
      return {
        eventType: 'already_checked_in',
        newStreak: streak.currentStreak,
        streakBroken: false,
        message: 'Ya registraste tu actividad hoy. Sigue asi!',
      };
    }

    const yesterday = this.getYesterdayDate(user.timezone ?? undefined);
    let streakBroken = false;
    let newAchievement: string | undefined;
    let previousStreak = streak.currentStreak;

    // Determinar si la racha continua o se rompio
    if (streak.lastActiveDate === yesterday) {
      // Racha continua
      streak.currentStreak += 1;
    } else if (streak.lastActiveDate === null) {
      // Primera actividad
      streak.currentStreak = 1;
      streak.streakStartDate = today;
    } else {
      // Racha rota
      streakBroken = true;
      previousStreak = streak.currentStreak;
      streak.currentStreak = 1;
      streak.streakStartDate = today;
    }

    // Actualizar racha mas larga si corresponde
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    // Verificar nuevos logros
    const oldAchievements = this.getUnlockedAchievements(
      streakBroken ? previousStreak : streak.currentStreak - 1,
    );
    const newAchievements = this.getUnlockedAchievements(streak.currentStreak);

    if (newAchievements.length > oldAchievements.length) {
      newAchievement = newAchievements[newAchievements.length - 1];
    }

    // Actualizar campos
    streak.lastActiveDate = today;
    streak.totalDaysActive += 1;

    await this.streakRepository.save(streak);
    this.logger.log(
      `Check-in registrado para usuario ${user.id} - Racha: ${streak.currentStreak}`,
    );

    // Registrar eventos para el dashboard
    if (streakBroken) {
      await this.eventsService.track(user.id, EventType.STREAK_BROKEN, {
        previousStreak: previousStreak,
        newStreak: streak.currentStreak,
      });
    }

    await this.eventsService.track(user.id, EventType.STREAK_CHECK_IN, {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
    });

    if (newAchievement) {
      await this.eventsService.track(user.id, EventType.STREAK_MILESTONE, {
        achievement: newAchievement,
        currentStreak: streak.currentStreak,
      });
    }

    return {
      eventType: streakBroken ? 'streak_broken' : 'check_in',
      newStreak: streak.currentStreak,
      streakBroken,
      newAchievement,
      message: this.getMotivationalMessage(
        streak.currentStreak,
        streakBroken,
        newAchievement,
      ),
    };
  }

  /**
   * Calcular racha efectiva considerando si paso mas de 1 dia
   */
  private calculateEffectiveStreak(streak: Streak, today: string): number {
    if (!streak.lastActiveDate) {
      return 0;
    }

    if (streak.lastActiveDate === today) {
      return streak.currentStreak;
    }

    const yesterday = this.getYesterdayFromDate(today);
    if (streak.lastActiveDate === yesterday) {
      return streak.currentStreak;
    }

    // Mas de 1 dia sin actividad - racha rota
    return 0;
  }

  /**
   * Obtener logros desbloqueados segun dias
   */
  private getUnlockedAchievements(days: number): string[] {
    return ACHIEVEMENTS.filter((a) => days >= a.days).map((a) => a.key);
  }

  /**
   * Generar mensaje motivacional
   */
  private getMotivationalMessage(
    streak: number,
    broken: boolean,
    newAchievement?: string,
  ): string {
    if (broken) {
      return 'No pasa nada, hoy empezamos de nuevo. Una racha se construye un dia a la vez.';
    }

    if (newAchievement) {
      const achievement = ACHIEVEMENTS.find((a) => a.key === newAchievement);
      return `Increible! Desbloqueaste: ${achievement?.name}. Sigue asi!`;
    }

    if (streak === 1) {
      return 'Primer dia! El inicio de algo grande.';
    }

    if (streak < 7) {
      return `Llevas ${streak} dias seguidos. Vas muy bien!`;
    }

    if (streak < 30) {
      return `${streak} dias! Tu constancia es admirable.`;
    }

    return `Wow, ${streak} dias! Eres imparable.`;
  }

  /**
   * Obtener fecha de hoy en formato YYYY-MM-DD
   */
  private getTodayDate(timezone?: string): string {
    const now = new Date();
    const tz = timezone || 'America/Mexico_City';

    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(now);
    } catch {
      return now.toISOString().split('T')[0];
    }
  }

  /**
   * Obtener fecha de ayer en formato YYYY-MM-DD
   */
  private getYesterdayDate(timezone?: string): string {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const tz = timezone || 'America/Mexico_City';

    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(date);
    } catch {
      return date.toISOString().split('T')[0];
    }
  }

  /**
   * Obtener fecha de ayer a partir de una fecha dada
   */
  private getYesterdayFromDate(dateStr: string): string {
    const date = new Date(dateStr + 'T12:00:00Z');
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  }

  // ==================== ADMIN METHODS ====================

  /**
   * Obtener todos los streaks con filtros (Admin)
   */
  async findAllAdmin(filters: {
    page: number;
    limit: number;
    minStreak?: number;
    sortBy?:
      | 'currentStreak'
      | 'longestStreak'
      | 'totalDaysActive'
      | 'lastActiveDate';
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const {
      page,
      limit,
      minStreak,
      sortBy = 'currentStreak',
      sortOrder = 'DESC',
    } = filters;
    const skip = (page - 1) * limit;

    const queryBuilder = this.streakRepository
      .createQueryBuilder('streak')
      .leftJoinAndSelect('streak.user', 'user');

    if (minStreak !== undefined) {
      queryBuilder.andWhere('streak.currentStreak >= :minStreak', {
        minStreak,
      });
    }

    queryBuilder.orderBy(`streak.${sortBy}`, sortOrder).skip(skip).take(limit);

    const [streaks, total] = await queryBuilder.getManyAndCount();

    return {
      data: streaks.map((s) => ({
        id: s.id,
        userId: s.userId,
        userName: s.user ? `${s.user.firstName} ${s.user.lastName}` : 'Usuario',
        userEmail: s.user?.email || '',
        currentStreak: s.currentStreak,
        longestStreak: s.longestStreak,
        lastActiveDate: s.lastActiveDate,
        streakStartDate: s.streakStartDate,
        totalDaysActive: s.totalDaysActive,
        achievements: this.getUnlockedAchievements(s.longestStreak),
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener estadísticas de streaks (Admin)
   */
  async getAdminStats() {
    const today = this.getTodayDate();
    const yesterday = this.getYesterdayDate();

    // Total de usuarios con streak
    const totalUsers = await this.streakRepository.count();

    // Usuarios activos hoy
    const activeToday = await this.streakRepository.count({
      where: { lastActiveDate: today },
    });

    // Usuarios activos ayer
    const activeYesterday = await this.streakRepository.count({
      where: { lastActiveDate: yesterday },
    });

    // Promedio de racha actual
    const avgResult = await this.streakRepository
      .createQueryBuilder('streak')
      .select('AVG(streak.currentStreak)', 'avg')
      .addSelect('AVG(streak.longestStreak)', 'avgLongest')
      .addSelect('MAX(streak.currentStreak)', 'maxCurrent')
      .addSelect('MAX(streak.longestStreak)', 'maxLongest')
      .addSelect('SUM(streak.totalDaysActive)', 'totalActivity')
      .getRawOne();

    // Distribución por logros
    const achievementDistribution = await Promise.all(
      ACHIEVEMENTS.map(async (achievement) => {
        const count = await this.streakRepository.count({
          where: { longestStreak: MoreThanOrEqual(achievement.days) },
        });
        return {
          key: achievement.key,
          name: achievement.name,
          days: achievement.days,
          usersUnlocked: count,
        };
      }),
    );

    // Distribución por rango de racha actual
    const streakRanges = [
      { label: '0 días', min: 0, max: 0 },
      { label: '1-3 días', min: 1, max: 3 },
      { label: '4-7 días', min: 4, max: 7 },
      { label: '8-14 días', min: 8, max: 14 },
      { label: '15-30 días', min: 15, max: 30 },
      { label: '31+ días', min: 31, max: 999999 },
    ];

    const streakDistribution = await Promise.all(
      streakRanges.map(async (range) => {
        const count = await this.streakRepository
          .createQueryBuilder('streak')
          .where(
            'streak.currentStreak >= :min AND streak.currentStreak <= :max',
            {
              min: range.min,
              max: range.max,
            },
          )
          .getCount();
        return {
          label: range.label,
          count,
        };
      }),
    );

    return {
      totalUsers,
      activeToday,
      activeYesterday,
      averageCurrentStreak: Number(avgResult?.avg || 0).toFixed(1),
      averageLongestStreak: Number(avgResult?.avgLongest || 0).toFixed(1),
      maxCurrentStreak: Number(avgResult?.maxCurrent || 0),
      maxLongestStreak: Number(avgResult?.maxLongest || 0),
      totalActivityDays: Number(avgResult?.totalActivity || 0),
      achievementDistribution,
      streakDistribution,
    };
  }

  /**
   * Obtener leaderboard de streaks (Admin)
   */
  async getLeaderboard(limit: number = 10) {
    const streaks = await this.streakRepository.find({
      relations: ['user'],
      order: { currentStreak: 'DESC' },
      take: limit,
    });

    return streaks.map((s, index) => ({
      rank: index + 1,
      id: s.id,
      userId: s.userId,
      userName: s.user ? `${s.user.firstName} ${s.user.lastName}` : 'Usuario',
      userEmail: s.user?.email || '',
      currentStreak: s.currentStreak,
      longestStreak: s.longestStreak,
      totalDaysActive: s.totalDaysActive,
      lastActiveDate: s.lastActiveDate,
    }));
  }

  /**
   * Obtener un streak por ID (Admin)
   */
  async findByIdAdmin(id: string) {
    const streak = await this.streakRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!streak) {
      throw new NotFoundException('Streak no encontrado');
    }

    return {
      id: streak.id,
      userId: streak.userId,
      userName: streak.user
        ? `${streak.user.firstName} ${streak.user.lastName}`
        : 'Usuario',
      userEmail: streak.user?.email || '',
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActiveDate: streak.lastActiveDate,
      streakStartDate: streak.streakStartDate,
      totalDaysActive: streak.totalDaysActive,
      achievements: this.getUnlockedAchievements(streak.longestStreak),
      nextAchievement: this.getNextAchievement(streak.currentStreak),
      createdAt: streak.createdAt,
      updatedAt: streak.updatedAt,
    };
  }

  /**
   * Obtener el próximo logro a desbloquear
   */
  private getNextAchievement(currentStreak: number) {
    const next = ACHIEVEMENTS.find((a) => a.days > currentStreak);
    if (!next) return null;
    return {
      key: next.key,
      name: next.name,
      daysRequired: next.days,
      daysRemaining: next.days - currentStreak,
    };
  }

  /**
   * Resetear racha de un usuario (Admin)
   */
  async resetStreakAdmin(id: string) {
    const streak = await this.streakRepository.findOne({
      where: { id },
    });

    if (!streak) {
      throw new NotFoundException('Streak no encontrado');
    }

    streak.currentStreak = 0;
    streak.streakStartDate = null;
    // No tocamos longestStreak ni totalDaysActive

    await this.streakRepository.save(streak);
    this.logger.log(`Streak ${id} reseteado por admin`);

    return { message: 'Racha reseteada correctamente' };
  }

  /**
   * Ajustar racha manualmente (Admin)
   */
  async adjustStreakAdmin(
    id: string,
    data: { currentStreak?: number; longestStreak?: number },
  ) {
    const streak = await this.streakRepository.findOne({
      where: { id },
    });

    if (!streak) {
      throw new NotFoundException('Streak no encontrado');
    }

    if (data.currentStreak !== undefined) {
      streak.currentStreak = data.currentStreak;
    }

    if (data.longestStreak !== undefined) {
      streak.longestStreak = data.longestStreak;
    }

    // Asegurar que longestStreak >= currentStreak
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    await this.streakRepository.save(streak);
    this.logger.log(
      `Streak ${id} ajustado por admin: current=${streak.currentStreak}, longest=${streak.longestStreak}`,
    );

    return { message: 'Racha ajustada correctamente', streak };
  }

  /**
   * Eliminar registro de streak (Admin)
   */
  async removeAdmin(id: string) {
    const streak = await this.streakRepository.findOne({
      where: { id },
    });

    if (!streak) {
      throw new NotFoundException('Streak no encontrado');
    }

    await this.streakRepository.remove(streak);
    this.logger.log(`Streak ${id} eliminado por admin`);

    return { message: 'Streak eliminado correctamente' };
  }
}
