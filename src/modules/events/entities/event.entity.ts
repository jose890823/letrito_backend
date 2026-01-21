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
import { User } from '../../auth/entities/user.entity';

export enum EventType {
  // Onboarding
  ONBOARDING_STARTED = 'onboarding_started',
  ONBOARDING_NICHE_SELECTED = 'onboarding_niche_selected',
  ONBOARDING_PLATFORM_SELECTED = 'onboarding_platform_selected',
  ONBOARDING_COMPLETED = 'onboarding_completed',

  // Generations
  GENERATION_CREATED = 'generation_created',
  GENERATION_VIEWED = 'generation_viewed',
  GENERATION_USED = 'generation_used',

  // Streaks
  STREAK_CHECK_IN = 'streak_check_in',
  STREAK_BROKEN = 'streak_broken',
  STREAK_MILESTONE = 'streak_milestone',

  // Subscription
  SUBSCRIPTION_STARTED = 'subscription_started',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled',
  SUBSCRIPTION_RENEWED = 'subscription_renewed',
  TRIAL_STARTED = 'trial_started',
  TRIAL_ENDED = 'trial_ended',

  // User
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  PROFILE_UPDATED = 'profile_updated',
}

@Entity('events')
@Index(['userId', 'createdAt'])
@Index(['eventType', 'createdAt'])
@Index(['createdAt'])
export class Event {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID unico del evento',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del usuario',
  })
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({
    example: 'generation_created',
    description: 'Tipo de evento',
    enum: EventType,
  })
  @Column({
    type: 'enum',
    enum: EventType,
  })
  eventType: EventType;

  @ApiProperty({
    example: { generationId: '123', nicheId: '456' },
    description: 'Metadata adicional del evento',
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @ApiProperty({
    description: 'Fecha del evento',
  })
  @CreateDateColumn()
  createdAt: Date;

  constructor(partial: Partial<Event>) {
    Object.assign(this, partial);
  }
}
