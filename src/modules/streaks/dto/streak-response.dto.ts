import { ApiProperty } from '@nestjs/swagger';

export class StreakResponseDto {
  @ApiProperty({
    example: 5,
    description: 'Racha actual en dias',
  })
  currentStreak: number;

  @ApiProperty({
    example: 15,
    description: 'Racha mas larga alcanzada',
  })
  longestStreak: number;

  @ApiProperty({
    example: '2025-01-15',
    description: 'Ultima fecha de actividad',
  })
  lastActiveDate: string | null;

  @ApiProperty({
    example: 30,
    description: 'Total de dias activos historico',
  })
  totalDaysActive: number;

  @ApiProperty({
    example: true,
    description: 'Si el usuario ya registro actividad hoy',
  })
  isActiveToday: boolean;

  @ApiProperty({
    example: ['7_days', '14_days'],
    description: 'Logros desbloqueados',
  })
  achievements: string[];
}

export class StreakCheckInResponseDto {
  @ApiProperty({
    example: 'check_in',
    description: 'Tipo de evento (check_in, streak_continued, streak_broken)',
  })
  eventType: string;

  @ApiProperty({
    example: 6,
    description: 'Nueva racha actual',
  })
  newStreak: number;

  @ApiProperty({
    example: false,
    description: 'Si se rompio la racha',
  })
  streakBroken: boolean;

  @ApiProperty({
    example: '7_days',
    description: 'Nuevo logro desbloqueado (si aplica)',
    required: false,
  })
  newAchievement?: string;

  @ApiProperty({
    example: 'Felicidades! Llevas 6 dias seguidos',
    description: 'Mensaje motivacional',
  })
  message: string;
}
