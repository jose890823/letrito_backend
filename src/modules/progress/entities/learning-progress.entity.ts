import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ChildProfile } from '../../children-profiles/entities/child-profile.entity';

/**
 * Tipo de elemento de aprendizaje
 */
export enum ElementType {
  LETTER = 'letter',
  SYLLABLE = 'syllable',
  WORD = 'word',
}

/**
 * Tipo de habilidad
 */
export enum SkillType {
  READING = 'reading',
  WRITING = 'writing',
}

/**
 * Nivel de dominio de un elemento
 */
export enum MasteryLevel {
  NOT_STARTED = 'not_started',
  LEARNING = 'learning',
  PRACTICING = 'practicing',
  MASTERED = 'mastered',
}

/**
 * Metadata adicional del progreso
 */
export interface ProgressMetadata {
  /** Último ejercicio realizado */
  lastExerciseType?: string;
  /** Tiempo promedio de respuesta en ms */
  avgResponseTime?: number;
  /** Errores más comunes */
  commonMistakes?: string[];
  /** Notas adicionales */
  notes?: string;
}

@Entity('learning_progress')
@Unique(['childProfileId', 'elementType', 'elementId', 'skillType'])
@Index(['childProfileId', 'elementType'])
@Index(['childProfileId', 'skillType'])
@Index(['childProfileId', 'masteryLevel'])
export class LearningProgress {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID único del registro de progreso',
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
    example: 'letter',
    description: 'Tipo de elemento (letra, sílaba, palabra)',
    enum: ElementType,
  })
  @Column({
    name: 'element_type',
    type: 'enum',
    enum: ElementType,
  })
  elementType: ElementType;

  @ApiProperty({
    example: 'A',
    description: 'Identificador del elemento (la letra, sílaba o palabra)',
  })
  @Column({ name: 'element_id', type: 'varchar', length: 50 })
  elementId: string;

  @ApiProperty({
    example: 'reading',
    description: 'Tipo de habilidad (lectura o escritura)',
    enum: SkillType,
  })
  @Column({
    name: 'skill_type',
    type: 'enum',
    enum: SkillType,
  })
  skillType: SkillType;

  @ApiProperty({
    example: 15,
    description: 'Total de intentos realizados',
  })
  @Column({ name: 'total_attempts', type: 'int', default: 0 })
  totalAttempts: number;

  @ApiProperty({
    example: 12,
    description: 'Total de intentos correctos',
  })
  @Column({ name: 'correct_attempts', type: 'int', default: 0 })
  correctAttempts: number;

  @ApiProperty({
    example: 5,
    description: 'Racha actual de aciertos consecutivos',
  })
  @Column({ name: 'current_streak', type: 'int', default: 0 })
  currentStreak: number;

  @ApiProperty({
    example: 8,
    description: 'Mejor racha de aciertos consecutivos',
  })
  @Column({ name: 'best_streak', type: 'int', default: 0 })
  bestStreak: number;

  @ApiProperty({
    example: 0.85,
    description: 'Tasa de precisión (0 a 1)',
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
    example: 'practicing',
    description: 'Nivel de dominio actual',
    enum: MasteryLevel,
  })
  @Column({
    name: 'mastery_level',
    type: 'enum',
    enum: MasteryLevel,
    default: MasteryLevel.NOT_STARTED,
  })
  masteryLevel: MasteryLevel;

  @ApiProperty({
    example: '2025-01-15',
    description: 'Fecha en que se dominó el elemento',
    nullable: true,
  })
  @Column({ name: 'mastered_at', type: 'date', nullable: true })
  masteredAt: Date | null;

  @ApiProperty({
    description: 'Metadata adicional del progreso',
    nullable: true,
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata: ProgressMetadata | null;

  @ApiProperty({
    description: 'Última vez que se practicó este elemento',
  })
  @Column({ name: 'last_practiced_at', type: 'timestamp', nullable: true })
  lastPracticedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

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
   * Verifica si el elemento está dominado
   */
  get isMastered(): boolean {
    return this.masteryLevel === MasteryLevel.MASTERED;
  }

  constructor(partial: Partial<LearningProgress>) {
    Object.assign(this, partial);
  }
}
