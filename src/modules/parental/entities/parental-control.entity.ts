import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { ChildProfile } from '../../children-profiles/entities/child-profile.entity';

/**
 * Días de la semana permitidos
 */
export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

/**
 * Rango de tiempo permitido
 */
export interface TimeRange {
  start: string; // HH:mm format (ej: "08:00")
  end: string; // HH:mm format (ej: "20:00")
}

/**
 * Horario por día de la semana
 */
export interface DaySchedule {
  day: DayOfWeek;
  enabled: boolean;
  timeRanges: TimeRange[];
}

/**
 * Configuración de notificaciones para padres
 */
export interface NotificationSettings {
  onSessionStart: boolean;
  onSessionEnd: boolean;
  onDailyLimitReached: boolean;
  onWeeklyLimitReached: boolean;
  onAchievementUnlocked: boolean;
  onNewLetterMastered: boolean;
  onStreakMilestone: boolean;
  dailySummary: boolean;
  weeklySummary: boolean;
}

/**
 * Entidad para configuración de control parental por niño
 * Relación 1:1 con ChildProfile
 */
@Entity('parental_controls')
@Index(['childProfileId'], { unique: true })
export class ParentalControl {
  @ApiProperty({ description: 'ID único del control parental' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ==================== RELACIÓN ====================

  @OneToOne(() => ChildProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'childProfileId' })
  childProfile: ChildProfile;

  @Column({ type: 'uuid' })
  childProfileId: string;

  // ==================== PIN PARENTAL ====================

  @ApiProperty({ description: 'Indica si el PIN parental está configurado' })
  @Column({ type: 'boolean', default: false })
  pinEnabled: boolean;

  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: true })
  pinHash: string | null;

  @Column({ type: 'int', default: 0 })
  pinAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  pinLockedUntil: Date | null;

  // ==================== LÍMITES DE TIEMPO ====================

  @ApiProperty({
    description: 'Límite diario en minutos (null = sin límite)',
    example: 60,
    nullable: true,
  })
  @Column({ type: 'int', nullable: true })
  dailyTimeLimitMinutes: number | null;

  @ApiProperty({
    description: 'Límite semanal en minutos (null = sin límite)',
    example: 300,
    nullable: true,
  })
  @Column({ type: 'int', nullable: true })
  weeklyTimeLimitMinutes: number | null;

  @ApiProperty({
    description: 'Duración máxima de sesión continua en minutos',
    example: 30,
    nullable: true,
  })
  @Column({ type: 'int', nullable: true })
  maxSessionDurationMinutes: number | null;

  @ApiProperty({
    description: 'Tiempo de descanso obligatorio entre sesiones (minutos)',
    example: 15,
    nullable: true,
  })
  @Column({ type: 'int', nullable: true })
  breakDurationMinutes: number | null;

  // ==================== HORARIOS ====================

  @ApiProperty({
    description: 'Horario semanal con rangos de tiempo permitidos',
    type: 'array',
  })
  @Column({ type: 'jsonb', default: [] })
  weeklySchedule: DaySchedule[];

  @ApiProperty({
    description:
      'Si true, bloquea el acceso fuera de horario; si false, solo advierte',
    default: false,
  })
  @Column({ type: 'boolean', default: false })
  strictScheduleEnforcement: boolean;

  // ==================== NOTIFICACIONES ====================

  @ApiProperty({ description: 'Configuración de notificaciones' })
  @Column({
    type: 'jsonb',
    default: {
      onSessionStart: false,
      onSessionEnd: false,
      onDailyLimitReached: true,
      onWeeklyLimitReached: true,
      onAchievementUnlocked: true,
      onNewLetterMastered: true,
      onStreakMilestone: true,
      dailySummary: true,
      weeklySummary: true,
    },
  })
  notifications: NotificationSettings;

  // ==================== RESTRICCIONES DE CONTENIDO ====================

  @ApiProperty({
    description: 'Permite interacción con la mascota',
    default: true,
  })
  @Column({ type: 'boolean', default: true })
  allowPetInteraction: boolean;

  @ApiProperty({
    description: 'Permite cambiar configuración del perfil',
    default: false,
  })
  @Column({ type: 'boolean', default: false })
  allowProfileChanges: boolean;

  // ==================== TIMESTAMPS ====================

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ==================== MÉTODOS HELPER ====================

  /**
   * Verifica si el PIN está bloqueado por intentos fallidos
   */
  isPinLocked(): boolean {
    if (!this.pinLockedUntil) return false;
    return new Date() < this.pinLockedUntil;
  }

  /**
   * Verifica si el acceso está permitido según el horario
   */
  isWithinSchedule(date: Date = new Date()): boolean {
    if (this.weeklySchedule.length === 0) return true;

    const days: DayOfWeek[] = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];

    const currentDay = days[date.getDay()];
    const currentTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    const daySchedule = this.weeklySchedule.find((s) => s.day === currentDay);
    if (!daySchedule || !daySchedule.enabled) return false;

    return daySchedule.timeRanges.some((range) => {
      return currentTime >= range.start && currentTime <= range.end;
    });
  }

  /**
   * Obtiene el tiempo restante del día en minutos
   */
  getRemainingDailyTime(usedMinutes: number): number | null {
    if (this.dailyTimeLimitMinutes === null) return null;
    return Math.max(0, this.dailyTimeLimitMinutes - usedMinutes);
  }

  /**
   * Verifica si se excedió el límite diario
   */
  isDailyLimitExceeded(usedMinutes: number): boolean {
    if (this.dailyTimeLimitMinutes === null) return false;
    return usedMinutes >= this.dailyTimeLimitMinutes;
  }

  constructor(partial: Partial<ParentalControl>) {
    Object.assign(this, partial);
  }
}
