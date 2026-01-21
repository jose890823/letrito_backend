import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ParentalControl } from './entities/parental-control.entity';
import { DailyUsageSummary } from './entities/daily-usage-summary.entity';
import {
  ActivityLog,
  ActivityType,
  ActivitySeverity,
} from './entities/activity-log.entity';
import { ChildProfile } from '../children-profiles/entities/child-profile.entity';
import {
  UpdateParentalControlDto,
  ParentalControlResponseDto,
  PinVerificationResponseDto,
  AccessStatusResponseDto,
} from './dto/parental-control.dto';
import {
  GetActivityLogsQueryDto,
  ActivityLogResponseDto,
  ActivityLogListResponseDto,
  ActivityCountsDto,
} from './dto/activity-log.dto';
import {
  GetUsageQueryDto,
  DailyUsageResponseDto,
  WeeklySummaryDto,
  QuickStatsDto,
} from './dto/usage-summary.dto';
import {
  PIN_CONFIG,
  DEFAULT_NOTIFICATION_SETTINGS,
  ACTIVITY_TITLES,
  ACTIVITY_SEVERITIES,
  PARENTAL_PRESETS,
  ALERT_THRESHOLDS,
} from './constants/parental.constants';

@Injectable()
export class ParentalService {
  private readonly logger = new Logger(ParentalService.name);

  constructor(
    @InjectRepository(ParentalControl)
    private readonly parentalControlRepository: Repository<ParentalControl>,
    @InjectRepository(DailyUsageSummary)
    private readonly dailyUsageRepository: Repository<DailyUsageSummary>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(ChildProfile)
    private readonly childProfileRepository: Repository<ChildProfile>,
  ) {}

  // ==================== CONTROL PARENTAL ====================

  /**
   * Obtiene o crea la configuración de control parental para un niño
   */
  async getOrCreateParentalControl(
    childProfileId: string,
  ): Promise<ParentalControl> {
    let control = await this.parentalControlRepository.findOne({
      where: { childProfileId },
    });

    if (!control) {
      // Verificar que el perfil existe
      const profile = await this.childProfileRepository.findOne({
        where: { id: childProfileId },
      });
      if (!profile) {
        throw new NotFoundException('Perfil de niño no encontrado');
      }

      control = this.parentalControlRepository.create({
        childProfileId,
        notifications: DEFAULT_NOTIFICATION_SETTINGS,
        weeklySchedule: [],
      });
      control = await this.parentalControlRepository.save(control);
      this.logger.log(`Control parental creado para niño ${childProfileId}`);
    }

    return control;
  }

  /**
   * Obtiene la configuración de control parental
   */
  async getParentalControl(
    childProfileId: string,
  ): Promise<ParentalControlResponseDto> {
    const control = await this.getOrCreateParentalControl(childProfileId);
    return this.toParentalControlResponse(control);
  }

  /**
   * Actualiza la configuración de control parental
   */
  async updateParentalControl(
    childProfileId: string,
    dto: UpdateParentalControlDto,
  ): Promise<ParentalControlResponseDto> {
    const control = await this.getOrCreateParentalControl(childProfileId);

    // Actualizar campos
    if (dto.dailyTimeLimitMinutes !== undefined) {
      control.dailyTimeLimitMinutes = dto.dailyTimeLimitMinutes;
    }
    if (dto.weeklyTimeLimitMinutes !== undefined) {
      control.weeklyTimeLimitMinutes = dto.weeklyTimeLimitMinutes;
    }
    if (dto.maxSessionDurationMinutes !== undefined) {
      control.maxSessionDurationMinutes = dto.maxSessionDurationMinutes;
    }
    if (dto.breakDurationMinutes !== undefined) {
      control.breakDurationMinutes = dto.breakDurationMinutes;
    }
    if (dto.weeklySchedule !== undefined) {
      control.weeklySchedule = dto.weeklySchedule;
    }
    if (dto.strictScheduleEnforcement !== undefined) {
      control.strictScheduleEnforcement = dto.strictScheduleEnforcement;
    }
    if (dto.notifications !== undefined) {
      control.notifications = {
        ...control.notifications,
        ...dto.notifications,
      };
    }
    if (dto.allowPetInteraction !== undefined) {
      control.allowPetInteraction = dto.allowPetInteraction;
    }
    if (dto.allowProfileChanges !== undefined) {
      control.allowProfileChanges = dto.allowProfileChanges;
    }

    await this.parentalControlRepository.save(control);

    // Registrar el cambio
    await this.logActivity(childProfileId, ActivityType.SETTINGS_CHANGED, {
      changedFields: Object.keys(dto),
    });

    this.logger.log(`Control parental actualizado para niño ${childProfileId}`);
    return this.toParentalControlResponse(control);
  }

