import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  LearningProgress,
  ElementType,
  SkillType,
  MasteryLevel,
} from './entities/learning-progress.entity';
import {
  LearningSession,
  SessionExerciseResult,
} from './entities/learning-session.entity';
import { ChildLevel } from './entities/child-level.entity';
import { ChildrenProfilesService } from '../children-profiles/children-profiles.service';
import {
  RecordAttemptDto,
  RecordSessionDto,
  LearningProgressResponseDto,
  AttemptResultResponseDto,
  ProgressSummaryDto,
  CategorySummaryDto,
  ElementProgressSummaryDto,
  ChildLevelResponseDto,
  WeeklyActivityResponseDto,
  DailyActivityDto,
  SessionHistoryResponseDto,
  SessionHistoryItemDto,
  TimelineResponseDto,
  TimelineEventDto,
  RecommendedElementsResponseDto,
  RecommendedElementDto,
} from './dto';
import {
  calculateMasteryLevel,
  calculateLevel,
  calculateOverallLevel,
  getXpForNextLevel,
  getLevelThresholds,
  TOTAL_LETTERS,
  XP_REWARDS,
} from './constants/mastery.constants';

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    @InjectRepository(LearningProgress)
    private readonly progressRepository: Repository<LearningProgress>,
    @InjectRepository(LearningSession)
    private readonly sessionRepository: Repository<LearningSession>,
    @InjectRepository(ChildLevel)
    private readonly levelRepository: Repository<ChildLevel>,
    private readonly childrenProfilesService: ChildrenProfilesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============================================
  // REGISTRO DE PROGRESO
  // ============================================

  /**
   * Registrar un intento individual
   */
  async recordAttempt(
    userId: string,
    dto: RecordAttemptDto,
  ): Promise<AttemptResultResponseDto> {
    // Verificar que el perfil pertenece al usuario
    await this.childrenProfilesService.findByIdAndParent(
      dto.childProfileId,
      userId,
    );

    // Buscar o crear el registro de progreso
    let progress = await this.progressRepository.findOne({
      where: {
        childProfileId: dto.childProfileId,
        elementType: dto.elementType,
        elementId: dto.elementId,
        skillType: dto.skillType,
      },
    });

    const previousLevel = progress?.masteryLevel || MasteryLevel.NOT_STARTED;

    if (!progress) {
      progress = this.progressRepository.create({
        childProfileId: dto.childProfileId,
        elementType: dto.elementType,
        elementId: dto.elementId,
        skillType: dto.skillType,
        totalAttempts: 0,
        correctAttempts: 0,
        currentStreak: 0,
        bestStreak: 0,
        accuracyRate: 0,
        masteryLevel: MasteryLevel.NOT_STARTED,
      });
    }

    // Actualizar estadísticas
    progress.totalAttempts += 1;
    if (dto.correct) {
      progress.correctAttempts += 1;
      progress.currentStreak += 1;
      if (progress.currentStreak > progress.bestStreak) {
        progress.bestStreak = progress.currentStreak;
      }
    } else {
      progress.currentStreak = 0;
    }

    // Calcular precisión
    progress.accuracyRate = progress.correctAttempts / progress.totalAttempts;

    // Calcular nuevo nivel de dominio
    const newMasteryLevel = calculateMasteryLevel(
      progress.totalAttempts,
      Number(progress.accuracyRate),
      progress.currentStreak,
    );

    const leveledUp = newMasteryLevel !== previousLevel;
    progress.masteryLevel = newMasteryLevel;

    // Si alcanzó mastered, registrar fecha
    if (newMasteryLevel === MasteryLevel.MASTERED && !progress.masteredAt) {
      progress.masteredAt = new Date();
    }

    progress.lastPracticedAt = new Date();

    // Actualizar metadata
    progress.metadata = {
      ...progress.metadata,
      avgResponseTime: dto.responseTimeMs,
    };

    // Guardar progreso
    const savedProgress = await this.progressRepository.save(progress);

    // Calcular XP ganado
    let xpEarned = 0;
    if (dto.correct) {
      xpEarned += XP_REWARDS.CORRECT_ANSWER;

      // Bonus por racha
      if (progress.currentStreak === 3) xpEarned += XP_REWARDS.STREAK_BONUS_3;
      if (progress.currentStreak === 5) xpEarned += XP_REWARDS.STREAK_BONUS_5;
      if (progress.currentStreak === 10) xpEarned += XP_REWARDS.STREAK_BONUS_10;
    }

    // Bonus por dominar elemento
    if (leveledUp && newMasteryLevel === MasteryLevel.MASTERED) {
      xpEarned += XP_REWARDS.ELEMENT_MASTERED;
    }

    // Actualizar nivel del niño
    if (xpEarned > 0 || leveledUp) {
      await this.updateChildLevel(dto.childProfileId, xpEarned);
    }

    // Emitir eventos
    if (leveledUp) {
      this.eventEmitter.emit('progress.mastery_level_changed', {
        childProfileId: dto.childProfileId,
        elementType: dto.elementType,
        elementId: dto.elementId,
        skillType: dto.skillType,
        previousLevel,
        newLevel: newMasteryLevel,
      });
    }

    this.logger.log(
      `Intento registrado: ${dto.elementType}:${dto.elementId} - ${dto.correct ? 'correcto' : 'incorrecto'} - ${newMasteryLevel}`,
    );

    return {
      success: true,
      progress: this.toProgressResponseDto(savedProgress),
      xpEarned,
      leveledUp,
      newMasteryLevel: leveledUp ? newMasteryLevel : null,
    };
  }

  /**
   * Registrar una sesión completa
   */
  async recordSession(
    userId: string,
    dto: RecordSessionDto,
  ): Promise<LearningSession> {
    // Verificar que el perfil pertenece al usuario
    await this.childrenProfilesService.findByIdAndParent(
      dto.childProfileId,
      userId,
    );

    // Calcular estadísticas de la sesión
    const exercisesCompleted = dto.results.length;
    const correctCount = dto.results.filter((r) => r.correct).length;
    const accuracyRate =
      exercisesCompleted > 0 ? correctCount / exercisesCompleted : 0;

    // Crear la sesión
    const session = this.sessionRepository.create({
      childProfileId: dto.childProfileId,
      sessionDate: new Date(),
      durationMinutes: dto.durationMinutes,
      exercisesCompleted,
      correctCount,
      accuracyRate,
      results: dto.results as SessionExerciseResult[],
      focusArea: dto.focusArea || null,
    });

    const savedSession = await this.sessionRepository.save(session);

    // Procesar cada resultado para actualizar el progreso individual
    for (const result of dto.results) {
      await this.recordAttempt(userId, {
        childProfileId: dto.childProfileId,
        elementType: result.elementType,
        elementId: result.elementId,
        skillType: result.skillType,
        correct: result.correct,
        responseTimeMs: result.responseTimeMs,
        givenAnswer: result.givenAnswer,
      });
    }

    // XP adicional por completar sesión
    let sessionXp = XP_REWARDS.SESSION_COMPLETED;
    if (Number(accuracyRate) >= 0.8) {
      sessionXp += XP_REWARDS.HIGH_ACCURACY_SESSION;
    }
    await this.updateChildLevel(dto.childProfileId, sessionXp);

    // Actualizar última vez que jugó
    await this.childrenProfilesService.updateLastPlayed(dto.childProfileId);

    this.logger.log(
      `Sesión registrada: ${dto.childProfileId} - ${exercisesCompleted} ejercicios - ${Math.round(accuracyRate * 100)}% precisión`,
    );

    return savedSession;
  }

  // ============================================
  // CONSULTAS DE PROGRESO
  // ============================================

  /**
   * Obtener resumen de progreso del niño
   */
  async getProgressSummary(
    userId: string,
    childProfileId: string,
  ): Promise<ProgressSummaryDto> {
    await this.childrenProfilesService.findByIdAndParent(
      childProfileId,
      userId,
    );

    const level = await this.getOrCreateChildLevel(childProfileId);
    const lastProgress = await this.progressRepository.findOne({
      where: { childProfileId },
      order: { lastPracticedAt: 'DESC' },
    });

    return {
      childProfileId,
      letters: await this.getCategorySummary(
        childProfileId,
        ElementType.LETTER,
      ),
      syllables: await this.getCategorySummary(
        childProfileId,
        ElementType.SYLLABLE,
      ),
      words: await this.getCategorySummary(childProfileId, ElementType.WORD),
      overallLevel: level.overallLevel,
      totalXp: level.totalXp,
      xpForNextLevel: getXpForNextLevel(level.overallLevel),
      totalMastered: level.totalMastered,
      lastActivity: lastProgress?.lastPracticedAt
        ? new Date(lastProgress.lastPracticedAt).toISOString()
        : null,
    };
  }

  /**
   * Obtener progreso de letras
   */
  async getLettersProgress(
    userId: string,
    childProfileId: string,
  ): Promise<ElementProgressSummaryDto[]> {
    await this.childrenProfilesService.findByIdAndParent(
      childProfileId,
      userId,
    );
    return this.getElementsProgress(childProfileId, ElementType.LETTER);
  }

  /**
   * Obtener progreso de sílabas
   */
  async getSyllablesProgress(
    userId: string,
    childProfileId: string,
  ): Promise<ElementProgressSummaryDto[]> {
    await this.childrenProfilesService.findByIdAndParent(
      childProfileId,
      userId,
    );
    return this.getElementsProgress(childProfileId, ElementType.SYLLABLE);
  }

  /**
   * Obtener progreso de palabras
   */
  async getWordsProgress(
    userId: string,
    childProfileId: string,
  ): Promise<ElementProgressSummaryDto[]> {
    await this.childrenProfilesService.findByIdAndParent(
      childProfileId,
      userId,
    );
    return this.getElementsProgress(childProfileId, ElementType.WORD);
  }

  /**
   * Obtener nivel actual del niño
   */
  async getChildLevel(
    userId: string,
    childProfileId: string,
  ): Promise<ChildLevelResponseDto> {
    await this.childrenProfilesService.findByIdAndParent(
      childProfileId,
      userId,
    );
    const level = await this.getOrCreateChildLevel(childProfileId);

    return {
      childProfileId: level.childProfileId,
      lettersReadingLevel: level.lettersReadingLevel,
      lettersWritingLevel: level.lettersWritingLevel,
      syllablesReadingLevel: level.syllablesReadingLevel,
      syllablesWritingLevel: level.syllablesWritingLevel,
      wordsReadingLevel: level.wordsReadingLevel,
      wordsWritingLevel: level.wordsWritingLevel,
      overallLevel: level.overallLevel,
      totalXp: level.totalXp,
      xpForNextLevel: getXpForNextLevel(level.overallLevel),
      averageLevel: level.averageLevel,
      lettersMastered: level.lettersMastered,
      syllablesMastered: level.syllablesMastered,
      wordsMastered: level.wordsMastered,
      totalMastered: level.totalMastered,
    };
  }

  /**
   * Obtener elementos recomendados para practicar
   */
  async getRecommendedElements(
    userId: string,
    childProfileId: string,
    limit: number = 10,
  ): Promise<RecommendedElementsResponseDto> {
    await this.childrenProfilesService.findByIdAndParent(
      childProfileId,
      userId,
    );

    const recommendations: RecommendedElementDto[] = [];

    // Obtener todos los progresos
    const allProgress = await this.progressRepository.find({
      where: { childProfileId },
    });

    // Crear mapa de progreso
    const progressMap = new Map<string, LearningProgress>();
    for (const p of allProgress) {
      progressMap.set(`${p.elementType}:${p.elementId}:${p.skillType}`, p);
    }

    // Letras del alfabeto español
    const letters = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

    // Analizar letras
    for (const letter of letters) {
      for (const skillType of [SkillType.READING, SkillType.WRITING]) {
        const key = `${ElementType.LETTER}:${letter}:${skillType}`;
        const progress = progressMap.get(key);

        if (!progress) {
          // No iniciado
          recommendations.push({
            elementType: ElementType.LETTER,
            elementId: letter,
            skillType,
            reason: 'not_started',
            priority: 1,
            currentAccuracy: null,
          });
        } else if (progress.masteryLevel === MasteryLevel.LEARNING) {
          // Necesita práctica
          recommendations.push({
            elementType: ElementType.LETTER,
            elementId: letter,
            skillType,
            reason: 'needs_practice',
            priority: 2,
            currentAccuracy: progress.accuracyPercentage,
          });
        } else if (progress.masteryLevel === MasteryLevel.PRACTICING) {
          // Casi dominado
          recommendations.push({
            elementType: ElementType.LETTER,
            elementId: letter,
            skillType,
            reason: 'almost_mastered',
            priority: 3,
            currentAccuracy: progress.accuracyPercentage,
          });
        } else if (
          progress.masteryLevel === MasteryLevel.MASTERED &&
          progress.lastPracticedAt &&
          this.daysSince(progress.lastPracticedAt) > 7
        ) {
          // Repaso (más de 7 días sin practicar)
          recommendations.push({
            elementType: ElementType.LETTER,
            elementId: letter,
            skillType,
            reason: 'review',
            priority: 4,
            currentAccuracy: progress.accuracyPercentage,
          });
        }
      }
    }

    // Ordenar por prioridad y limitar
    recommendations.sort((a, b) => a.priority - b.priority);

    return {
      childProfileId,
      recommendations: recommendations.slice(0, limit),
    };
  }

  // ============================================
  // DASHBOARD DE PADRES
  // ============================================

  /**
   * Obtener actividad semanal
   */
  async getWeeklyActivity(
    userId: string,
    childProfileId: string,
  ): Promise<WeeklyActivityResponseDto> {
    await this.childrenProfilesService.findByIdAndParent(
      childProfileId,
      userId,
    );

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const sessions = await this.sessionRepository.find({
      where: {
        childProfileId,
        sessionDate: Between(weekStart, today),
      },
      order: { sessionDate: 'ASC' },
    });

    // Agrupar por día
    const dailyMap = new Map<string, DailyActivityDto>();

    // Inicializar los 7 días
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap.set(dateStr, {
        date: dateStr,
        minutesPracticed: 0,
        exercisesCompleted: 0,
        accuracyPercentage: 0,
        newElementsLearned: 0,
        practiced: false,
      });
    }

    // Procesar sesiones
    for (const session of sessions) {
      const sessionDate = new Date(session.sessionDate);
      const dateStr = sessionDate.toISOString().split('T')[0];
      const day = dailyMap.get(dateStr);
      if (day) {
        day.minutesPracticed += session.durationMinutes;
        day.exercisesCompleted += session.exercisesCompleted;
        day.accuracyPercentage = session.accuracyPercentage
          ? Math.round(
              (day.accuracyPercentage + Number(session.accuracyRate) * 100) / 2,
            )
          : Math.round(Number(session.accuracyRate) * 100);
        day.practiced = true;
      }
    }

    const dailyActivity = Array.from(dailyMap.values());
    const activeDays = dailyActivity.filter((d) => d.practiced).length;
    const totalMinutes = dailyActivity.reduce(
      (sum, d) => sum + d.minutesPracticed,
      0,
    );
    const totalExercises = dailyActivity.reduce(
      (sum, d) => sum + d.exercisesCompleted,
      0,
    );
    const activeDaysData = dailyActivity.filter((d) => d.practiced);
    const averageAccuracy =
      activeDaysData.length > 0
        ? Math.round(
            activeDaysData.reduce((sum, d) => sum + d.accuracyPercentage, 0) /
              activeDaysData.length,
          )
        : 0;

    // Calcular racha actual
    let currentStreak = 0;
    for (let i = dailyActivity.length - 1; i >= 0; i--) {
      if (dailyActivity[i].practiced) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      childProfileId,
      weekStartDate: weekStart.toISOString().split('T')[0],
      weekEndDate: today.toISOString().split('T')[0],
      dailyActivity,
      activeDays,
      totalMinutes,
      totalExercises,
      averageAccuracy,
      currentStreak,
    };
  }

  /**
   * Obtener historial de sesiones
   */
  async getSessionHistory(
    userId: string,
    childProfileId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<SessionHistoryResponseDto> {
    await this.childrenProfilesService.findByIdAndParent(
      childProfileId,
      userId,
    );

    const [sessions, total] = await this.sessionRepository.findAndCount({
      where: { childProfileId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      childProfileId,
      sessions: sessions.map((s) => this.toSessionHistoryItemDto(s)),
      total,
      page,
      limit,
    };
  }

  /**
   * Obtener línea de tiempo de logros
   */
  async getTimeline(
    userId: string,
    childProfileId: string,
    limit: number = 20,
  ): Promise<TimelineResponseDto> {
    await this.childrenProfilesService.findByIdAndParent(
      childProfileId,
      userId,
    );

    const events: TimelineEventDto[] = [];

    // Obtener elementos dominados
    const masteredElements = await this.progressRepository.find({
      where: {
        childProfileId,
        masteryLevel: MasteryLevel.MASTERED,
      },
      order: { masteredAt: 'DESC' },
      take: limit,
    });

    for (const element of masteredElements) {
      if (element.masteredAt) {
        events.push({
          date: new Date(element.masteredAt).toISOString(),
          eventType: 'mastered_element',
          description: this.getMasteryDescription(element),
          metadata: {
            elementType: element.elementType,
            elementId: element.elementId,
            skillType: element.skillType,
          },
        });
      }
    }

    // Ordenar por fecha
    events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return {
      childProfileId,
      events: events.slice(0, limit),
      total: events.length,
    };
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /**
   * Obtener o crear nivel del niño
   */
  private async getOrCreateChildLevel(
    childProfileId: string,
  ): Promise<ChildLevel> {
    let level = await this.levelRepository.findOne({
      where: { childProfileId },
    });

    if (!level) {
      level = this.levelRepository.create({
        childProfileId,
        lettersReadingLevel: 1,
        lettersWritingLevel: 1,
        syllablesReadingLevel: 1,
        syllablesWritingLevel: 1,
        wordsReadingLevel: 1,
        wordsWritingLevel: 1,
        overallLevel: 1,
        totalXp: 0,
        lettersMastered: 0,
        syllablesMastered: 0,
        wordsMastered: 0,
      });
      level = await this.levelRepository.save(level);
    }

    return level;
  }

  /**
   * Actualizar nivel del niño
   */
  private async updateChildLevel(
    childProfileId: string,
    xpToAdd: number,
  ): Promise<void> {
    const level = await this.getOrCreateChildLevel(childProfileId);

    // Añadir XP
    level.totalXp += xpToAdd;

    // Recalcular nivel general
    level.overallLevel = calculateOverallLevel(level.totalXp);

    // Contar elementos dominados por categoría
    interface MasteredCountRow {
      elementType: string;
      skillType: string;
      count: string;
    }
    const masteredCounts: MasteredCountRow[] = await this.progressRepository
      .createQueryBuilder('p')
      .select('p.element_type', 'elementType')
      .addSelect('p.skill_type', 'skillType')
      .addSelect('COUNT(*)', 'count')
      .where('p.child_profile_id = :childProfileId', { childProfileId })
      .andWhere('p.mastery_level = :mastered', {
        mastered: MasteryLevel.MASTERED,
      })
      .groupBy('p.element_type')
      .addGroupBy('p.skill_type')
      .getRawMany();

    // Inicializar contadores
    let lettersReadingMastered = 0;
    let lettersWritingMastered = 0;
    let syllablesReadingMastered = 0;
    let syllablesWritingMastered = 0;
    let wordsReadingMastered = 0;
    let wordsWritingMastered = 0;

    for (const row of masteredCounts) {
      const count = parseInt(row.count, 10);
      const elementType = row.elementType as ElementType;
      const skillType = row.skillType as SkillType;

      if (elementType === ElementType.LETTER) {
        if (skillType === SkillType.READING) {
          lettersReadingMastered = count;
        } else {
          lettersWritingMastered = count;
        }
      } else if (elementType === ElementType.SYLLABLE) {
        if (skillType === SkillType.READING) {
          syllablesReadingMastered = count;
        } else {
          syllablesWritingMastered = count;
        }
      } else if (elementType === ElementType.WORD) {
        if (skillType === SkillType.READING) {
          wordsReadingMastered = count;
        } else {
          wordsWritingMastered = count;
        }
      }
    }

    // Actualizar contadores totales
    level.lettersMastered = lettersReadingMastered + lettersWritingMastered;
    level.syllablesMastered =
      syllablesReadingMastered + syllablesWritingMastered;
    level.wordsMastered = wordsReadingMastered + wordsWritingMastered;

    // Calcular niveles por categoría
    const thresholds = getLevelThresholds(ElementType.LETTER);
    level.lettersReadingLevel = calculateLevel(
      lettersReadingMastered,
      TOTAL_LETTERS,
      thresholds,
    );
    level.lettersWritingLevel = calculateLevel(
      lettersWritingMastered,
      TOTAL_LETTERS,
      thresholds,
    );

    // Para sílabas y palabras usar un total estimado
    const syllablesTotal = 50; // Estimado de sílabas a aprender
    const wordsTotal = 100; // Estimado de palabras a aprender

    const syllablesThresholds = getLevelThresholds(ElementType.SYLLABLE);
    level.syllablesReadingLevel = calculateLevel(
      syllablesReadingMastered,
      syllablesTotal,
      syllablesThresholds,
    );
    level.syllablesWritingLevel = calculateLevel(
      syllablesWritingMastered,
      syllablesTotal,
      syllablesThresholds,
    );

    const wordsThresholds = getLevelThresholds(ElementType.WORD);
    level.wordsReadingLevel = calculateLevel(
      wordsReadingMastered,
      wordsTotal,
      wordsThresholds,
    );
    level.wordsWritingLevel = calculateLevel(
      wordsWritingMastered,
      wordsTotal,
      wordsThresholds,
    );

    await this.levelRepository.save(level);
  }

  /**
   * Obtener resumen de una categoría
   */
  private async getCategorySummary(
    childProfileId: string,
    elementType: ElementType,
  ): Promise<CategorySummaryDto> {
    const progress = await this.progressRepository.find({
      where: { childProfileId, elementType },
    });

    const uniqueElements = new Set(progress.map((p) => p.elementId));
    const masteredElements = new Set(
      progress
        .filter((p) => p.masteryLevel === MasteryLevel.MASTERED)
        .map((p) => `${p.elementId}:${p.skillType}`),
    );

    const readingProgress = progress.filter(
      (p) => p.skillType === SkillType.READING,
    );
    const writingProgress = progress.filter(
      (p) => p.skillType === SkillType.WRITING,
    );

    const avgReadingAccuracy =
      readingProgress.length > 0
        ? Math.round(
            (readingProgress.reduce(
              (sum, p) => sum + Number(p.accuracyRate),
              0,
            ) /
              readingProgress.length) *
              100,
          )
        : 0;

    const avgWritingAccuracy =
      writingProgress.length > 0
        ? Math.round(
            (writingProgress.reduce(
              (sum, p) => sum + Number(p.accuracyRate),
              0,
            ) /
              writingProgress.length) *
              100,
          )
        : 0;

    const level = await this.getOrCreateChildLevel(childProfileId);

    let totalElements = TOTAL_LETTERS;
    let readingLevel = 1;
    let writingLevel = 1;

    if (elementType === ElementType.LETTER) {
      readingLevel = level.lettersReadingLevel;
      writingLevel = level.lettersWritingLevel;
    } else if (elementType === ElementType.SYLLABLE) {
      totalElements = 50;
      readingLevel = level.syllablesReadingLevel;
      writingLevel = level.syllablesWritingLevel;
    } else {
      totalElements = 100;
      readingLevel = level.wordsReadingLevel;
      writingLevel = level.wordsWritingLevel;
    }

    return {
      totalElements,
      startedElements: uniqueElements.size,
      masteredElements: Math.floor(masteredElements.size / 2), // Dividir por 2 ya que contamos reading y writing
      readingLevel,
      writingLevel,
      avgReadingAccuracy,
      avgWritingAccuracy,
    };
  }

  /**
   * Obtener progreso de elementos
   */
  private async getElementsProgress(
    childProfileId: string,
    elementType: ElementType,
  ): Promise<ElementProgressSummaryDto[]> {
    const progress = await this.progressRepository.find({
      where: { childProfileId, elementType },
    });

    // Agrupar por elementId
    const grouped = new Map<string, LearningProgress[]>();
    for (const p of progress) {
      if (!grouped.has(p.elementId)) {
        grouped.set(p.elementId, []);
      }
      grouped.get(p.elementId)!.push(p);
    }

    const result: ElementProgressSummaryDto[] = [];

    for (const [elementId, progressList] of grouped) {
      const reading = progressList.find(
        (p) => p.skillType === SkillType.READING,
      );
      const writing = progressList.find(
        (p) => p.skillType === SkillType.WRITING,
      );

      const lastPracticed = progressList.reduce(
        (latest, p) => {
          if (!p.lastPracticedAt) return latest;
          const pDate = new Date(p.lastPracticedAt);
          if (!latest) return pDate;
          return pDate > latest ? pDate : latest;
        },
        null as Date | null,
      );

      result.push({
        elementId,
        readingAccuracy: reading ? reading.accuracyPercentage : 0,
        readingMastery: reading?.masteryLevel || MasteryLevel.NOT_STARTED,
        writingAccuracy: writing ? writing.accuracyPercentage : 0,
        writingMastery: writing?.masteryLevel || MasteryLevel.NOT_STARTED,
        totalAttempts: progressList.reduce(
          (sum, p) => sum + p.totalAttempts,
          0,
        ),
        lastPracticedAt: lastPracticed ? lastPracticed.toISOString() : null,
      });
    }

    return result;
  }

  /**
   * Calcular días desde una fecha
   */
  private daysSince(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Obtener descripción de dominio
   */
  private getMasteryDescription(progress: LearningProgress): string {
    const skillName =
      progress.skillType === SkillType.READING ? 'leer' : 'escribir';

    switch (progress.elementType) {
      case ElementType.LETTER:
        return `Dominaste ${skillName} la letra "${progress.elementId}"`;
      case ElementType.SYLLABLE:
        return `Dominaste ${skillName} la sílaba "${progress.elementId}"`;
      case ElementType.WORD:
        return `Dominaste ${skillName} la palabra "${progress.elementId}"`;
      default:
        return `Dominaste ${skillName} "${progress.elementId}"`;
    }
  }

  // ============================================
  // MAPEOS A DTO
  // ============================================

  private toProgressResponseDto(
    progress: LearningProgress,
  ): LearningProgressResponseDto {
    return {
      id: progress.id,
      childProfileId: progress.childProfileId,
      elementType: progress.elementType,
      elementId: progress.elementId,
      skillType: progress.skillType,
      totalAttempts: progress.totalAttempts,
      correctAttempts: progress.correctAttempts,
      currentStreak: progress.currentStreak,
      bestStreak: progress.bestStreak,
      accuracyPercentage: progress.accuracyPercentage,
      masteryLevel: progress.masteryLevel,
      masteredAt: progress.masteredAt?.toISOString().split('T')[0] || null,
      lastPracticedAt: progress.lastPracticedAt?.toISOString() || null,
    };
  }

  private toSessionHistoryItemDto(
    session: LearningSession,
  ): SessionHistoryItemDto {
    return {
      id: session.id,
      sessionDate: new Date(session.sessionDate).toISOString().split('T')[0],
      durationMinutes: session.durationMinutes,
      exercisesCompleted: session.exercisesCompleted,
      accuracyPercentage: session.accuracyPercentage,
      focusArea: session.focusArea,
      createdAt: session.createdAt.toISOString(),
    };
  }
}
