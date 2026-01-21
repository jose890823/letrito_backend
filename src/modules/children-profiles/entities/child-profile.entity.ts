import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../auth/entities/user.entity';

/**
 * Configuración individual del perfil de niño
 */
export interface ChildSettings {
  /** Límite diario en minutos (null = sin límite) */
  dailyTimeLimit?: number;
  /** Horas permitidas para jugar */
  allowedHours?: {
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
  /** Sonidos habilitados */
  soundEnabled: boolean;
  /** Text-to-speech habilitado */
  ttsEnabled: boolean;
  /** Música de fondo habilitada */
  musicEnabled: boolean;
  /** Vibraciones habilitadas */
  hapticEnabled: boolean;
}

/**
 * Valores por defecto para la configuración del niño
 */
export const DEFAULT_CHILD_SETTINGS: ChildSettings = {
  dailyTimeLimit: undefined,
  allowedHours: undefined,
  soundEnabled: true,
  ttsEnabled: true,
  musicEnabled: true,
  hapticEnabled: true,
};

@Entity('child_profiles')
@Index(['parentId'])
@Index(['parentId', 'name'])
export class ChildProfile {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID único del perfil del niño',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Sofía',
    description: 'Nombre del niño',
  })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({
    example: 'avatar_01',
    description: 'Identificador del avatar seleccionado',
    nullable: true,
  })
  @Column({ type: 'varchar', length: 50, nullable: true })
  avatarId: string | null;

  @ApiProperty({
    example: 'https://storage.letrito.app/avatars/custom/abc123.png',
    description: 'URL del avatar personalizado (si aplica)',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  avatarUrl: string | null;

  @ApiProperty({
    example: '2019-05-15',
    description: 'Fecha de nacimiento del niño',
    nullable: true,
  })
  @Column({ type: 'date', nullable: true })
  birthDate: Date | null;

  @ApiProperty({
    example: 5,
    description: 'Edad del niño (calculada o ingresada manualmente)',
    nullable: true,
  })
  @Column({ type: 'int', nullable: true })
  age: number | null;

  @ApiProperty({
    description: 'Configuración personalizada del perfil',
    example: {
      dailyTimeLimit: 30,
      allowedHours: { start: '08:00', end: '20:00' },
      soundEnabled: true,
      ttsEnabled: true,
      musicEnabled: true,
      hapticEnabled: true,
    },
  })
  @Column({ type: 'jsonb', default: DEFAULT_CHILD_SETTINGS })
  settings: ChildSettings;

  @ApiProperty({
    example: true,
    description: 'Si el perfil está activo',
  })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({
    example: '2025-01-20T10:30:00.000Z',
    description: 'Última vez que el niño jugó',
    nullable: true,
  })
  @Column({ type: 'timestamp', nullable: true })
  lastPlayedAt: Date | null;

  // ============================================
  // RELACIONES
  // ============================================

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent: User;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del padre/tutor',
  })
  @Column({ name: 'parent_id' })
  parentId: string;

  // ============================================
  // TIMESTAMPS
  // ============================================

  @ApiProperty({
    description: 'Fecha de creación del perfil',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  // ============================================
  // MÉTODOS HELPER
  // ============================================

  /**
   * Calcula la edad basada en la fecha de nacimiento
   */
  get calculatedAge(): number | null {
    if (!this.birthDate) return this.age;

    const today = new Date();
    const birth = new Date(this.birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  }

  /**
   * Constructor parcial para inicialización
   */
  constructor(partial: Partial<ChildProfile>) {
    Object.assign(this, partial);
  }
}