  /**
   * Aplica un preset de configuración
   */
  async applyPreset(
    childProfileId: string,
    presetName: keyof typeof PARENTAL_PRESETS,
  ): Promise<ParentalControlResponseDto> {
    const preset = PARENTAL_PRESETS[presetName];
    if (!preset) {
      throw new BadRequestException('Preset no válido');
    }

    const control = await this.getOrCreateParentalControl(childProfileId);

    control.dailyTimeLimitMinutes = preset.dailyTimeLimitMinutes;
    control.weeklyTimeLimitMinutes = preset.weeklyTimeLimitMinutes;
    control.weeklySchedule = preset.weeklySchedule.map((schedule) => ({
      day: schedule.day,
      enabled: schedule.enabled,
      timeRanges: schedule.timeRanges.map((range) => ({
        start: range.start,
        end: range.end,
      })),
    }));
    control.strictScheduleEnforcement = preset.strictScheduleEnforcement;

    await this.parentalControlRepository.save(control);

    this.logger.log(
      `Preset "${presetName}" aplicado para niño ${childProfileId}`,
    );
    return this.toParentalControlResponse(control);
  }

  // ==================== PIN PARENTAL ====================

  /**
   * Configura el PIN parental
   */
  async setPin(childProfileId: string, pin: string): Promise<void> {
    const control = await this.getOrCreateParentalControl(childProfileId);

    const pinHash = await bcrypt.hash(pin, 10);
    control.pinHash = pinHash;
    control.pinEnabled = true;
    control.pinAttempts = 0;
    control.pinLockedUntil = null;

    await this.parentalControlRepository.save(control);

    await this.logActivity(childProfileId, ActivityType.PIN_CHANGED);
    this.logger.log(`PIN configurado para niño ${childProfileId}`);
  }

  /**
   * Elimina el PIN parental
   */
  async removePin(childProfileId: string): Promise<void> {
    const control = await this.getOrCreateParentalControl(childProfileId);

    control.pinHash = null;
    control.pinEnabled = false;
    control.pinAttempts = 0;
    control.pinLockedUntil = null;

    await this.parentalControlRepository.save(control);
    this.logger.log(`PIN eliminado para niño ${childProfileId}`);
  }

