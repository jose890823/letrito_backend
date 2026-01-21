import { ApiProperty } from '@nestjs/swagger';

/**
 * Estadísticas de una semana
 */
export class WeeklyStatsDto {
  @ApiProperty({ description: 'Minutos totales de uso', example: 315 })
  totalMinutes: number;

  @ApiProperty({ description: 'Número de sesiones', example: 21 })
  totalSessions: number;

  @ApiProperty({ description: 'Niveles completados', example: 84 })
  levelsCompleted: number;

  @ApiProperty({ description: 'Estrellas ganadas', example: 196 })
  starsEarned: number;

  @ApiProperty({ description: 'Tasa de precisión promedio (%)', example: 82 })
  averageAccuracy: number;

  @ApiProperty({ description: 'Letras nuevas iniciadas', example: 5 })
  newLettersStarted: number;

  @ApiProperty({ description: 'Letras completadas', example: 3 })
  lettersCompleted: number;

  @ApiProperty({ description: 'XP ganado total', example: 1050 })
  totalXpEarned: number;

  @ApiProperty({ description: 'Mejor racha de la semana', example: 12 })
  bestStreak: number;

  @ApiProperty({ description: 'Días activos', example: 7 })
  activeDays: number;
}

/**
 * Actividad diaria resumida
 */
export class DailySummaryDto {
  @ApiProperty({ description: 'Fecha', example: '2025-01-20' })
  date: string;

  @ApiProperty({ description: 'Día de la semana', example: 'Lunes' })
  dayOfWeek: string;

  @ApiProperty({ description: 'Minutos de uso', example: 45 })
  minutes: number;

  @ApiProperty({ description: 'Niveles completados', example: 12 })
  levelsCompleted: number;

  @ApiProperty({ description: 'Estrellas ganadas', example: 28 })
  starsEarned: number;

  @ApiProperty({ description: 'Precisión (%)', example: 85 })
  accuracy: number;

  @ApiProperty({ description: 'Hubo actividad', example: true })
  hadActivity: boolean;
}

/**
 * Progreso en letras durante la semana
 */
export class WeeklyLetterProgressDto {
  @ApiProperty({ description: 'Letra', example: 'A' })
  letter: string;

  @ApiProperty({ description: 'Nivel inicial de la semana', example: 3 })
  startLevel: number;

  @ApiProperty({ description: 'Nivel actual', example: 8 })
  endLevel: number;

  @ApiProperty({ description: 'Niveles avanzados', example: 5 })
  levelsAdvanced: number;

  @ApiProperty({ description: 'Completada durante la semana', example: false })
  completedThisWeek: boolean;
}

/**
 * Comparativa con semana anterior
 */
export class WeekComparisonDto {
  @ApiProperty({ description: 'Cambio en minutos (%)', example: 15 })
  minutesChange: number;

  @ApiProperty({ description: 'Cambio en niveles (%)', example: 20 })
  levelsChange: number;

  @ApiProperty({ description: 'Cambio en precisión (puntos)', example: 5 })
  accuracyChange: number;

  @ApiProperty({ description: 'Cambio en días activos', example: 1 })
  activeDaysChange: number;

  @ApiProperty({ description: 'Tendencia general', example: 'improving' })
  trend: 'improving' | 'stable' | 'declining';
}

/**
 * DTO de respuesta para reporte semanal
 */
export class WeeklyReportResponseDto {
  @ApiProperty({ description: 'ID del perfil del niño' })
  childProfileId: string;

  @ApiProperty({ description: 'Nombre del niño' })
  childName: string;

  @ApiProperty({ description: 'Número de semana del año', example: 3 })
  weekNumber: number;

  @ApiProperty({ description: 'Año', example: 2025 })
  year: number;

  @ApiProperty({ description: 'Fecha de inicio de la semana', example: '2025-01-13' })
  weekStartDate: string;

  @ApiProperty({ description: 'Fecha de fin de la semana', example: '2025-01-19' })
  weekEndDate: string;

  @ApiProperty({ description: 'Estadísticas de la semana' })
  stats: WeeklyStatsDto;

  @ApiProperty({ description: 'Resumen diario', type: [DailySummaryDto] })
  dailySummary: DailySummaryDto[];

  @ApiProperty({ description: 'Progreso en letras', type: [WeeklyLetterProgressDto] })
  letterProgress: WeeklyLetterProgressDto[];

  @ApiProperty({ description: 'Comparativa con semana anterior', required: false })
  comparison?: WeekComparisonDto;

  @ApiProperty({
    description: 'Logros desbloqueados esta semana',
    example: ['Primera letra completada', 'Racha de 7 días'],
  })
  achievementsUnlocked: string[];

  @ApiProperty({ description: 'Mensaje motivacional personalizado' })
  motivationalMessage: string;
}
