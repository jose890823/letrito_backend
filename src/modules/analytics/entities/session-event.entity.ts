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
 * Tipos de eventos de sesión
 */
export enum EventType {
  // Eventos de sesión
  SESSION_START = 'SESSION_START',
  SESSION_END = 'SESSION_END',
  SESSION_PAUSE = 'SESSION_PAUSE',
  SESSION_RESUME = 'SESSION_RESUME',

  // Eventos de nivel
  LEVEL_START = 'LEVEL_START',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  LEVEL_FAILED = 'LEVEL_FAILED',
  LEVEL_RETRY = 'LEVEL_RETRY',

  // Eventos de letra
  LETTER_STARTED = 'LETTER_STARTED',
  LETTER_COMPLETE = 'LETTER_COMPLETE',

  // Eventos de ejercicio
  EXERCISE_CORRECT = 'EXERCISE_CORRECT',
  EXERCISE_INCORRECT = 'EXERCISE_INCORRECT',
  EXERCISE_HINT_USED = 'EXERCISE_HINT_USED',

  // Eventos de mascota
  PET_INTERACTION = 'PET_INTERACTION',
  PET_EVOLVED = 'PET_EVOLVED',
  PET_ACCESSORY_EQUIPPED = 'PET_ACCESSORY_EQUIPPED',

  // Eventos de minijuegos
  MINIGAME_STARTED = 'MINIGAME_STARTED',
  MINIGAME_COMPLETED = 'MINIGAME_COMPLETED',

  // Eventos de logros
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  STREAK_MILESTONE = 'STREAK_MILESTONE',

  // Otros eventos
  APP_OPENED = 'APP_OPENED',
  APP_CLOSED = 'APP_CLOSED',
  PROFILE_SWITCHED = 'PROFILE_SWITCHED',
}

/**
 * Metadatos de evento de sesión
 */
export interface SessionEventMetadata {
  /** Letra relacionada */
  letter?: string;
  /** Número de nivel */
  levelNumber?: number;
  /** Estrellas ganadas */
  stars?: number;
  /** Tiempo empleado en ms */
  timeSpentMs?: number;
  /** Intentos realizados */
  attempts?: number;
  /** Pistas usadas */
  hintsUsed?: number;
  /** Tipo de interacción con mascota */
  petInteractionType?: string;
  /** ID del accesorio */
  accessoryId?: string;
  /** Nombre del logro */
  achievementName?: string;
  /** Valor de racha */
  streakValue?: number;
  /** Nombre del minijuego */
  minigameName?: string;
  /** Puntuación */
  score?: number;
  /** Información adicional */
  extra?: Record<string, any>;
}

/**
 * Entidad para registrar eventos de sesión
 *
 * Almacena eventos individuales durante el uso de la app
 * para análisis detallado del comportamiento del niño.
 */
@Entity('session_events')
@Index(['childProfileId', 'timestamp'])
@Index(['childProfileId', 'eventType'])
@Index(['timestamp'])
export class SessionEvent {
  @ApiProperty({ description: 'ID único del evento' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID del perfil del niño' })
  @Column({ name: 'child_profile_id', type: 'uuid' })
  childProfileId: string;

  @ManyToOne(() => ChildProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'child_profile_id' })
  childProfile: ChildProfile;

  @ApiProperty({
    description: 'Tipo de evento',
    enum: EventType,
    example: EventType.LEVEL_COMPLETE,
  })
  @Column({
    type: 'varchar',
    length: 50,
  })
  eventType: EventType;

  @ApiProperty({
    description: 'Metadatos adicionales del evento',
    example: { letter: 'A', levelNumber: 5, stars: 3 },
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata: SessionEventMetadata | null;

  @ApiProperty({ description: 'Timestamp del evento' })
  @Column({ type: 'timestamp with time zone' })
  timestamp: Date;

  @ApiProperty({ description: 'ID de sesión (para agrupar eventos)' })
  @Column({ name: 'session_id', type: 'varchar', length: 50, nullable: true })
  sessionId: string | null;

  @ApiProperty({ description: 'Fecha de creación del registro' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  constructor(partial: Partial<SessionEvent>) {
    Object.assign(this, partial);
  }
}