  /**
   * Verifica el PIN parental
   */
  async verifyPin(
    childProfileId: string,
    pin: string,
  ): Promise<PinVerificationResponseDto> {
    const control = await this.getOrCreateParentalControl(childProfileId);

    // Verificar si está bloqueado
    if (control.isPinLocked()) {
      const lockedForMinutes = Math.ceil(
        (control.pinLockedUntil!.getTime() - Date.now()) / 60000,
      );
      return {
        valid: false,
        attemptsRemaining: 0,
        locked: true,
        lockedForMinutes,
      };
    }

    // Si no hay PIN configurado
    if (!control.pinEnabled || !control.pinHash) {
      throw new BadRequestException('No hay PIN configurado');
    }

    const isValid = await bcrypt.compare(pin, control.pinHash);

    if (isValid) {
      // Resetear intentos
      control.pinAttempts = 0;
      await this.parentalControlRepository.save(control);
      return {
        valid: true,
        attemptsRemaining: PIN_CONFIG.MAX_ATTEMPTS,
        locked: false,
        lockedForMinutes: null,
      };
    }

    // PIN incorrecto
    control.pinAttempts += 1;

    await this.logActivity(childProfileId, ActivityType.PIN_FAILED_ATTEMPT, {
      attemptNumber: control.pinAttempts,
    });

    if (control.pinAttempts >= PIN_CONFIG.MAX_ATTEMPTS) {
      // Bloquear
      control.pinLockedUntil = new Date(
        Date.now() + PIN_CONFIG.LOCKOUT_DURATION_MINUTES * 60000,
      );
      await this.parentalControlRepository.save(control);

      await this.logActivity(childProfileId, ActivityType.PIN_LOCKED, {
        lockedForMinutes: PIN_CONFIG.LOCKOUT_DURATION_MINUTES,
      });

      return {
        valid: false,
        attemptsRemaining: 0,
        locked: true,
        lockedForMinutes: PIN_CONFIG.LOCKOUT_DURATION_MINUTES,
      };
    }

    await this.parentalControlRepository.save(control);

    return {
      valid: false,
      attemptsRemaining: PIN_CONFIG.MAX_ATTEMPTS - control.pinAttempts,
      locked: false,
      lockedForMinutes: null,
    };
  }

  // ==================== ESTADO DE ACCESO ====================

  /**
   * Verifica si el niño puede usar la app ahora
   */
  async getAccessStatus(
    childProfileId: string,
  ): Promise<AccessStatusResponseDto> {
    const control = await this.getOrCreateParentalControl(childProfileId);
    const todayUsage = await this.getTodayUsage(childProfileId);
    const weekUsage = await this.getWeekUsage(childProfileId);

    const withinSchedule =
      control.weeklySchedule.length === 0 || control.isWithinSchedule();
    const dailyLimitExceeded = control.isDailyLimitExceeded(
      todayUsage?.totalMinutes ?? 0,
    );
    const weeklyLimitExceeded =
      control.weeklyTimeLimitMinutes !== null &&
      weekUsage >= control.weeklyTimeLimitMinutes;

    let allowed = true;
    let reason: string | null = null;

    if (!withinSchedule && control.strictScheduleEnforcement) {
      allowed = false;
      reason = 'Fuera del horario permitido';
    } else if (dailyLimitExceeded) {
      allowed = false;
      reason = 'Límite diario alcanzado';
    } else if (weeklyLimitExceeded) {
      allowed = false;
      reason = 'Límite semanal alcanzado';
    }

    return {
      allowed,
      reason,
      withinSchedule,
      hasTimeRemaining: !dailyLimitExceeded,
      minutesUsedToday: todayUsage?.totalMinutes ?? 0,
      minutesRemainingToday: control.getRemainingDailyTime(
        todayUsage?.totalMinutes ?? 0,
      ),
      minutesUsedThisWeek: weekUsage,
      minutesRemainingThisWeek:
        control.weeklyTimeLimitMinutes !== null
          ? Math.max(0, control.weeklyTimeLimitMinutes - weekUsage)
          : null,
      nextAllowedTime: !withinSchedule
        ? this.getNextAllowedTime(control)
        : null,
    };
  }

  // ==================== USO DIARIO ====================

  /**
   * Obtiene el resumen de uso de hoy
   */
  async getTodayUsage(
    childProfileId: string,
  ): Promise<DailyUsageSummary | null> {
    const today = this.getDateString(new Date());
    return this.dailyUsageRepository.findOne({
      where: { childProfileId, date: today },
    });
  }

  /**
   * Obtiene los minutos usados esta semana
   */
  async getWeekUsage(childProfileId: string): Promise<number> {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Domingo

    const summaries = await this.dailyUsageRepository.find({
      where: {
        childProfileId,
        date: MoreThanOrEqual(this.getDateString(weekStart)),
      },
    });

    return summaries.reduce((sum, s) => sum + s.totalMinutes, 0);
  }

