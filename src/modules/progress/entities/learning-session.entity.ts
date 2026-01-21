import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ChildProfile } from '../../children-profiles/entities/child-profile.entity';
import { ElementType, SkillType } from './learning-progress.entity';

/**
 * Resultado individual de un ejercicio dentro de una sesión
 */
export interface SessionExerciseResult {
  /** Tipo de elemento */
  elementType: ElementType;
  /** ID del elemento */
  elementId: string;
  /** Tipo de habilidad */
  skillType: SkillType;
  /** Si fue correcto */
  correct: boolean;
  /** Tiempo de respuesta en ms */
  responseTimeMs?: number;
  /** Respuesta dada por el niño (si aplica) */
  givenAnswer?: string;
}

@Entity('learning_sessions')
@Index(['childProfileId', 'sessionDate'])
@Index(['childProfileId', 'createdAt'])
export class LearningSession {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID único de la sesión',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del perfil del niño',
  })
  @Column({ name: 'child_profile_id', type: 'uuid' })
  childProfileId: string;

  @ManyToOne(() => ChildProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'child_profile_id' })
  childProfile: ChildProfile;

  @ApiProperty({
    example: '2025-01-20',
    description: 'Fecha de la sesión (YYYY-MM-DD)',
  })
  @Column({ name: 'session_date', type: 'date' })
  sessionDate: Date;

  @ApiProperty({
    example: 15,
    description: 'Duración de la sesión en minutos',
  })
  @Column({ name: 'duration_minutes', type: 'int', default: 0 })
  durationMinutes: number;

  @ApiProperty({
    example: 20,
    description: 'Número de ejercicios completados',
  })
  @Column({ name: 'exercises_completed', type: 'int', default: 0 })
  exercisesCompleted: number;

  @ApiProperty({
    example: 16,
    description: 'Número de ejercicios correctos',
  })
  @Column({ name: 'correct_count', type: 'int', default: 0 })
  correctCount: number;

  @ApiProperty({
    example: 0.8,
    description: 'Tasa de precisión de la sesión (0 a 1)',
  })
  @Column({
    name: 'accuracy_rate',
    type: 'decimal',
    precision: 5,
    scale: 4,
    default: 0,
  })
  accuracyRate: number;

  @ApiProperty({
    description: 'Resultados detallados de cada ejercicio',
    type: 'array',
  })
  @Column({ type: 'jsonb', default: [] })
  results: SessionExerciseResult[];

  @ApiProperty({
    example: 'letters',
    description: 'Área de enfoque de la sesión',
    nullable: true,
  })
  @Column({ name: 'focus_area', type: 'varchar', length: 50, nullable: true })
  focusArea: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // ============================================
  // MÉTODOS HELPER
  // ============================================

  /**
   * Calcula la precisión como porcentaje
   */
  get accuracyPercentage(): number {
    return Math.round(Number(this.accuracyRate) * 100);
  }

  /**
   * Obtiene los elementos únicos practicados en la sesión
   */
  get uniqueElementsPracticed(): number {
    const unique = new Set(
      this.results.map((r) => `${r.elementType}:${r.elementId}`),
    );
    return unique.size;
  }

  constructor(partial: Partial<LearningSession>) {
    Object.assign(this, partial);
  }
}
