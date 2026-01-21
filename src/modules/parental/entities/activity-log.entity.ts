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

/**
 * Tipos de actividad para el log
 */
export enum ActivityType {
  // Sesiones
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  SESSION_PAUSED = 'session_paused',
  SESSION_RESUMED = 'session_resumed',

  // Límites
  DAILY_LIMIT_WARNING = 'daily_limit_warning', // 80% del límite
  DAILY_LIMIT_REACHED = 'daily_limit_reached',
  WEEKLY_LIMIT_REACHED = 'weekly_limit_reached',
  BREAK_REMINDER = 'break_reminder',

  // Horarios
  OUTSIDE_SCHEDULE_ATTEMPT = 'outside_schedule_attempt',
  SCHEDULE_BLOCK_START = 'schedule_block_start',
  SCHEDULE_BLOCK_END = 'schedule_block_end',

  // Logros y progreso
  LETTER_MASTERED = 'letter_mastered',
  SYLLABLE_MASTERED = 'syllable_mastered',
  WORD_MASTERED = 'word_mastered',
  LEVEL_UP = 'level_up',
  STREAK_MILESTONE = 'streak_milestone',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',

  // Mascota
  PET_EVOLUTION = 'pet_evolution',
  PET_ACCESSORY_UNLOCKED = 'pet_accessory_unlocked',
  PET_LOW_HAPPINESS = 'pet_low_happiness',

  // Configuración
  SETTINGS_CHANGED = 'settings_changed',
  PIN_CHANGED = 'pin_changed',
  PIN_FAILED_ATTEMPT = 'pin_failed_attempt',
  PIN_LOCKED = 'pin_locked',
}

/**
 * Severidad del evento
 */
export enum ActivitySeverity {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ALERT = 'alert',
}

/**
 * Metadatos según el tipo de actividad
 */
export interface ActivityMetadata {
  // Para sesiones
  sessionDurationMinutes?: number;
  sessionType?: string;

  // Para límites
  limitMinutes?: number;
  usedMinutes?: number;
  remainingMinutes?: number;

  // Para logros
  elementType?: string;
  elementId?: string;
  newLevel?: number;
  streakDays?: number;

  // Para mascota
  evolutionStage?: string;
  accessoryName?: string;
  happinessLevel?: number;

  // Para configuración
  changedFields?: string[];

  // General
  message?: string;
  [key: string]: unknown;
}

/**
 * Entidad para log de actividad del niño
 * Permite a los padres ver un historial de eventos importantes
 */
@Entity('activity_logs')
@Index(['childProfileId', 'createdAt'])
@Index(['childProfileId', 'activityType'])
@Index(['childProfileId', 'severity'])
export class ActivityLog {
  @ApiProperty({ description: 'ID único del log' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ==================== RELACIÓN ====================

  @ManyToOne(() => ChildProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'childProfileId' })
  childProfile: ChildProfile;

  @Column({ type: 'uuid' })
  childProfileId: string;

  // ==================== TIPO DE ACTIVIDAD ====================

  @ApiProperty({
    description: 'Tipo de actividad',
    enum: ActivityType,
    example: ActivityType.LETTER_MASTERED,
  })
  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  activityType: ActivityType;

  @ApiProperty({
    description: 'Severidad del evento',
    enum: ActivitySeverity,
    example: ActivitySeverity.SUCCESS,
  })
  @Column({
    type: 'enum',
    enum: ActivitySeverity,
    default: ActivitySeverity.INFO,
  })
  severity: ActivitySeverity;

  // ==================== DESCRIPCIÓN ====================

  @ApiProperty({
    description: 'Título corto del evento',
    example: 'Nueva letra dominada',
  })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({
    description: 'Descripción detallada del evento',
    example: 'El niño ha dominado la letra "A" en lectura',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  // ==================== METADATOS ====================

  @ApiProperty({
    description: 'Metadatos adicionales del evento',
  })
  @Column({ type: 'jsonb', default: {} })
  metadata: ActivityMetadata;

  // ==================== ESTADO ====================

  @ApiProperty({
    description: 'Indica si el padre ha visto este evento',
    default: false,
  })
  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @ApiProperty({
    description: 'Fecha en que se marcó como leído',
    nullable: true,
  })
  @Column({ type: 'timestamp', nullable: true })
  readAt: Date | null;

  // ==================== TIMESTAMPS ====================

  @CreateDateColumn()
  createdAt: Date;

  // ==================== MÉTODOS HELPER ====================

  /**
   * Marca el evento como leído
   */
  markAsRead(): void {
    this.isRead = true;
    this.readAt = new Date();
  }

  /**
   * Verifica si es un evento de alerta que requiere atención
   */
  isAlert(): boolean {
    return this.severity === ActivitySeverity.ALERT;
  }

  /**
   * Verifica si es un evento positivo (logro)
   */
  isPositive(): boolean {
    return [
      ActivityType.LETTER_MASTERED,
      ActivityType.SYLLABLE_MASTERED,
      ActivityType.WORD_MASTERED,
      ActivityType.LEVEL_UP,
      ActivityType.STREAK_MILESTONE,
      ActivityType.ACHIEVEMENT_UNLOCKED,
      ActivityType.PET_EVOLUTION,
      ActivityType.PET_ACCESSORY_UNLOCKED,
    ].includes(this.activityType);
  }

  constructor(partial: Partial<ActivityLog>) {
    Object.assign(this, partial);
  }
}