  /**
   * Registra tiempo de uso
   */
  async recordUsage(
    childProfileId: string,
    minutes: number,
    activityType: 'learning' | 'pet' | 'freePlay' = 'learning',
  ): Promise<DailyUsageSummary> {
    const today = this.getDateString(new Date());
    const currentTime = this.getTimeString(new Date());

    let summary = await this.dailyUsageRepository.findOne({
      where: { childProfileId, date: today },
    });

    const control = await this.getOrCreateParentalControl(childProfileId);

    if (!summary) {
      summary = this.dailyUsageRepository.create({
        childProfileId,
        date: today,
        totalMinutes: 0,
        sessionsCount: 1,
        firstSessionTime: currentTime,
        dailyLimitMinutes: control.dailyTimeLimitMinutes,
      });
    }

    summary.totalMinutes += minutes;
    summary.lastSessionTime = currentTime;

    // Actualizar desglose por actividad
    if (activityType === 'learning') {
      summary.activityBreakdown.learningMinutes += minutes;
    } else if (activityType === 'pet') {
      summary.activityBreakdown.petInteractionMinutes += minutes;
    } else {
      summary.activityBreakdown.freePlayMinutes += minutes;
    }

    // Verificar si se alcanzó el límite
    if (
      control.dailyTimeLimitMinutes &&
      summary.totalMinutes >= control.dailyTimeLimitMinutes &&
      !summary.limitReached
    ) {
      summary.limitReached = true;
      summary.limitReachedAt = currentTime;

      await this.logActivity(childProfileId, ActivityType.DAILY_LIMIT_REACHED, {
        limitMinutes: control.dailyTimeLimitMinutes,
        usedMinutes: summary.totalMinutes,
      });
    }

    // Advertencia al 80%
    if (
      control.dailyTimeLimitMinutes &&
      !summary.limitReached &&
      summary.totalMinutes >=
        control.dailyTimeLimitMinutes *
          (ALERT_THRESHOLDS.DAILY_LIMIT_WARNING_PERCENT / 100)
    ) {
      await this.logActivity(childProfileId, ActivityType.DAILY_LIMIT_WARNING, {
        limitMinutes: control.dailyTimeLimitMinutes,
        usedMinutes: summary.totalMinutes,
        remainingMinutes: control.dailyTimeLimitMinutes - summary.totalMinutes,
      });
    }

    return this.dailyUsageRepository.save(summary);
  }

  /**
   * Registra una sesión de aprendizaje
   */
  async recordLearningSession(
    childProfileId: string,
    data: {
      durationMinutes: number;
      exercisesCompleted: number;
      correctCount: number;
      lettersReviewed?: string[];
      syllablesReviewed?: string[];
      wordsReviewed?: string[];
    },
  ): Promise<void> {
    const today = this.getDateString(new Date());

    let summary = await this.dailyUsageRepository.findOne({
      where: { childProfileId, date: today },
    });

    if (!summary) {
      const control = await this.getOrCreateParentalControl(childProfileId);
      summary = this.dailyUsageRepository.create({
        childProfileId,
        date: today,
        totalMinutes: 0,
        sessionsCount: 0,
        dailyLimitMinutes: control.dailyTimeLimitMinutes,
      });
    }

    summary.sessionsCount += 1;
    summary.totalMinutes += data.durationMinutes;
    summary.activityBreakdown.learningMinutes += data.durationMinutes;

    // Actualizar métricas de aprendizaje
    summary.learningMetrics.exercisesCompleted += data.exercisesCompleted;
    summary.learningMetrics.correctAnswers += data.correctCount;
    summary.learningMetrics.accuracy =
      summary.learningMetrics.exercisesCompleted > 0
        ? summary.learningMetrics.correctAnswers /
          summary.learningMetrics.exercisesCompleted
        : 0;

    if (data.lettersReviewed) {
      summary.learningMetrics.lettersReviewed = [
        ...new Set([
          ...summary.learningMetrics.lettersReviewed,
          ...data.lettersReviewed,
        ]),
      ];
    }
    if (data.syllablesReviewed) {
      summary.learningMetrics.syllablesReviewed = [
        ...new Set([
          ...summary.learningMetrics.syllablesReviewed,
          ...data.syllablesReviewed,
        ]),
      ];
    }
    if (data.wordsReviewed) {
      summary.learningMetrics.wordsReviewed = [
        ...new Set([
          ...summary.learningMetrics.wordsReviewed,
          ...data.wordsReviewed,
        ]),
      ];
    }

    await this.dailyUsageRepository.save(summary);
  }

