import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, Raw } from 'typeorm';
import { SessionEvent, EventType } from './entities/session-event.entity';
import { DailyUsage, LetterActivity } from './entities/daily-usage.entity';
import { ChildProfile } from '../children-profiles/entities/child-profile.entity';
import {
  RegisterEventsDto,
  EventDto,
  RegisterEventsResponseDto,
  DailyUsageResponseDto,
  DailyUsageListResponseDto,
  WeeklyReportResponseDto,
  WeeklyStatsDto,
  DailySummaryDto,
  WeeklyLetterProgressDto,
  WeekComparisonDto,
  FullReportResponseDto,
  OverallStatsDto,
  LetterDetailDto,
  UsageTrendDto,
  MilestoneDto,
  ImprovementAreaDto,
} from './dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(SessionEvent)
    private readonly sessionEventRepository: Repository<SessionEvent>,
    @InjectRepository(DailyUsage)
    private readonly dailyUsageRepository: Repository<DailyUsage>,
    @InjectRepository(ChildProfile)
    private readonly childProfileRepository: Repository<ChildProfile>,
  ) {}

  /**
   * Registra múltiples eventos en batch
   */
  async registerEvents(dto: RegisterEventsDto): Promise<RegisterEventsResponseDto> {
    // Verificar que el perfil existe
    const childProfile = await this.childProfileRepository.findOne({
      where: { id: dto.childProfileId },
    });

    if (!childProfile) {
      throw new NotFoundException('Perfil de niño no encontrado');
    }

    let eventsRegistered = 0;
    let eventsFailed = 0;
    const datesToUpdate = new Set<string>();

    // Crear eventos
    for (const eventDto of dto.events) {
      try {
        const event = this.sessionEventRepository.create({
          childProfileId: dto.childProfileId,
          eventType: eventDto.eventType,
          timestamp: new Date(eventDto.timestamp),
          metadata: eventDto.metadata || null,
          sessionId: eventDto.sessionId || null,
        });

        await this.sessionEventRepository.save(event);
        eventsRegistered++;

        // Marcar fecha para actualizar uso diario
        const eventDate = new Date(eventDto.timestamp).toISOString().split('T')[0];
        datesToUpdate.add(eventDate);

        // Actualizar uso diario según tipo de evento (errores no afectan el contador)
        try {
          await this.updateDailyUsageFromEvent(dto.childProfileId, eventDto, eventDate);
        } catch (usageError) {
          this.logger.warn(`Error actualizando uso diario: ${usageError.message}`);
        }
      } catch (error) {
        this.logger.warn(`Error registrando evento: ${error.message}`);
        eventsFailed++;
      }
    }

    return {
      eventsRegistered,
      eventsFailed,
      dailyUsageUpdated: datesToUpdate.size > 0,
    };
  }

  /**
   * Actualiza uso diario basado en un evento
   */
  private async updateDailyUsageFromEvent(
    childProfileId: string,
    event: EventDto,
    date: string,
  ): Promise<void> {
    // Obtener o crear registro diario
    // Usamos Raw() para comparar la fecha correctamente con PostgreSQL
    let dailyUsage = await this.dailyUsageRepository.findOne({
      where: {
        childProfileId,
        date: Raw((alias) => `${alias} = :date`, { date }),
      },
    });

    if (!dailyUsage) {
      dailyUsage = this.dailyUsageRepository.create({
        childProfileId,
        date,
        // Inicializar todos los campos numéricos a 0
        totalMinutes: 0,
        sessionCount: 0,
        levelsCompleted: 0,
        levelsAttempted: 0,
        starsEarned: 0,
        correctExercises: 0,
        incorrectExercises: 0,
        newLettersStarted: 0,
        lettersCompleted: 0,
        petInteractions: 0,
        minigamesPlayed: 0,
        achievementsUnlocked: 0,
        xpEarned: 0,
        bestStreak: 0,
        letterActivity: {},
        activityBreakdown: {
          recognitionMinutes: 0,
          tracingMinutes: 0,
          audioMinutes: 0,
          minigameMinutes: 0,
          petMinutes: 0,
        },
      });
    }

    // Actualizar según tipo de evento
    switch (event.eventType) {
      case EventType.SESSION_START:
        dailyUsage.sessionCount++;
        break;

      case EventType.SESSION_END:
        if (event.metadata?.timeSpentMs) {
          dailyUsage.totalMinutes += Math.round(event.metadata.timeSpentMs / 60000);
        }
        break;

      case EventType.LEVEL_COMPLETE:
        dailyUsage.levelsCompleted++;
        dailyUsage.levelsAttempted++;
        if (event.metadata?.stars) {
          dailyUsage.starsEarned += event.metadata.stars;
        }
        if (event.metadata?.letter) {
          this.updateLetterActivity(dailyUsage, event.metadata.letter, {
            levelsCompleted: 1,
            starsEarned: event.metadata.stars || 0,
          });
        }
        break;

      case EventType.LEVEL_FAILED:
      case EventType.LEVEL_RETRY:
        dailyUsage.levelsAttempted++;
        break;

      case EventType.EXERCISE_CORRECT:
        dailyUsage.correctExercises++;
        break;

      case EventType.EXERCISE_INCORRECT:
        dailyUsage.incorrectExercises++;
        break;

      case EventType.LETTER_STARTED:
        dailyUsage.newLettersStarted++;
        break;

      case EventType.LETTER_COMPLETE:
        dailyUsage.lettersCompleted++;
        break;

      case EventType.PET_INTERACTION:
      case EventType.PET_EVOLVED:
      case EventType.PET_ACCESSORY_EQUIPPED:
        dailyUsage.petInteractions++;
        break;

      case EventType.MINIGAME_COMPLETED:
        dailyUsage.minigamesPlayed++;
        break;

      case EventType.ACHIEVEMENT_UNLOCKED:
        dailyUsage.achievementsUnlocked++;
        break;

      case EventType.STREAK_MILESTONE:
        if (event.metadata?.streakValue && event.metadata.streakValue > dailyUsage.bestStreak) {
          dailyUsage.bestStreak = event.metadata.streakValue;
        }
        break;
    }

    // Actualizar XP si viene en metadata
    if (event.metadata?.extra?.xpEarned) {
      dailyUsage.xpEarned += event.metadata.extra.xpEarned;
    }

    await this.dailyUsageRepository.save(dailyUsage);
  }

  /**
   * Actualiza actividad por letra
   */
  private updateLetterActivity(
    dailyUsage: DailyUsage,
    letter: string,
    updates: Partial<LetterActivity>,
  ): void {
    if (!dailyUsage.letterActivity[letter]) {
      dailyUsage.letterActivity[letter] = {
        minutes: 0,
        levelsCompleted: 0,
        starsEarned: 0,
        correctExercises: 0,
        incorrectExercises: 0,
      };
    }

    const activity = dailyUsage.letterActivity[letter];
    if (updates.minutes) activity.minutes += updates.minutes;
    if (updates.levelsCompleted) activity.levelsCompleted += updates.levelsCompleted;
    if (updates.starsEarned) activity.starsEarned += updates.starsEarned;
    if (updates.correctExercises) activity.correctExercises += updates.correctExercises;
    if (updates.incorrectExercises) activity.incorrectExercises += updates.incorrectExercises;
  }

  /**
   * Obtiene uso diario de un niño
   */
  async getDailyUsage(
    childProfileId: string,
    date?: string,
  ): Promise<DailyUsageResponseDto | null> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const dailyUsage = await this.dailyUsageRepository.findOne({
      where: {
        childProfileId,
        date: Raw((alias) => `${alias} = :date`, { date: targetDate }),
      },
    });

    if (!dailyUsage) {
      return null;
    }

    return this.toDailyUsageResponse(dailyUsage);
  }

  /**
   * Obtiene uso diario en un rango de fechas
   */
  async getDailyUsageRange(
    childProfileId: string,
    startDate: string,
    endDate: string,
  ): Promise<DailyUsageListResponseDto> {
    await this.verifyChildProfile(childProfileId);

    const dailyUsages = await this.dailyUsageRepository.find({
      where: {
        childProfileId,
        date: Between(startDate, endDate),
      },
      order: { date: 'ASC' },
    });

    const totalMinutes = dailyUsages.reduce((sum, d) => sum + d.totalMinutes, 0);
    const activeDays = dailyUsages.filter((d) => d.totalMinutes > 0).length;

    return {
      dateRange: { startDate, endDate },
      dailyUsage: dailyUsages.map((d) => this.toDailyUsageResponse(d)),
      totalMinutes,
      averageMinutesPerActiveDay: activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0,
      activeDays,
    };
  }

  /**
   * Genera reporte semanal
   */
  async getWeeklyReport(
    childProfileId: string,
    weekOffset: number = 0,
  ): Promise<WeeklyReportResponseDto> {
    const childProfile = await this.verifyChildProfile(childProfileId);

    // Calcular fechas de la semana
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + mondayOffset - weekOffset * 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    // Obtener uso diario de la semana
    const dailyUsages = await this.dailyUsageRepository.find({
      where: {
        childProfileId,
        date: Between(weekStartStr, weekEndStr),
      },
      order: { date: 'ASC' },
    });

    // Calcular estadísticas
    const stats = this.calculateWeeklyStats(dailyUsages);

    // Generar resumen diario
    const dailySummary = this.generateDailySummary(weekStart, dailyUsages);

    // Obtener progreso de letras (simplificado)
    const letterProgress = this.extractLetterProgress(dailyUsages);

    // Comparación con semana anterior
    let comparison: WeekComparisonDto | undefined;
    if (weekOffset === 0) {
      const previousWeekReport = await this.getWeeklyStats(childProfileId, 1);
      if (previousWeekReport) {
        comparison = this.calculateWeekComparison(stats, previousWeekReport);
      }
    }

    // Obtener logros de la semana
    const achievementsUnlocked = await this.getWeeklyAchievements(
      childProfileId,
      weekStartStr,
      weekEndStr,
    );

    // Calcular número de semana
    const startOfYear = new Date(weekStart.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(
      ((weekStart.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7,
    );

    return {
      childProfileId,
      childName: childProfile.name,
      weekNumber,
      year: weekStart.getFullYear(),
      weekStartDate: weekStartStr,
      weekEndDate: weekEndStr,
      stats,
      dailySummary,
      letterProgress,
      comparison,
      achievementsUnlocked,
      motivationalMessage: this.generateMotivationalMessage(stats, comparison),
    };
  }

  /**
   * Calcula estadísticas semanales
   */
  private calculateWeeklyStats(dailyUsages: DailyUsage[]): WeeklyStatsDto {
    const activeDays = dailyUsages.filter((d) => d.totalMinutes > 0).length;
    const totalCorrect = dailyUsages.reduce((sum, d) => sum + d.correctExercises, 0);
    const totalIncorrect = dailyUsages.reduce((sum, d) => sum + d.incorrectExercises, 0);
    const totalExercises = totalCorrect + totalIncorrect;

    return {
      totalMinutes: dailyUsages.reduce((sum, d) => sum + d.totalMinutes, 0),
      totalSessions: dailyUsages.reduce((sum, d) => sum + d.sessionCount, 0),
      levelsCompleted: dailyUsages.reduce((sum, d) => sum + d.levelsCompleted, 0),
      starsEarned: dailyUsages.reduce((sum, d) => sum + d.starsEarned, 0),
      averageAccuracy: totalExercises > 0 ? Math.round((totalCorrect / totalExercises) * 100) : 0,
      newLettersStarted: dailyUsages.reduce((sum, d) => sum + d.newLettersStarted, 0),
      lettersCompleted: dailyUsages.reduce((sum, d) => sum + d.lettersCompleted, 0),
      totalXpEarned: dailyUsages.reduce((sum, d) => sum + d.xpEarned, 0),
      bestStreak: Math.max(...dailyUsages.map((d) => d.bestStreak), 0),
      activeDays,
    };
  }

  /**
   * Genera resumen diario para la semana
   */
  private generateDailySummary(weekStart: Date, dailyUsages: DailyUsage[]): DailySummaryDto[] {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const summary: DailySummaryDto[] = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      const dayUsage = dailyUsages.find((d) => d.date === dateStr);
      const totalExercises = dayUsage
        ? dayUsage.correctExercises + dayUsage.incorrectExercises
        : 0;

      summary.push({
        date: dateStr,
        dayOfWeek: dayNames[currentDate.getDay()],
        minutes: dayUsage?.totalMinutes || 0,
        levelsCompleted: dayUsage?.levelsCompleted || 0,
        starsEarned: dayUsage?.starsEarned || 0,
        accuracy:
          totalExercises > 0
            ? Math.round((dayUsage!.correctExercises / totalExercises) * 100)
            : 0,
        hadActivity: (dayUsage?.totalMinutes || 0) > 0,
      });
    }

    return summary;
  }

  /**
   * Extrae progreso de letras de los datos diarios
   */
  private extractLetterProgress(dailyUsages: DailyUsage[]): WeeklyLetterProgressDto[] {
    const letterMap = new Map<string, { levels: number; completed: boolean }>();

    for (const usage of dailyUsages) {
      for (const [letter, activity] of Object.entries(usage.letterActivity)) {
        const current = letterMap.get(letter) || { levels: 0, completed: false };
        current.levels += activity.levelsCompleted;
        letterMap.set(letter, current);
      }

      // Marcar letras completadas
      if (usage.lettersCompleted > 0) {
        // Simplificación: marcamos las letras con más actividad como completadas
        const sortedLetters = Object.entries(usage.letterActivity)
          .sort((a, b) => b[1].levelsCompleted - a[1].levelsCompleted);

        for (let i = 0; i < usage.lettersCompleted && i < sortedLetters.length; i++) {
          const letterData = letterMap.get(sortedLetters[i][0]);
          if (letterData) letterData.completed = true;
        }
      }
    }

    return Array.from(letterMap.entries()).map(([letter, data]) => ({
      letter,
      startLevel: 0, // Simplificado
      endLevel: data.levels,
      levelsAdvanced: data.levels,
      completedThisWeek: data.completed,
    }));
  }

  /**
   * Obtiene estadísticas de una semana específica
   */
  private async getWeeklyStats(
    childProfileId: string,
    weekOffset: number,
  ): Promise<WeeklyStatsDto | null> {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + mondayOffset - weekOffset * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const dailyUsages = await this.dailyUsageRepository.find({
      where: {
        childProfileId,
        date: Between(
          weekStart.toISOString().split('T')[0],
          weekEnd.toISOString().split('T')[0],
        ),
      },
    });

    if (dailyUsages.length === 0) return null;

    return this.calculateWeeklyStats(dailyUsages);
  }

  /**
   * Calcula comparación entre semanas
   */
  private calculateWeekComparison(
    current: WeeklyStatsDto,
    previous: WeeklyStatsDto,
  ): WeekComparisonDto {
    const minutesChange =
      previous.totalMinutes > 0
        ? Math.round(((current.totalMinutes - previous.totalMinutes) / previous.totalMinutes) * 100)
        : current.totalMinutes > 0
          ? 100
          : 0;

    const levelsChange =
      previous.levelsCompleted > 0
        ? Math.round(
            ((current.levelsCompleted - previous.levelsCompleted) / previous.levelsCompleted) * 100,
          )
        : current.levelsCompleted > 0
          ? 100
          : 0;

    const accuracyChange = current.averageAccuracy - previous.averageAccuracy;
    const activeDaysChange = current.activeDays - previous.activeDays;

    // Determinar tendencia
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    const improvements = [minutesChange > 5, levelsChange > 5, accuracyChange > 2].filter(
      Boolean,
    ).length;
    const declines = [minutesChange < -10, levelsChange < -10, accuracyChange < -5].filter(
      Boolean,
    ).length;

    if (improvements >= 2) trend = 'improving';
    else if (declines >= 2) trend = 'declining';

    return {
      minutesChange,
      levelsChange,
      accuracyChange,
      activeDaysChange,
      trend,
    };
  }

  /**
   * Obtiene logros de la semana
   */
  private async getWeeklyAchievements(
    childProfileId: string,
    startDate: string,
    endDate: string,
  ): Promise<string[]> {
    const events = await this.sessionEventRepository.find({
      where: {
        childProfileId,
        eventType: EventType.ACHIEVEMENT_UNLOCKED,
        timestamp: Between(new Date(startDate), new Date(endDate + 'T23:59:59')),
      },
    });

    return events
      .map((e) => e.metadata?.achievementName)
      .filter((name): name is string => !!name);
  }

  /**
   * Genera mensaje motivacional
   */
  private generateMotivationalMessage(
    stats: WeeklyStatsDto,
    comparison?: WeekComparisonDto,
  ): string {
    if (stats.activeDays === 0) {
      return '¡Esta semana Letrito te extrañó! Vuelve a practicar para que siga creciendo feliz.';
    }

    if (comparison?.trend === 'improving') {
      return '¡Excelente trabajo esta semana! Letrito está muy orgulloso de tu progreso.';
    }

    if (stats.lettersCompleted > 0) {
      return `¡Felicidades! Completaste ${stats.lettersCompleted} letra(s) esta semana. ¡Sigue así!`;
    }

    if (stats.activeDays >= 5) {
      return '¡Gran constancia! Practicaste casi todos los días. Letrito está muy feliz.';
    }

    if (stats.averageAccuracy >= 80) {
      return '¡Muy buena precisión esta semana! Tu esfuerzo se nota.';
    }

    return '¡Sigue practicando! Cada día aprendes algo nuevo con Letrito.';
  }

  /**
   * Genera reporte completo
   */
  async getFullReport(childProfileId: string): Promise<FullReportResponseDto> {
    const childProfile = await this.verifyChildProfile(childProfileId);

    // Obtener todos los datos de uso
    const allDailyUsage = await this.dailyUsageRepository.find({
      where: { childProfileId },
      order: { date: 'ASC' },
    });

    // Estadísticas generales
    const overallStats = this.calculateOverallStats(allDailyUsage);

    // Estadísticas de esta semana
    const thisWeekStats = await this.getWeeklyStats(childProfileId, 0);

    // Progreso por letra (simplificado - necesitaría datos del módulo progress)
    const letterProgress = this.calculateLetterProgress(allDailyUsage);

    // Tendencia de uso
    const usageTrend = await this.calculateUsageTrend(childProfileId);

    // Hitos
    const milestones = await this.getMilestones(childProfileId);

    // Áreas de mejora
    const improvementAreas = this.identifyImprovementAreas(allDailyUsage, overallStats);

    return {
      childProfileId,
      childName: childProfile.name,
      avatarUrl: childProfile.avatarUrl || undefined,
      generatedAt: new Date().toISOString(),
      overallStats,
      thisWeekStats: thisWeekStats || this.getEmptyWeeklyStats(),
      letterProgress,
      usageTrend,
      milestones,
      improvementAreas,
      parentSummary: this.generateParentSummary(childProfile.name, overallStats),
      recommendations: this.generateRecommendations(overallStats, improvementAreas),
    };
  }

  /**
   * Calcula estadísticas generales
   */
  private calculateOverallStats(dailyUsages: DailyUsage[]): OverallStatsDto {
    const totalCorrect = dailyUsages.reduce((sum, d) => sum + d.correctExercises, 0);
    const totalIncorrect = dailyUsages.reduce((sum, d) => sum + d.incorrectExercises, 0);
    const totalExercises = totalCorrect + totalIncorrect;
    const activeDays = dailyUsages.filter((d) => d.totalMinutes > 0).length;
    const totalMinutes = dailyUsages.reduce((sum, d) => sum + d.totalMinutes, 0);

    // Calcular letras (simplificado)
    const allLetters = new Set<string>();
    dailyUsages.forEach((d) => {
      Object.keys(d.letterActivity).forEach((l) => allLetters.add(l));
    });

    const lettersCompleted = dailyUsages.reduce((sum, d) => sum + d.lettersCompleted, 0);
    const startDate = dailyUsages.length > 0 ? dailyUsages[0].date : new Date().toISOString().split('T')[0];
    const daysSinceStart = Math.floor(
      (Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      totalMinutes,
      totalSessions: dailyUsages.reduce((sum, d) => sum + d.sessionCount, 0),
      totalLevelsCompleted: dailyUsages.reduce((sum, d) => sum + d.levelsCompleted, 0),
      totalStarsEarned: dailyUsages.reduce((sum, d) => sum + d.starsEarned, 0),
      overallAccuracy: totalExercises > 0 ? Math.round((totalCorrect / totalExercises) * 100) : 0,
      lettersCompleted,
      lettersInProgress: allLetters.size - lettersCompleted,
      lettersNotStarted: 28 - allLetters.size, // 28 letras en español
      totalXp: dailyUsages.reduce((sum, d) => sum + d.xpEarned, 0),
      currentLevel: this.calculateLevel(dailyUsages.reduce((sum, d) => sum + d.xpEarned, 0)),
      bestStreakEver: Math.max(...dailyUsages.map((d) => d.bestStreak), 0),
      currentStreak: this.calculateCurrentStreak(dailyUsages),
      totalActiveDays: activeDays,
      averageMinutesPerDay: activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0,
      startDate,
      daysSinceStart,
    };
  }

  /**
   * Calcula nivel basado en XP
   */
  private calculateLevel(xp: number): number {
    const thresholds = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500];
    let level = 1;
    for (let i = 0; i < thresholds.length; i++) {
      if (xp >= thresholds[i]) level = i + 1;
    }
    return Math.min(level, 10);
  }

  /**
   * Calcula racha actual
   */
  private calculateCurrentStreak(dailyUsages: DailyUsage[]): number {
    if (dailyUsages.length === 0) return 0;

    const sortedDates = dailyUsages
      .filter((d) => d.totalMinutes > 0)
      .map((d) => d.date)
      .sort()
      .reverse();

    if (sortedDates.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Si no hay actividad hoy ni ayer, racha es 0
    if (sortedDates[0] !== today && sortedDates[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.round(
        (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Calcula progreso por letra
   */
  private calculateLetterProgress(dailyUsages: DailyUsage[]): LetterDetailDto[] {
    const letterMap = new Map<
      string,
      { levels: number; stars: number; minutes: number; correct: number; incorrect: number }
    >();

    const vowels = ['A', 'E', 'I', 'O', 'U'];

    for (const usage of dailyUsages) {
      for (const [letter, activity] of Object.entries(usage.letterActivity)) {
        const current = letterMap.get(letter) || {
          levels: 0,
          stars: 0,
          minutes: 0,
          correct: 0,
          incorrect: 0,
        };
        current.levels += activity.levelsCompleted;
        current.stars += activity.starsEarned;
        current.minutes += activity.minutes;
        current.correct += activity.correctExercises;
        current.incorrect += activity.incorrectExercises;
        letterMap.set(letter, current);
      }
    }

    return Array.from(letterMap.entries()).map(([letter, data]) => {
      const totalExercises = data.correct + data.incorrect;
      const currentLevel = Math.min(data.levels, 10);

      return {
        letter,
        isVowel: vowels.includes(letter),
        currentLevel,
        isCompleted: currentLevel >= 10,
        progressPercent: currentLevel * 10,
        totalStars: data.stars,
        maxStars: 30, // 3 estrellas x 10 niveles
        totalMinutes: data.minutes,
        accuracy: totalExercises > 0 ? Math.round((data.correct / totalExercises) * 100) : 0,
      };
    });
  }

  /**
   * Calcula tendencia de uso
   */
  private async calculateUsageTrend(childProfileId: string): Promise<UsageTrendDto[]> {
    const trends: UsageTrendDto[] = [];
    const today = new Date();

    for (let weekOffset = 7; weekOffset >= 0; weekOffset--) {
      const weekStart = new Date(today);
      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      weekStart.setDate(today.getDate() + mondayOffset - weekOffset * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const stats = await this.getWeeklyStats(childProfileId, weekOffset);
      const weekNum = Math.ceil(
        ((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / 86400000 +
          new Date(weekStart.getFullYear(), 0, 1).getDay() +
          1) /
          7,
      );

      trends.push({
        period: `${weekStart.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`,
        label: `Semana ${weekNum}`,
        minutes: stats?.totalMinutes || 0,
        levelsCompleted: stats?.levelsCompleted || 0,
        accuracy: stats?.averageAccuracy || 0,
      });
    }

    return trends;
  }

  /**
   * Obtiene hitos del niño
   */
  private async getMilestones(childProfileId: string): Promise<MilestoneDto[]> {
    const events = await this.sessionEventRepository.find({
      where: {
        childProfileId,
        eventType: EventType.ACHIEVEMENT_UNLOCKED,
      },
      order: { timestamp: 'DESC' },
      take: 10,
    });

    return events.map((e) => ({
      name: e.metadata?.achievementName || 'Logro',
      description: e.metadata?.extra?.description || '',
      achievedAt: e.timestamp.toISOString().split('T')[0],
      icon: e.metadata?.extra?.icon || '🏆',
    }));
  }

  /**
   * Identifica áreas de mejora
   */
  private identifyImprovementAreas(
    dailyUsages: DailyUsage[],
    stats: OverallStatsDto,
  ): ImprovementAreaDto[] {
    const areas: ImprovementAreaDto[] = [];

    // Constancia
    if (stats.totalActiveDays < stats.daysSinceStart * 0.5) {
      areas.push({
        area: 'Constancia',
        description: 'Hay días sin práctica',
        suggestion: 'Intenta practicar al menos 15 minutos diarios',
        priority: 'high',
      });
    }

    // Precisión
    if (stats.overallAccuracy < 70) {
      areas.push({
        area: 'Precisión',
        description: 'La precisión general es menor al 70%',
        suggestion: 'Tómate tu tiempo para responder correctamente',
        priority: 'medium',
      });
    }

    // Tiempo de sesión
    if (stats.averageMinutesPerDay < 20) {
      areas.push({
        area: 'Duración de sesiones',
        description: 'Las sesiones son cortas',
        suggestion: 'Intenta sesiones de 20-30 minutos para mejor retención',
        priority: 'low',
      });
    }

    return areas;
  }

  /**
   * Genera resumen para padres
   */
  private generateParentSummary(childName: string, stats: OverallStatsDto): string {
    if (stats.totalActiveDays === 0) {
      return `${childName} aún no ha comenzado a usar la aplicación.`;
    }

    const parts: string[] = [];

    parts.push(
      `${childName} ha practicado durante ${stats.totalMinutes} minutos en ${stats.totalActiveDays} días.`,
    );

    if (stats.lettersCompleted > 0) {
      parts.push(`Ha completado ${stats.lettersCompleted} letra(s) con éxito.`);
    }

    parts.push(`Su precisión general es del ${stats.overallAccuracy}%.`);

    if (stats.currentStreak > 0) {
      parts.push(`Tiene una racha actual de ${stats.currentStreak} días consecutivos.`);
    }

    return parts.join(' ');
  }

  /**
   * Genera recomendaciones
   */
  private generateRecommendations(
    stats: OverallStatsDto,
    areas: ImprovementAreaDto[],
  ): string[] {
    const recommendations: string[] = [];

    if (areas.some((a) => a.area === 'Constancia')) {
      recommendations.push('Establece un horario fijo de práctica cada día');
    }

    if (stats.lettersInProgress > 3) {
      recommendations.push('Enfócate en completar las letras que ya empezaste');
    }

    if (stats.overallAccuracy < 80) {
      recommendations.push('Repite los niveles donde hay más errores');
    }

    recommendations.push('Celebra cada logro para mantener la motivación');

    return recommendations;
  }

  /**
   * Retorna estadísticas semanales vacías
   */
  private getEmptyWeeklyStats(): WeeklyStatsDto {
    return {
      totalMinutes: 0,
      totalSessions: 0,
      levelsCompleted: 0,
      starsEarned: 0,
      averageAccuracy: 0,
      newLettersStarted: 0,
      lettersCompleted: 0,
      totalXpEarned: 0,
      bestStreak: 0,
      activeDays: 0,
    };
  }

  /**
   * Verifica que el perfil del niño existe
   */
  private async verifyChildProfile(childProfileId: string): Promise<ChildProfile> {
    const childProfile = await this.childProfileRepository.findOne({
      where: { id: childProfileId },
    });

    if (!childProfile) {
      throw new NotFoundException('Perfil de niño no encontrado');
    }

    return childProfile;
  }

  /**
   * Convierte entidad a DTO de respuesta
   */
  private toDailyUsageResponse(usage: DailyUsage): DailyUsageResponseDto {
    return {
      id: usage.id,
      childProfileId: usage.childProfileId,
      date: usage.date,
      totalMinutes: usage.totalMinutes,
      sessionCount: usage.sessionCount,
      levelsCompleted: usage.levelsCompleted,
      levelsAttempted: usage.levelsAttempted,
      starsEarned: usage.starsEarned,
      correctExercises: usage.correctExercises,
      incorrectExercises: usage.incorrectExercises,
      accuracyRate: usage.accuracyRate,
      averageStarsPerLevel: usage.averageStarsPerLevel,
      newLettersStarted: usage.newLettersStarted,
      lettersCompleted: usage.lettersCompleted,
      letterActivity: usage.letterActivity,
      activityBreakdown: usage.activityBreakdown,
      petInteractions: usage.petInteractions,
      minigamesPlayed: usage.minigamesPlayed,
      xpEarned: usage.xpEarned,
      bestStreak: usage.bestStreak,
    };
  }
}
