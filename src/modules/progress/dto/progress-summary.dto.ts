import { ApiProperty } from '@nestjs/swagger';
import { MasteryLevel } from '../entities/learning-progress.entity';

export class ElementProgressSummaryDto {
  @ApiProperty({
    example: 'A',
    description: 'Identificador del elemento',
  })
  elementId: string;

  @ApiProperty({
    example: 80,
    description: 'Precisión en lectura (0-100)',
  })
  readingAccuracy: number;

  @ApiProperty({
    example: 'practicing',
    description: 'Nivel de dominio en lectura',
    enum: MasteryLevel,
  })
  readingMastery: MasteryLevel;

  @ApiProperty({
    example: 65,
    description: 'Precisión en escritura (0-100)',
  })
  writingAccuracy: number;

  @ApiProperty({
    example: 'learning',
    description: 'Nivel de dominio en escritura',
    enum: MasteryLevel,
  })
  writingMastery: MasteryLevel;

  @ApiProperty({
    example: 25,
    description: 'Total de intentos combinados',
  })
  totalAttempts: number;

  @ApiProperty({
    example: '2025-01-20T10:30:00.000Z',
    description: 'Última práctica',
    nullable: true,
  })
  lastPracticedAt: string | null;
}

export class CategorySummaryDto {
  @ApiProperty({
    example: 27,
    description: 'Total de elementos en la categoría',
  })
  totalElements: number;

  @ApiProperty({
    example: 15,
    description: 'Elementos iniciados (al menos 1 intento)',
  })
  startedElements: number;

  @ApiProperty({
    example: 8,
    description: 'Elementos dominados',
  })
  masteredElements: number;

  @ApiProperty({
    example: 3,
    description: 'Nivel de lectura (1-5)',
  })
  readingLevel: number;

  @ApiProperty({
    example: 2,
    description: 'Nivel de escritura (1-5)',
  })
  writingLevel: number;

  @ApiProperty({
    example: 75,
    description: 'Precisión promedio en lectura',
  })
  avgReadingAccuracy: number;

  @ApiProperty({
    example: 60,
    description: 'Precisión promedio en escritura',
  })
  avgWritingAccuracy: number;
}

export class ProgressSummaryDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del perfil del niño',
  })
  childProfileId: string;

  @ApiProperty({
    description: 'Resumen de progreso en letras',
    type: CategorySummaryDto,
  })
  letters: CategorySummaryDto;

  @ApiProperty({
    description: 'Resumen de progreso en sílabas',
    type: CategorySummaryDto,
  })
  syllables: CategorySummaryDto;

  @ApiProperty({
    description: 'Resumen de progreso en palabras',
    type: CategorySummaryDto,
  })
  words: CategorySummaryDto;

  @ApiProperty({
    example: 5,
    description: 'Nivel general del niño (1-10)',
  })
  overallLevel: number;

  @ApiProperty({
    example: 1250,
    description: 'XP total acumulado',
  })
  totalXp: number;

  @ApiProperty({
    example: 1500,
    description: 'XP necesario para el siguiente nivel',
  })
  xpForNextLevel: number;

  @ApiProperty({
    example: 26,
    description: 'Total de elementos dominados',
  })
  totalMastered: number;

  @ApiProperty({
    example: '2025-01-20T10:30:00.000Z',
    description: 'Última actividad registrada',
    nullable: true,
  })
  lastActivity: string | null;
}