  /**
   * Registra interacción con mascota
   */
  async recordPetInteraction(
    childProfileId: string,
    interactionType: 'feed' | 'play' | 'pet',
  ): Promise<void> {
    const today = this.getDateString(new Date());

    let summary = await this.dailyUsageRepository.findOne({
      where: { childProfileId, date: today },
    });

    if (!summary) {
      const control = await this.getOrCreateParentalControl(childProfileId);
      summary = this.dailyUsageRepository.create({
        childProfileId,
        date: today,
        totalMinutes: 0,
        sessionsCount: 0,
        dailyLimitMinutes: control.dailyTimeLimitMinutes,
      });
    }

    if (interactionType === 'feed') {
      summary.petFeedCount += 1;
    } else if (interactionType === 'play') {
      summary.petPlayCount += 1;
    } else {
      summary.petPetCount += 1;
    }

    await this.dailyUsageRepository.save(summary);
  }

  /**
   * Obtiene el historial de uso
   */
  async getUsageHistory(
    childProfileId: string,
    query: GetUsageQueryDto,
  ): Promise<DailyUsageResponseDto[]> {
    let startDate: string;
    let endDate: string;

    if (query.lastDays) {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - query.lastDays + 1);
      startDate = this.getDateString(start);
      endDate = this.getDateString(end);
    } else {
      startDate = query.startDate || this.getDateString(new Date());
      endDate = query.endDate || this.getDateString(new Date());
    }

    const summaries = await this.dailyUsageRepository.find({
      where: {
        childProfileId,
        date: Between(startDate, endDate),
      },
      order: { date: 'DESC' },
    });

