import { ApiProperty } from '@nestjs/swagger';
import { WeeklyStatsDto } from './weekly-report.dto';

/**
 * Estadísticas totales del niño
 */
export class OverallStatsDto {
  @ApiProperty({ description: 'Tiempo total de uso (minutos)', example: 1500 })
  totalMinutes: number;

  @ApiProperty({ description: 'Total de sesiones', example: 150 })
  totalSessions: number;

  @ApiProperty({ description: 'Total de niveles completados', example: 420 })
  totalLevelsCompleted: number;

  @ApiProperty({ description: 'Total de estrellas ganadas', example: 980 })
  totalStarsEarned: number;

  @ApiProperty({ description: 'Precisión promedio general (%)', example: 78 })
  overallAccuracy: number;

  @ApiProperty({ description: 'Letras completadas', example: 12 })
  lettersCompleted: number;

  @ApiProperty({ description: 'Letras en progreso', example: 5 })
  lettersInProgress: number;

  @ApiProperty({ description: 'Letras no iniciadas', example: 11 })
  lettersNotStarted: number;

  @ApiProperty({ description: 'XP total acumulado', example: 5200 })
  totalXp: number;

  @ApiProperty({ description: 'Nivel general actual', example: 6 })
  currentLevel: number;

  @ApiProperty({ description: 'Mejor racha histórica', example: 15 })
  bestStreakEver: number;

  @ApiProperty({ description: 'Racha actual', example: 7 })
  currentStreak: number;

  @ApiProperty({ description: 'Días totales de uso', example: 45 })
  totalActiveDays: number;

  @ApiProperty({ description: 'Promedio de minutos por día activo', example: 33 })
  averageMinutesPerDay: number;

  @ApiProperty({ description: 'Fecha de inicio', example: '2024-12-01' })
  startDate: string;

  @ApiProperty({ description: 'Días desde el inicio', example: 50 })
  daysSinceStart: number;
}

/**
 * Progreso detallado por letra
 */
export class LetterDetailDto {
  @ApiProperty({ description: 'Letra', example: 'A' })
  letter: string;

  @ApiProperty({ description: 'Es vocal', example: true })
  isVowel: boolean;

  @ApiProperty({ description: 'Nivel actual (0-10)', example: 10 })
  currentLevel: number;

  @ApiProperty({ description: 'Está completada', example: true })
  isCompleted: boolean;

  @ApiProperty({ description: 'Porcentaje de progreso', example: 100 })
  progressPercent: number;

  @ApiProperty({ description: 'Estrellas totales ganadas', example: 28 })
  totalStars: number;

  @ApiProperty({ description: 'Estrellas máximas posibles', example: 30 })
  maxStars: number;

  @ApiProperty({ description: 'Tiempo total dedicado (minutos)', example: 45 })
  totalMinutes: number;

  @ApiProperty({ description: 'Precisión en esta letra (%)', example: 85 })
  accuracy: number;

  @ApiProperty({ description: 'Fecha de inicio', required: false })
  startedAt?: string;

  @ApiProperty({ description: 'Fecha de completado', required: false })
  completedAt?: string;
}

/**
 * Tendencia de uso
 */
export class UsageTrendDto {
  @ApiProperty({ description: 'Período', example: '2025-W03' })
  period: string;

  @ApiProperty({ description: 'Etiqueta del período', example: 'Semana 3' })
  label: string;

  @ApiProperty({ description: 'Minutos de uso', example: 315 })
  minutes: number;

  @ApiProperty({ description: 'Niveles completados', example: 84 })
  levelsCompleted: number;

  @ApiProperty({ description: 'Precisión (%)', example: 82 })
  accuracy: number;
}

/**
 * Hitos alcanzados
 */
export class MilestoneDto {
  @ApiProperty({ description: 'Nombre del hito', example: 'Primera vocal completada' })
  name: string;

  @ApiProperty({ description: 'Descripción', example: 'Completaste tu primera vocal: A' })
  description: string;

  @ApiProperty({ description: 'Fecha de logro', example: '2025-01-10' })
  achievedAt: string;

  @ApiProperty({ description: 'Icono/emoji', example: '🎉' })
  icon: string;
}

/**
 * Áreas de mejora sugeridas
 */
export class ImprovementAreaDto {
  @ApiProperty({ description: 'Área', example: 'Trazo de letras' })
  area: string;

  @ApiProperty({ description: 'Descripción', example: 'Los niveles de trazo tienen menor precisión' })
  description: string;

  @ApiProperty({ description: 'Sugerencia', example: 'Practicar más los niveles 4-6' })
  suggestion: string;

  @ApiProperty({ description: 'Prioridad', example: 'medium' })
  priority: 'high' | 'medium' | 'low';
}

/**
 * DTO de respuesta para reporte completo
 */
export class FullReportResponseDto {
  @ApiProperty({ description: 'ID del perfil del niño' })
  childProfileId: string;

  @ApiProperty({ description: 'Nombre del niño' })
  childName: string;

  @ApiProperty({ description: 'Avatar del niño', required: false })
  avatarUrl?: string;

  @ApiProperty({ description: 'Fecha de generación del reporte' })
  generatedAt: string;

  @ApiProperty({ description: 'Estadísticas generales' })
  overallStats: OverallStatsDto;

  @ApiProperty({ description: 'Estadísticas de esta semana' })
  thisWeekStats: WeeklyStatsDto;

  @ApiProperty({ description: 'Progreso detallado por letra', type: [LetterDetailDto] })
  letterProgress: LetterDetailDto[];

  @ApiProperty({ description: 'Tendencia de uso (últimas 8 semanas)', type: [UsageTrendDto] })
  usageTrend: UsageTrendDto[];

  @ApiProperty({ description: 'Hitos alcanzados', type: [MilestoneDto] })
  milestones: MilestoneDto[];

  @ApiProperty({ description: 'Áreas de mejora', type: [ImprovementAreaDto] })
  improvementAreas: ImprovementAreaDto[];

  @ApiProperty({ description: 'Resumen para padres' })
  parentSummary: string;

  @ApiProperty({ description: 'Recomendaciones', type: [String] })
  recommendations: string[];
}
