import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsDateString } from 'class-validator';

// ==================== QUERY DTOs ====================

export class GetUsageQueryDto {
  @ApiPropertyOptional({
    description: 'Fecha de inicio (YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin (YYYY-MM-DD)',
    example: '2025-01-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Últimos N días',
    example: 7,
    minimum: 1,
    maximum: 90,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  lastDays?: number;
}

// ==================== RESPONSE DTOs ====================

export class DailyUsageResponseDto {
  @ApiProperty({ description: 'ID del resumen' })
  id: string;

  @ApiProperty({ description: 'Fecha (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ description: 'Minutos totales de uso' })
  totalMinutes: number;

  @ApiProperty({ description: 'Número de sesiones' })
  sessionsCount: number;

  @ApiProperty({ description: 'Hora de primera sesión', nullable: true })
  firstSessionTime: string | null;

  @ApiProperty({ description: 'Hora de última sesión', nullable: true })
  lastSessionTime: string | null;

  @ApiProperty({
    description: 'Desglose por tipo de actividad',
    example: {
      learningMinutes: 30,
      petInteractionMinutes: 10,
      freePlayMinutes: 5,
    },
  })
  activityBreakdown: {
    learningMinutes: number;
    petInteractionMinutes: number;
    freePlayMinutes: number;
  };

  @ApiProperty({
    description: 'Métricas de aprendizaje',
    example: {
      exercisesCompleted: 15,
      correctAnswers: 12,
      accuracy: 0.8,
      lettersReviewed: ['A', 'B', 'C'],
      syllablesReviewed: ['ma', 'pa'],
      wordsReviewed: ['casa'],
      newMasteries: 1,
    },
  })
  learningMetrics: {
    exercisesCompleted: number;
    correctAnswers: number;
    accuracy: number;
    lettersReviewed: string[];
    syllablesReviewed: string[];
    wordsReviewed: string[];
    newMasteries: number;
  };

  @ApiProperty({ description: 'Límite diario configurado', nullable: true })
  dailyLimitMinutes: number | null;

  @ApiProperty({ description: 'Si se alcanzó el límite' })
  limitReached: boolean;

  @ApiProperty({ description: 'Porcentaje del límite usado', nullable: true })
  limitUsagePercentage: number | null;

  @ApiProperty({ description: 'Interacciones con mascota' })
  petInteractions: {
    feed: number;
    play: number;
    pet: number;
    total: number;
  };
}

export class WeeklySummaryDto {
  @ApiProperty({ description: 'Fecha de inicio de la semana' })
  weekStart: string;

  @ApiProperty({ description: 'Fecha de fin de la semana' })
  weekEnd: string;

  @ApiProperty({ description: 'Total de minutos de la semana' })
  totalMinutes: number;

  @ApiProperty({ description: 'Promedio de minutos por día' })
  averageMinutesPerDay: number;

  @ApiProperty({ description: 'Días con actividad' })
  activeDays: number;

  @ApiProperty({ description: 'Total de sesiones' })
  totalSessions: number;

  @ApiProperty({ description: 'Día con más uso' })
  mostActiveDay: {
    date: string;
    dayName: string;
    minutes: number;
  } | null;

  @ApiProperty({ description: 'Hora más común de uso' })
  peakUsageHour: string | null;

  @ApiProperty({ description: 'Métricas de aprendizaje agregadas' })
  learningMetrics: {
    totalExercises: number;
    totalCorrect: number;
    averageAccuracy: number;
    uniqueLettersReviewed: number;
    uniqueSyllablesReviewed: number;
    uniqueWordsReviewed: number;
    newMasteries: number;
  };

  @ApiProperty({ description: 'Interacciones con mascota' })
  petInteractions: {
    totalFeed: number;
    totalPlay: number;
    totalPet: number;
  };

  @ApiProperty({ description: 'Límite semanal', nullable: true })
  weeklyLimitMinutes: number | null;

  @ApiProperty({ description: 'Si se alcanzó el límite semanal' })
  weeklyLimitReached: boolean;

  @ApiProperty({ description: 'Datos diarios', type: [DailyUsageResponseDto] })
  dailyData: DailyUsageResponseDto[];
}

export class UsageTrendDto {
  @ApiProperty({ description: 'Período del trend' })
  period: string;

  @ApiProperty({ description: 'Cambio porcentual vs período anterior' })
  changePercent: number;

  @ApiProperty({ description: 'Tendencia', enum: ['up', 'down', 'stable'] })
  trend: 'up' | 'down' | 'stable';

  @ApiProperty({ description: 'Valor actual' })
  currentValue: number;

  @ApiProperty({ description: 'Valor anterior' })
  previousValue: number;
}

export class ComprehensiveReportDto {
  @ApiProperty({ description: 'Período del reporte' })
  period: {
    start: string;
    end: string;
    days: number;
  };

  @ApiProperty({ description: 'Información del niño' })
  child: {
    id: string;
    name: string;
    age: number | null;
  };

  @ApiProperty({ description: 'Resumen de uso' })
  usageSummary: {
    totalMinutes: number;
    totalSessions: number;
    activeDays: number;
    averageMinutesPerDay: number;
    averageSessionLength: number;
    longestSession: number;
  };

  @ApiProperty({ description: 'Progreso de aprendizaje' })
  learningProgress: {
    exercisesCompleted: number;
    accuracy: number;
    lettersMastered: number;
    syllablesMastered: number;
    wordsMastered: number;
    currentLevel: number;
    levelProgress: number;
  };

  @ApiProperty({ description: 'Estado de la mascota' })
  petStatus: {
    name: string;
    evolutionStage: string;
    happiness: number;
    accessoriesUnlocked: number;
  } | null;

  @ApiProperty({ description: 'Cumplimiento de límites' })
  limitsCompliance: {
    dailyLimitSet: boolean;
    dailyLimitMinutes: number | null;
    daysWithinLimit: number;
    daysExceededLimit: number;
    weeklyLimitSet: boolean;
    weeklyLimitMinutes: number | null;
    weeksWithinLimit: number;
  };

  @ApiProperty({ description: 'Tendencias' })
  trends: {
    usageTime: UsageTrendDto;
    accuracy: UsageTrendDto;
    consistency: UsageTrendDto;
  };

  @ApiProperty({ description: 'Logros del período' })
  achievements: {
    newLetters: string[];
    newSyllables: string[];
    newWords: string[];
    streakDays: number;
    bestStreak: number;
  };

  @ApiProperty({ description: 'Recomendaciones' })
  recommendations: string[];
}

export class QuickStatsDto {
  @ApiProperty({ description: 'Minutos usados hoy' })
  todayMinutes: number;

  @ApiProperty({ description: 'Minutos restantes hoy', nullable: true })
  todayRemainingMinutes: number | null;

  @ApiProperty({
    description: 'Porcentaje del límite diario usado',
    nullable: true,
  })
  todayLimitPercent: number | null;

  @ApiProperty({ description: 'Minutos usados esta semana' })
  weekMinutes: number;

  @ApiProperty({ description: 'Minutos restantes esta semana', nullable: true })
  weekRemainingMinutes: number | null;

  @ApiProperty({ description: 'Racha actual de días' })
  currentStreak: number;

  @ApiProperty({ description: 'Ejercicios completados hoy' })
  todayExercises: number;

  @ApiProperty({ description: 'Precisión de hoy', nullable: true })
  todayAccuracy: number | null;

  @ApiProperty({ description: 'Última sesión' })
  lastSession: {
    date: string;
    time: string;
    durationMinutes: number;
  } | null;

  @ApiProperty({ description: 'Eventos no leídos' })
  unreadEvents: number;

  @ApiProperty({ description: 'Alertas pendientes' })
  pendingAlerts: number;
}
