import { ApiProperty } from '@nestjs/swagger';
import type { LetterActivity, ActivityBreakdown } from '../entities/daily-usage.entity';

/**
 * DTO de respuesta para uso diario
 */
export class DailyUsageResponseDto {
  @ApiProperty({ description: 'ID del registro' })
  id: string;

  @ApiProperty({ description: 'ID del perfil del niño' })
  childProfileId: string;

  @ApiProperty({ description: 'Fecha (YYYY-MM-DD)', example: '2025-01-20' })
  date: string;

  @ApiProperty({ description: 'Minutos totales de uso', example: 45 })
  totalMinutes: number;

  @ApiProperty({ description: 'Número de sesiones', example: 3 })
  sessionCount: number;

  @ApiProperty({ description: 'Niveles completados', example: 12 })
  levelsCompleted: number;

  @ApiProperty({ description: 'Niveles intentados', example: 15 })
  levelsAttempted: number;

  @ApiProperty({ description: 'Estrellas ganadas', example: 28 })
  starsEarned: number;

  @ApiProperty({ description: 'Ejercicios correctos', example: 50 })
  correctExercises: number;

  @ApiProperty({ description: 'Ejercicios incorrectos', example: 8 })
  incorrectExercises: number;

  @ApiProperty({ description: 'Tasa de precisión (%)', example: 86 })
  accuracyRate: number;

  @ApiProperty({ description: 'Promedio de estrellas por nivel', example: 2.3 })
  averageStarsPerLevel: number;

  @ApiProperty({ description: 'Letras nuevas iniciadas', example: 2 })
  newLettersStarted: number;

  @ApiProperty({ description: 'Letras completadas', example: 1 })
  lettersCompleted: number;

  @ApiProperty({ description: 'Actividad por letra' })
  letterActivity: Record<string, LetterActivity>;

  @ApiProperty({ description: 'Desglose por tipo de actividad' })
  activityBreakdown: ActivityBreakdown;

  @ApiProperty({ description: 'Interacciones con mascota', example: 5 })
  petInteractions: number;

  @ApiProperty({ description: 'Minijuegos jugados', example: 3 })
  minigamesPlayed: number;

  @ApiProperty({ description: 'XP ganado', example: 150 })
  xpEarned: number;

  @ApiProperty({ description: 'Mejor racha del día', example: 8 })
  bestStreak: number;
}

/**
 * DTO para rango de fechas
 */
export class DateRangeDto {
  @ApiProperty({ description: 'Fecha de inicio', example: '2025-01-14' })
  startDate: string;

  @ApiProperty({ description: 'Fecha de fin', example: '2025-01-20' })
  endDate: string;
}

/**
 * DTO para uso diario múltiple
 */
export class DailyUsageListResponseDto {
  @ApiProperty({ description: 'Rango de fechas consultado' })
  dateRange: DateRangeDto;

  @ApiProperty({ description: 'Lista de uso diario', type: [DailyUsageResponseDto] })
  dailyUsage: DailyUsageResponseDto[];

  @ApiProperty({ description: 'Total de minutos en el período', example: 315 })
  totalMinutes: number;

  @ApiProperty({ description: 'Promedio de minutos por día activo', example: 45 })
  averageMinutesPerActiveDay: number;

  @ApiProperty({ description: 'Días con actividad', example: 7 })
  activeDays: number;
}
