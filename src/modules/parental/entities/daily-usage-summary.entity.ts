import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ChildProfile } from '../../children-profiles/entities/child-profile.entity';

/**
 * Desglose de actividad por tipo
 */
export interface ActivityBreakdown {
  learningMinutes: number;
  petInteractionMinutes: number;
  freePlayMinutes: number;
}

/**
 * Métricas de aprendizaje del día
 */
export interface DailyLearningMetrics {
  exercisesCompleted: number;
  correctAnswers: number;
  accuracy: number; // 0-1
  lettersReviewed: string[];
  syllablesReviewed: string[];
  wordsReviewed: string[];
  newMasteries: number;
}

/**
 * Entidad para resumen de uso diario por niño
 * Un registro por día por niño
 */
@Entity('daily_usage_summaries')
@Index(['childProfileId', 'date'], { unique: true })
@Index(['childProfileId'])
@Index(['date'])
export class DailyUsageSummary {
  @ApiProperty({ description: 'ID único del resumen' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ==================== RELACIÓN ====================

  @ManyToOne(() => ChildProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'childProfileId' })
  childProfile: ChildProfile;

  @Column({ type: 'uuid' })
  childProfileId: string;

  // ==================== FECHA ====================

  @ApiProperty({
    description: 'Fecha del resumen (YYYY-MM-DD)',
    example: '2025-01-21',
  })
  @Column({ type: 'date' })
  date: string;

  // ==================== TIEMPO DE USO ====================

  @ApiProperty({
    description: 'Minutos totales de uso en el día',
    example: 45,
  })
  @Column({ type: 'int', default: 0 })
  totalMinutes: number;

  @ApiProperty({
    description: 'Número de sesiones en el día',
    example: 3,
  })
  @Column({ type: 'int', default: 0 })
  sessionsCount: number;

  @ApiProperty({
    description: 'Hora de primera sesión',
    example: '08:30',
    nullable: true,
  })
  @Column({ type: 'varchar', length: 5, nullable: true })
  firstSessionTime: string | null;

  @ApiProperty({
    description: 'Hora de última sesión',
    example: '19:45',
    nullable: true,
  })
  @Column({ type: 'varchar', length: 5, nullable: true })
  lastSessionTime: string | null;

  // ==================== DESGLOSE DE ACTIVIDAD ====================

  @ApiProperty({ description: 'Desglose de minutos por tipo de actividad' })
  @Column({
    type: 'jsonb',
    default: {
      learningMinutes: 0,
      petInteractionMinutes: 0,
      freePlayMinutes: 0,
    },
  })
  activityBreakdown: ActivityBreakdown;

  // ==================== MÉTRICAS DE APRENDIZAJE ====================

  @ApiProperty({ description: 'Métricas de aprendizaje del día' })
  @Column({
    type: 'jsonb',
    default: {
      exercisesCompleted: 0,
      correctAnswers: 0,
      accuracy: 0,
      lettersReviewed: [],
      syllablesReviewed: [],
      wordsReviewed: [],
      newMasteries: 0,
    },
  })
  learningMetrics: DailyLearningMetrics;

  // ==================== LÍMITES ====================

  @ApiProperty({
    description: 'Límite diario configurado (minutos)',
    nullable: true,
  })
  @Column({ type: 'int', nullable: true })
  dailyLimitMinutes: number | null;

  @ApiProperty({
    description: 'Indica si se alcanzó el límite diario',
    default: false,
  })
  @Column({ type: 'boolean', default: false })
  limitReached: boolean;

  @ApiProperty({
    description: 'Hora en que se alcanzó el límite',
    nullable: true,
  })
  @Column({ type: 'varchar', length: 5, nullable: true })
  limitReachedAt: string | null;

  // ==================== INTERACCIÓN CON MASCOTA ====================

  @ApiProperty({
    description: 'Veces que alimentó a la mascota',
    default: 0,
  })
  @Column({ type: 'int', default: 0 })
  petFeedCount: number;

  @ApiProperty({
    description: 'Veces que jugó con la mascota',
    default: 0,
  })
  @Column({ type: 'int', default: 0 })
  petPlayCount: number;

  @ApiProperty({
    description: 'Veces que acarició a la mascota',
    default: 0,
  })
  @Column({ type: 'int', default: 0 })
  petPetCount: number;

  // ==================== TIMESTAMPS ====================

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ==================== MÉTODOS HELPER ====================

  /**
   * Calcula el porcentaje del límite diario usado
   */
  getLimitUsagePercentage(): number | null {
    if (!this.dailyLimitMinutes) return null;
    return Math.min(100, (this.totalMinutes / this.dailyLimitMinutes) * 100);
  }

  /**
   * Obtiene minutos restantes del límite
   */
  getRemainingMinutes(): number | null {
    if (!this.dailyLimitMinutes) return null;
    return Math.max(0, this.dailyLimitMinutes - this.totalMinutes);
  }

  /**
   * Verifica si hay actividad de aprendizaje
   */
  hasLearningActivity(): boolean {
    return this.learningMetrics.exercisesCompleted > 0;
  }

  /**
   * Calcula interacciones totales con mascota
   */
  getTotalPetInteractions(): number {
    return this.petFeedCount + this.petPlayCount + this.petPetCount;
  }

  constructor(partial: Partial<DailyUsageSummary>) {
    Object.assign(this, partial);
  }
}
