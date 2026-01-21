import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ChildProfile } from '../../children-profiles/entities/child-profile.entity';

/**
 * Actividad por letra
 */
export interface LetterActivity {
  /** Minutos dedicados a esta letra */
  minutes: number;
  /** Niveles completados */
  levelsCompleted: number;
  /** Estrellas ganadas */
  starsEarned: number;
  /** Ejercicios correctos */
  correctExercises: number;
  /** Ejercicios incorrectos */
  incorrectExercises: number;
}

/**
 * Desglose por tipo de actividad
 */
export interface ActivityBreakdown {
  /** Minutos en niveles de reconocimiento */
  recognitionMinutes: number;
  /** Minutos en niveles de trazo */
  tracingMinutes: number;
  /** Minutos en niveles de audio */
  audioMinutes: number;
  /** Minutos en minijuegos */
  minigameMinutes: number;
  /** Minutos en interacción con mascota */
  petMinutes: number;
}

/**
 * Entidad para uso diario agregado
 *
 * Almacena estadísticas agregadas por día para cada niño.
 * Se actualiza en tiempo real durante las sesiones.
 */
@Entity('daily_usage')
@Index(['childProfileId', 'date'], { unique: true })
@Index(['date'])
export class DailyUsage {
  @ApiProperty({ description: 'ID único del registro' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID del perfil del niño' })
  @Column({ name: 'child_profile_id', type: 'uuid' })
  childProfileId: string;

  @ManyToOne(() => ChildProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'child_profile_id' })
  childProfile: ChildProfile;

  @ApiProperty({
    description: 'Fecha del registro (YYYY-MM-DD)',
    example: '2025-01-20',
  })
  @Column({ type: 'date' })
  date: string;

  @ApiProperty({ description: 'Minutos totales de uso', example: 45 })
  @Column({ name: 'total_minutes', type: 'int', default: 0 })
  totalMinutes: number;

  @ApiProperty({ description: 'Número de sesiones', example: 3 })
  @Column({ name: 'session_count', type: 'int', default: 0 })
  sessionCount: number;

  @ApiProperty({ description: 'Niveles completados', example: 12 })
  @Column({ name: 'levels_completed', type: 'int', default: 0 })
  levelsCompleted: number;

  @ApiProperty({ description: 'Niveles intentados', example: 15 })
  @Column({ name: 'levels_attempted', type: 'int', default: 0 })
  levelsAttempted: number;

  @ApiProperty({ description: 'Estrellas ganadas', example: 28 })
  @Column({ name: 'stars_earned', type: 'int', default: 0 })
  starsEarned: number;

  @ApiProperty({ description: 'Ejercicios correctos', example: 50 })
  @Column({ name: 'correct_exercises', type: 'int', default: 0 })
  correctExercises: number;

  @ApiProperty({ description: 'Ejercicios incorrectos', example: 8 })
  @Column({ name: 'incorrect_exercises', type: 'int', default: 0 })
  incorrectExercises: number;

  @ApiProperty({ description: 'Letras nuevas iniciadas', example: 2 })
  @Column({ name: 'new_letters_started', type: 'int', default: 0 })
  newLettersStarted: number;

  @ApiProperty({ description: 'Letras completadas', example: 1 })
  @Column({ name: 'letters_completed', type: 'int', default: 0 })
  lettersCompleted: number;

  @ApiProperty({
    description: 'Actividad detallada por letra',
    example: { A: { minutes: 15, levelsCompleted: 3, starsEarned: 8 } },
  })
  @Column({ name: 'letter_activity', type: 'jsonb', default: {} })
  letterActivity: Record<string, LetterActivity>;

  @ApiProperty({ description: 'Desglose por tipo de actividad' })
  @Column({ name: 'activity_breakdown', type: 'jsonb', default: {} })
  activityBreakdown: ActivityBreakdown;

  @ApiProperty({ description: 'Interacciones con la mascota', example: 5 })
  @Column({ name: 'pet_interactions', type: 'int', default: 0 })
  petInteractions: number;

  @ApiProperty({ description: 'Minijuegos jugados', example: 3 })
  @Column({ name: 'minigames_played', type: 'int', default: 0 })
  minigamesPlayed: number;

  @ApiProperty({ description: 'Logros desbloqueados', example: 2 })
  @Column({ name: 'achievements_unlocked', type: 'int', default: 0 })
  achievementsUnlocked: number;

  @ApiProperty({ description: 'XP ganado en el día', example: 150 })
  @Column({ name: 'xp_earned', type: 'int', default: 0 })
  xpEarned: number;

  @ApiProperty({ description: 'Mejor racha del día', example: 8 })
  @Column({ name: 'best_streak', type: 'int', default: 0 })
  bestStreak: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  constructor(partial: Partial<DailyUsage>) {
    Object.assign(this, partial);
  }

  /**
   * Calcula la tasa de precisión del día
   */
  get accuracyRate(): number {
    const total = this.correctExercises + this.incorrectExercises;
    if (total === 0) return 0;
    return Math.round((this.correctExercises / total) * 100);
  }

  /**
   * Calcula el promedio de estrellas por nivel
   */
  get averageStarsPerLevel(): number {
    if (this.levelsCompleted === 0) return 0;
    return Math.round((this.starsEarned / this.levelsCompleted) * 10) / 10;
  }
}