    return summaries.map((s) => this.toDailyUsageResponse(s));
  }

  /**
   * Obtiene el resumen semanal
   */
  async getWeeklySummary(childProfileId: string): Promise<WeeklySummaryDto> {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6); // Últimos 7 días

    const summaries = await this.dailyUsageRepository.find({
      where: {
        childProfileId,
        date: Between(this.getDateString(weekStart), this.getDateString(today)),
      },
      order: { date: 'ASC' },
    });

    const control = await this.getOrCreateParentalControl(childProfileId);

    const totalMinutes = summaries.reduce((sum, s) => sum + s.totalMinutes, 0);
    const activeDays = summaries.filter((s) => s.totalMinutes > 0).length;
    const totalSessions = summaries.reduce(
      (sum, s) => sum + s.sessionsCount,
      0,
    );

    const mostActive =
      summaries.length > 0
        ? summaries.reduce((max, s) =>
            s.totalMinutes > max.totalMinutes ? s : max,
          )
        : null;

    const learningMetrics = {
      totalExercises: summaries.reduce(
        (sum, s) => sum + s.learningMetrics.exercisesCompleted,
        0,
      ),
      totalCorrect: summaries.reduce(
        (sum, s) => sum + s.learningMetrics.correctAnswers,
        0,
      ),
      averageAccuracy: 0,
      uniqueLettersReviewed: [
        ...new Set(summaries.flatMap((s) => s.learningMetrics.lettersReviewed)),
      ].length,
      uniqueSyllablesReviewed: [
        ...new Set(
          summaries.flatMap((s) => s.learningMetrics.syllablesReviewed),
        ),
      ].length,
      uniqueWordsReviewed: [
        ...new Set(summaries.flatMap((s) => s.learningMetrics.wordsReviewed)),
      ].length,
      newMasteries: summaries.reduce(
        (sum, s) => sum + s.learningMetrics.newMasteries,
        0,
      ),
    };
    learningMetrics.averageAccuracy =
      learningMetrics.totalExercises > 0
        ? learningMetrics.totalCorrect / learningMetrics.totalExercises
        : 0;

    return {
      weekStart: this.getDateString(weekStart),
      weekEnd: this.getDateString(today),
      totalMinutes,
      averageMinutesPerDay: activeDays > 0 ? totalMinutes / activeDays : 0,
      activeDays,
      totalSessions,
      mostActiveDay: mostActive
        ? {
            date: mostActive.date,
            dayName: this.getDayName(mostActive.date),
            minutes: mostActive.totalMinutes,
          }
        : null,
      peakUsageHour: this.calculatePeakHour(summaries),
      learningMetrics,
      petInteractions: {
        totalFeed: summaries.reduce((sum, s) => sum + s.petFeedCount, 0),
        totalPlay: summaries.reduce((sum, s) => sum + s.petPlayCount, 0),
        totalPet: summaries.reduce((sum, s) => sum + s.petPetCount, 0),
      },
      weeklyLimitMinutes: control.weeklyTimeLimitMinutes,
      weeklyLimitReached:
        control.weeklyTimeLimitMinutes !== null &&
        totalMinutes >= control.weeklyTimeLimitMinutes,
      dailyData: summaries.map((s) => this.toDailyUsageResponse(s)),
    };
  }

  /**
   * Obtiene estadísticas rápidas
   */
  async getQuickStats(childProfileId: string): Promise<QuickStatsDto> {
    const todayUsage = await this.getTodayUsage(childProfileId);
    const weekUsage = await this.getWeekUsage(childProfileId);
    const control = await this.getOrCreateParentalControl(childProfileId);

    const unreadEvents = await this.activityLogRepository.count({
      where: { childProfileId, isRead: false },
    });

    const alertEvents = await this.activityLogRepository.count({
      where: {
        childProfileId,
        isRead: false,
        severity: ActivitySeverity.ALERT,
      },
    });

    // Calcular racha (simplificado)
    const recentSummaries = await this.dailyUsageRepository.find({
      where: { childProfileId },
      order: { date: 'DESC' },
      take: 30,
    });

    let currentStreak = 0;
    const today = this.getDateString(new Date());
    for (const summary of recentSummaries) {
      if (summary.totalMinutes > 0) {
        currentStreak++;
      } else if (summary.date !== today) {
        break;
      }
    }

    return {
      todayMinutes: todayUsage?.totalMinutes ?? 0,
      todayRemainingMinutes: control.getRemainingDailyTime(
        todayUsage?.totalMinutes ?? 0,
      ),
      todayLimitPercent:
        control.dailyTimeLimitMinutes && todayUsage
          ? Math.min(
              100,
              (todayUsage.totalMinutes / control.dailyTimeLimitMinutes) * 100,
            )
          : null,
      weekMinutes: weekUsage,
      weekRemainingMinutes:
        control.weeklyTimeLimitMinutes !== null
          ? Math.max(0, control.weeklyTimeLimitMinutes - weekUsage)
          : null,
      currentStreak,
      todayExercises: todayUsage?.learningMetrics.exercisesCompleted ?? 0,
      todayAccuracy: todayUsage?.learningMetrics.accuracy ?? null,
      lastSession: todayUsage
        ? {
            date: todayUsage.date,
            time: todayUsage.lastSessionTime || '',
            durationMinutes: todayUsage.totalMinutes,
          }
        : null,
      unreadEvents,
      pendingAlerts: alertEvents,
    };
  }

  // ==================== ACTIVITY LOG ====================

  /**
   * Registra una actividad
   */
  async logActivity(
    childProfileId: string,
    activityType: ActivityType,
    metadata: Record<string, unknown> = {},
    customTitle?: string,
    customDescription?: string,
  ): Promise<ActivityLog> {
    const log = this.activityLogRepository.create({
      childProfileId,
      activityType,
      severity: ACTIVITY_SEVERITIES[activityType],
      title: customTitle || ACTIVITY_TITLES[activityType],
      description: customDescription || null,
      metadata,
    });

    return this.activityLogRepository.save(log);
  }

  /**
   * Obtiene los logs de actividad
   */
  async getActivityLogs(
    childProfileId: string,
    query: GetActivityLogsQueryDto,
  ): Promise<ActivityLogListResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause: Record<string, unknown> = { childProfileId };

    if (query.type) {
      whereClause.activityType = query.type;
    }
    if (query.severity) {
      whereClause.severity = query.severity;
    }
    if (query.unreadOnly) {
      whereClause.isRead = false;
    }

    let dateFilter = {};
    if (query.startDate && query.endDate) {
      dateFilter = {
        createdAt: Between(new Date(query.startDate), new Date(query.endDate)),
      };
    } else if (query.startDate) {
      dateFilter = { createdAt: MoreThanOrEqual(new Date(query.startDate)) };
    } else if (query.endDate) {
      dateFilter = { createdAt: LessThanOrEqual(new Date(query.endDate)) };
    }

    const [items, total] = await this.activityLogRepository.findAndCount({
      where: { ...whereClause, ...dateFilter },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const unreadCount = await this.activityLogRepository.count({
      where: { childProfileId, isRead: false },
    });

    return {
      items: items.map((log) => this.toActivityLogResponse(log)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };
  }

  /**
   * Marca logs como leídos
   */
  async markLogsAsRead(
    childProfileId: string,
    logIds?: string[],
  ): Promise<number> {
    const whereClause: Record<string, unknown> = {
      childProfileId,
      isRead: false,
    };

    if (logIds && logIds.length > 0) {
      const logs = await this.activityLogRepository.find({
        where: whereClause,
      });
      const filteredLogs = logs.filter((log) => logIds.includes(log.id));
      for (const log of filteredLogs) {
        log.markAsRead();
      }
      await this.activityLogRepository.save(filteredLogs);
      return filteredLogs.length;
    }

    const result = await this.activityLogRepository.update(
      { childProfileId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return result.affected || 0;
  }

  /**
   * Obtiene conteos de actividad
   */
  async getActivityCounts(childProfileId: string): Promise<ActivityCountsDto> {
    const total = await this.activityLogRepository.count({
      where: { childProfileId },
    });

    const unread = await this.activityLogRepository.count({
      where: { childProfileId, isRead: false },
    });

    const alerts = await this.activityLogRepository.count({
      where: {
        childProfileId,
        isRead: false,
        severity: ActivitySeverity.ALERT,
      },
    });

    // Logros recientes (últimos 7 días)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentAchievements = await this.activityLogRepository.count({
      where: {
        childProfileId,
        severity: ActivitySeverity.SUCCESS,
        createdAt: MoreThanOrEqual(weekAgo),
      },
    });

    // Contar por tipo
    const byTypeQuery = await this.activityLogRepository
      .createQueryBuilder('log')
      .select('log.activityType', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('log.childProfileId = :childProfileId', { childProfileId })
      .groupBy('log.activityType')
      .getRawMany();

    const byType: Record<string, number> = {};
    for (const row of byTypeQuery) {
      byType[row.type] = parseInt(row.count, 10);
    }

    // Contar por severidad
    const bySeverityQuery = await this.activityLogRepository
      .createQueryBuilder('log')
      .select('log.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .where('log.childProfileId = :childProfileId', { childProfileId })
      .groupBy('log.severity')
      .getRawMany();

    const bySeverity: Record<string, number> = {};
    for (const row of bySeverityQuery) {
      bySeverity[row.severity] = parseInt(row.count, 10);
    }

    return {
      total,
      unread,
      alerts,
      recentAchievements,
      byType,
      bySeverity,
    };
  }

  // ==================== HELPERS ====================

  private toParentalControlResponse(
    control: ParentalControl,
  ): ParentalControlResponseDto {
    return {
      id: control.id,
      childProfileId: control.childProfileId,
      pinEnabled: control.pinEnabled,
      dailyTimeLimitMinutes: control.dailyTimeLimitMinutes,
      weeklyTimeLimitMinutes: control.weeklyTimeLimitMinutes,
      maxSessionDurationMinutes: control.maxSessionDurationMinutes,
      breakDurationMinutes: control.breakDurationMinutes,
      weeklySchedule: control.weeklySchedule,
      strictScheduleEnforcement: control.strictScheduleEnforcement,
      notifications: control.notifications,
      allowPetInteraction: control.allowPetInteraction,
      allowProfileChanges: control.allowProfileChanges,
      createdAt: control.createdAt,
      updatedAt: control.updatedAt,
    };
  }

  private toDailyUsageResponse(
    summary: DailyUsageSummary,
  ): DailyUsageResponseDto {
    return {
      id: summary.id,
      date: summary.date,
      totalMinutes: summary.totalMinutes,
      sessionsCount: summary.sessionsCount,
      firstSessionTime: summary.firstSessionTime,
      lastSessionTime: summary.lastSessionTime,
      activityBreakdown: summary.activityBreakdown,
      learningMetrics: summary.learningMetrics,
      dailyLimitMinutes: summary.dailyLimitMinutes,
      limitReached: summary.limitReached,
      limitUsagePercentage: summary.getLimitUsagePercentage(),
      petInteractions: {
        feed: summary.petFeedCount,
        play: summary.petPlayCount,
        pet: summary.petPetCount,
        total: summary.getTotalPetInteractions(),
      },
    };
  }

  private toActivityLogResponse(log: ActivityLog): ActivityLogResponseDto {
    return {
      id: log.id,
      childProfileId: log.childProfileId,
      activityType: log.activityType,
      severity: log.severity,
      title: log.title,
      description: log.description,
      metadata: log.metadata,
      isRead: log.isRead,
      createdAt: log.createdAt,
    };
  }

  private getDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getTimeString(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private getDayName(dateStr: string): string {
    const days = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];
    const date = new Date(dateStr + 'T00:00:00');
    return days[date.getDay()];
  }

  private calculatePeakHour(summaries: DailyUsageSummary[]): string | null {
    const hours: Record<string, number> = {};

    for (const summary of summaries) {
      if (summary.firstSessionTime) {
        const hour = summary.firstSessionTime.split(':')[0];
        hours[hour] = (hours[hour] || 0) + 1;
      }
    }

    const entries = Object.entries(hours);
    if (entries.length === 0) return null;

    const peak = entries.reduce((max, curr) => (curr[1] > max[1] ? curr : max));
    return `${peak[0]}:00`;
  }

  private getNextAllowedTime(control: ParentalControl): string | null {
    if (control.weeklySchedule.length === 0) return null;

    const now = new Date();
    const currentDay = now.getDay();

    // Buscar el próximo slot disponible
    for (let i = 0; i < 7; i++) {
      const dayIndex = (currentDay + i) % 7;
      const dayNames = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];
      const dayName = dayNames[dayIndex];

      const schedule = control.weeklySchedule.find(
        (s) => s.day === dayName && s.enabled,
      );

      if (schedule && schedule.timeRanges.length > 0) {
        const nextSlot = schedule.timeRanges[0];
        if (i === 0) {
          // Hoy, verificar si la hora aún no pasó
          const currentTime = this.getTimeString(now);
          if (nextSlot.start > currentTime) {
            return `Hoy a las ${nextSlot.start}`;
          }
        } else {
          const targetDate = new Date(now);
          targetDate.setDate(now.getDate() + i);
          return `${this.getDayName(this.getDateString(targetDate))} a las ${nextSlot.start}`;
        }
      }
    }

    return null;
  }

  /**
   * Verifica si el padre tiene acceso al perfil del niño
   */
  async verifyParentAccess(
    childProfileId: string,
    parentId: string,
  ): Promise<ChildProfile> {
    const profile = await this.childProfileRepository.findOne({
      where: { id: childProfileId, parentId },
    });

    if (!profile) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a este perfil',
      );
    }

    return profile;
  }
}
