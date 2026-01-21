import { ApiProperty } from '@nestjs/swagger';

export class DailyActivityDto {
  @ApiProperty({
    example: '2025-01-20',
    description: 'Fecha del día',
  })
  date: string;

  @ApiProperty({
    example: 15,
    description: 'Minutos de práctica',
  })
  minutesPracticed: number;

  @ApiProperty({
    example: 25,
    description: 'Ejercicios completados',
  })
  exercisesCompleted: number;

  @ApiProperty({
    example: 80,
    description: 'Precisión promedio del día',
  })
  accuracyPercentage: number;

  @ApiProperty({
    example: 3,
    description: 'Elementos nuevos aprendidos',
  })
  newElementsLearned: number;

  @ApiProperty({
    example: true,
    description: 'Si el niño practicó este día',
  })
  practiced: boolean;
}

export class WeeklyActivityResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del perfil del niño',
  })
  childProfileId: string;

  @ApiProperty({
    example: '2025-01-14',
    description: 'Fecha de inicio de la semana',
  })
  weekStartDate: string;

  @ApiProperty({
    example: '2025-01-20',
    description: 'Fecha de fin de la semana',
  })
  weekEndDate: string;

  @ApiProperty({
    type: [DailyActivityDto],
    description: 'Actividad por día',
  })
  dailyActivity: DailyActivityDto[];

  @ApiProperty({
    example: 5,
    description: 'Días activos en la semana',
  })
  activeDays: number;

  @ApiProperty({
    example: 75,
    description: 'Total de minutos practicados en la semana',
  })
  totalMinutes: number;

  @ApiProperty({
    example: 120,
    description: 'Total de ejercicios completados',
  })
  totalExercises: number;

  @ApiProperty({
    example: 78,
    description: 'Precisión promedio de la semana',
  })
  averageAccuracy: number;

  @ApiProperty({
    example: 5,
    description: 'Racha actual de días consecutivos',
  })
  currentStreak: number;
}

export class SessionHistoryItemDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID de la sesión',
  })
  id: string;

  @ApiProperty({
    example: '2025-01-20',
    description: 'Fecha de la sesión',
  })
  sessionDate: string;

  @ApiProperty({
    example: 15,
    description: 'Duración en minutos',
  })
  durationMinutes: number;

  @ApiProperty({
    example: 20,
    description: 'Ejercicios completados',
  })
  exercisesCompleted: number;

  @ApiProperty({
    example: 85,
    description: 'Precisión de la sesión',
  })
  accuracyPercentage: number;

  @ApiProperty({
    example: 'letters',
    description: 'Área de enfoque',
    nullable: true,
  })
  focusArea: string | null;

  @ApiProperty({
    example: '2025-01-20T10:30:00.000Z',
    description: 'Fecha y hora de creación',
  })
  createdAt: string;
}

export class SessionHistoryResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del perfil del niño',
  })
  childProfileId: string;

  @ApiProperty({
    type: [SessionHistoryItemDto],
    description: 'Lista de sesiones',
  })
  sessions: SessionHistoryItemDto[];

  @ApiProperty({
    example: 25,
    description: 'Total de sesiones',
  })
  total: number;

  @ApiProperty({
    example: 1,
    description: 'Página actual',
  })
  page: number;

  @ApiProperty({
    example: 10,
    description: 'Elementos por página',
  })
  limit: number;
}

export class TimelineEventDto {
  @ApiProperty({
    example: '2025-01-20T10:30:00.000Z',
    description: 'Fecha del evento',
  })
  date: string;

  @ApiProperty({
    example: 'mastered_element',
    description: 'Tipo de evento',
  })
  eventType:
    | 'mastered_element'
    | 'level_up'
    | 'streak_milestone'
    | 'session_completed';

  @ApiProperty({
    example: 'Dominaste la letra A',
    description: 'Descripción del evento',
  })
  description: string;

  @ApiProperty({
    example: { elementType: 'letter', elementId: 'A' },
    description: 'Datos adicionales del evento',
  })
  metadata: Record<string, any>;
}

export class TimelineResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del perfil del niño',
  })
  childProfileId: string;

  @ApiProperty({
    type: [TimelineEventDto],
    description: 'Eventos en la línea de tiempo',
  })
  events: TimelineEventDto[];

  @ApiProperty({
    example: 50,
    description: 'Total de eventos',
  })
  total: number;
}

export class RecommendedElementDto {
  @ApiProperty({
    example: 'letter',
    description: 'Tipo de elemento',
  })
  elementType: string;

  @ApiProperty({
    example: 'B',
    description: 'ID del elemento',
  })
  elementId: string;

  @ApiProperty({
    example: 'reading',
    description: 'Habilidad recomendada para practicar',
  })
  skillType: string;

  @ApiProperty({
    example: 'needs_practice',
    description: 'Razón de la recomendación',
  })
  reason: 'not_started' | 'needs_practice' | 'almost_mastered' | 'review';

  @ApiProperty({
    example: 3,
    description: 'Prioridad (1 = más alta)',
  })
  priority: number;

  @ApiProperty({
    example: 60,
    description: 'Precisión actual (si aplica)',
    nullable: true,
  })
  currentAccuracy: number | null;
}

export class RecommendedElementsResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del perfil del niño',
  })
  childProfileId: string;

  @ApiProperty({
    type: [RecommendedElementDto],
    description: 'Elementos recomendados para practicar',
  })
  recommendations: RecommendedElementDto[];
}
