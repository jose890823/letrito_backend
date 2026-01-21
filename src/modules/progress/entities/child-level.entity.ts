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
import { ChildProfile } from '../../children-profiles/entities/child-profile.entity';

@Entity('child_levels')
@Index(['childProfileId'], { unique: true })
export class ChildLevel {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID único del registro de nivel',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del perfil del niño',
  })
  @Column({ name: 'child_profile_id', type: 'uuid', unique: true })
  childProfileId: string;

  @OneToOne(() => ChildProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'child_profile_id' })
  childProfile: ChildProfile;

  // ============================================
  // NIVELES POR CATEGORÍA (1-5)
  // ============================================

  @ApiProperty({
    example: 3,
    description: 'Nivel de lectura de letras (1-5)',
  })
  @Column({ name: 'letters_reading_level', type: 'int', default: 1 })
  lettersReadingLevel: number;

  @ApiProperty({
    example: 2,
    description: 'Nivel de escritura de letras (1-5)',
  })
  @Column({ name: 'letters_writing_level', type: 'int', default: 1 })
  lettersWritingLevel: number;

  @ApiProperty({
    example: 2,
    description: 'Nivel de lectura de sílabas (1-5)',
  })
  @Column({ name: 'syllables_reading_level', type: 'int', default: 1 })
  syllablesReadingLevel: number;

  @ApiProperty({
    example: 1,
    description: 'Nivel de escritura de sílabas (1-5)',
  })
  @Column({ name: 'syllables_writing_level', type: 'int', default: 1 })
  syllablesWritingLevel: number;

  @ApiProperty({
    example: 1,
    description: 'Nivel de lectura de palabras (1-5)',
  })
  @Column({ name: 'words_reading_level', type: 'int', default: 1 })
  wordsReadingLevel: number;

  @ApiProperty({
    example: 1,
    description: 'Nivel de escritura de palabras (1-5)',
  })
  @Column({ name: 'words_writing_level', type: 'int', default: 1 })
  wordsWritingLevel: number;

  // ============================================
  // NIVEL GENERAL Y XP
  // ============================================

  @ApiProperty({
    example: 3,
    description: 'Nivel general del niño (1-10)',
  })
  @Column({ name: 'overall_level', type: 'int', default: 1 })
  overallLevel: number;

  @ApiProperty({
    example: 1250,
    description: 'Puntos de experiencia totales',
  })
  @Column({ name: 'total_xp', type: 'int', default: 0 })
  totalXp: number;

  // ============================================
  // CONTADORES DE ELEMENTOS DOMINADOS
  // ============================================

  @ApiProperty({
    example: 15,
    description: 'Número de letras dominadas (lectura + escritura)',
  })
  @Column({ name: 'letters_mastered', type: 'int', default: 0 })
  lettersMastered: number;

  @ApiProperty({
    example: 8,
    description: 'Número de sílabas dominadas',
  })
  @Column({ name: 'syllables_mastered', type: 'int', default: 0 })
  syllablesMastered: number;

  @ApiProperty({
    example: 3,
    description: 'Número de palabras dominadas',
  })
  @Column({ name: 'words_mastered', type: 'int', default: 0 })
  wordsMastered: number;

  // ============================================
  // TIMESTAMPS
  // ============================================

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ============================================
  // MÉTODOS HELPER
  // ============================================

  /**
   * Calcula el promedio de todos los niveles
   */
  get averageLevel(): number {
    const levels = [
      this.lettersReadingLevel,
      this.lettersWritingLevel,
      this.syllablesReadingLevel,
      this.syllablesWritingLevel,
      this.wordsReadingLevel,
      this.wordsWritingLevel,
    ];
    return (
      Math.round((levels.reduce((a, b) => a + b, 0) / levels.length) * 10) / 10
    );
  }

  /**
   * Obtiene el total de elementos dominados
   */
  get totalMastered(): number {
    return this.lettersMastered + this.syllablesMastered + this.wordsMastered;
  }

  constructor(partial: Partial<ChildLevel>) {
    Object.assign(this, partial);
  }
}
