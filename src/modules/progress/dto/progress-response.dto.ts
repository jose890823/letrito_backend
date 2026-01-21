import { ApiProperty } from '@nestjs/swagger';
import {
  ElementType,
  SkillType,
  MasteryLevel,
} from '../entities/learning-progress.entity';

export class LearningProgressResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID único del registro de progreso',
  })
  id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del perfil del niño',
  })
  childProfileId: string;

  @ApiProperty({
    example: 'letter',
    description: 'Tipo de elemento',
    enum: ElementType,
  })
  elementType: ElementType;

  @ApiProperty({
    example: 'A',
    description: 'Identificador del elemento',
  })
  elementId: string;

  @ApiProperty({
    example: 'reading',
    description: 'Tipo de habilidad',
    enum: SkillType,
  })
  skillType: SkillType;

  @ApiProperty({
    example: 15,
    description: 'Total de intentos realizados',
  })
  totalAttempts: number;

  @ApiProperty({
    example: 12,
    description: 'Total de intentos correctos',
  })
  correctAttempts: number;

  @ApiProperty({
    example: 5,
    description: 'Racha actual de aciertos',
  })
  currentStreak: number;

  @ApiProperty({
    example: 8,
    description: 'Mejor racha',
  })
  bestStreak: number;

  @ApiProperty({
    example: 80,
    description: 'Porcentaje de precisión (0-100)',
  })
  accuracyPercentage: number;

  @ApiProperty({
    example: 'practicing',
    description: 'Nivel de dominio',
    enum: MasteryLevel,
  })
  masteryLevel: MasteryLevel;

  @ApiProperty({
    example: '2025-01-15',
    description: 'Fecha de dominio',
    nullable: true,
  })
  masteredAt: string | null;

  @ApiProperty({
    example: '2025-01-20T10:30:00.000Z',
    description: 'Última práctica',
    nullable: true,
  })
  lastPracticedAt: string | null;
}

export class AttemptResultResponseDto {
  @ApiProperty({
    example: true,
    description: 'Si el intento se registró correctamente',
  })
  success: boolean;

  @ApiProperty({
    description: 'Progreso actualizado',
    type: LearningProgressResponseDto,
  })
  progress: LearningProgressResponseDto;

  @ApiProperty({
    example: 10,
    description: 'XP ganado con este intento',
  })
  xpEarned: number;

  @ApiProperty({
    example: true,
    description: 'Si se alcanzó un nuevo nivel de dominio',
  })
  leveledUp: boolean;

  @ApiProperty({
    example: 'practicing',
    description: 'Nuevo nivel de dominio (si cambió)',
    enum: MasteryLevel,
    nullable: true,
  })
  newMasteryLevel: MasteryLevel | null;
}
