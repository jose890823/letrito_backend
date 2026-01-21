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
import { User } from '../../auth/entities/user.entity';

@Entity('streaks')
@Index(['userId'], { unique: true })
export class Streak {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID unico del streak',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del usuario',
  })
  @Column({ type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({
    example: 5,
    description: 'Racha actual en dias',
  })
  @Column({ type: 'int', default: 0 })
  currentStreak: number;

  @ApiProperty({
    example: 15,
    description: 'Racha mas larga alcanzada',
  })
  @Column({ type: 'int', default: 0 })
  longestStreak: number;

  @ApiProperty({
    example: '2025-01-15',
    description: 'Ultima fecha de actividad',
  })
  @Column({ type: 'date', nullable: true })
  lastActiveDate: string | null;

  @ApiProperty({
    example: '2025-01-10',
    description: 'Fecha de inicio de la racha actual',
  })
  @Column({ type: 'date', nullable: true })
  streakStartDate: string | null;

  @ApiProperty({
    example: 30,
    description: 'Total de dias activos historico',
  })
  @Column({ type: 'int', default: 0 })
  totalDaysActive: number;

  @ApiProperty({
    description: 'Fecha de creacion',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de actualizacion',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  constructor(partial: Partial<Streak>) {
    Object.assign(this, partial);
  }
}
