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
 * Etapa de evolución de la mascota
 */
export enum EvolutionStage {
  EGG = 'egg', // Huevo - inicial
  BABY = 'baby', // Bebé - primeras letras
  CHILD = 'child', // Niño - sílabas
  TEEN = 'teen', // Adolescente - palabras
  ADULT = 'adult', // Adulto - dominio completo
}

/**
 * Estado de ánimo de la mascota
 */
export enum PetMood {
  ECSTATIC = 'ecstatic', // Extático (90-100 felicidad)
  HAPPY = 'happy', // Feliz (70-89)
  CONTENT = 'content', // Contento (50-69)
  SAD = 'sad', // Triste (30-49)
  VERY_SAD = 'very_sad', // Muy triste (0-29)
}

/**
 * Entidad principal de la mascota virtual
 * Relación 1:1 con ChildProfile
 */
@Entity('pets')
@Index(['childProfileId'], { unique: true })
export class Pet {
  @ApiProperty({ description: 'ID único de la mascota' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID del perfil del niño' })
  @Column({ type: 'uuid' })
  childProfileId: string;

  @ManyToOne(() => ChildProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'childProfileId' })
  childProfile: ChildProfile;

  @ApiProperty({ description: 'Nombre de la mascota', example: 'Letrito' })
  @Column({ type: 'varchar', length: 50, default: 'Letrito' })
  name: string;

  @ApiProperty({ description: 'Nivel de la mascota (1-20)', example: 1 })
  @Column({ type: 'int', default: 1 })
  level: number;

  @ApiProperty({ description: 'Experiencia actual', example: 0 })
  @Column({ type: 'int', default: 0 })
  experience: number;

  @ApiProperty({ description: 'Experiencia necesaria para siguiente nivel' })
  @Column({ type: 'int', default: 100 })
  experienceToNextLevel: number;

  @ApiProperty({
    description: 'Etapa de evolución',
    enum: EvolutionStage,
    example: EvolutionStage.EGG,
  })
  @Column({
    type: 'enum',
    enum: EvolutionStage,
    default: EvolutionStage.EGG,
  })
  evolutionStage: EvolutionStage;

  @ApiProperty({ description: 'Felicidad (0-100)', example: 100 })
  @Column({ type: 'int', default: 100 })
  happiness: number;

  @ApiProperty({ description: 'Energía (0-100)', example: 100 })
  @Column({ type: 'int', default: 100 })
  energy: number;

  @ApiProperty({
    description: 'Hambre (0-100, 0=lleno, 100=hambriento)',
    example: 0,
  })
  @Column({ type: 'int', default: 0 })
  hunger: number;

  @ApiProperty({
    description: 'Color/variante de la mascota',
    example: 'orange',
  })
  @Column({ type: 'varchar', length: 50, default: 'orange' })
  variant: string;

  @ApiProperty({
    description: 'Accesorios equipados actualmente',
    example: { hat: 'accessory-uuid', glasses: 'accessory-uuid' },
  })
  @Column({ type: 'jsonb', default: {} })
  equippedAccessories: Record<string, string>; // { hat: 'accessory_id', glasses: 'accessory_id' }

  @ApiProperty({
    description: 'IDs de accesorios desbloqueados',
    type: [String],
  })
  @Column({ type: 'jsonb', default: [] })
  unlockedAccessoryIds: string[];

  @ApiProperty({ description: 'Última vez que se alimentó' })
  @Column({ type: 'timestamp', nullable: true })
  lastFedAt: Date | null;

  @ApiProperty({ description: 'Última vez que jugó' })
  @Column({ type: 'timestamp', nullable: true })
  lastPlayedAt: Date | null;

  @ApiProperty({ description: 'Última interacción general' })
  @Column({ type: 'timestamp', nullable: true })
  lastInteractionAt: Date | null;

  @ApiProperty({ description: 'Total de veces alimentado' })
  @Column({ type: 'int', default: 0 })
  totalTimesFed: number;

  @ApiProperty({ description: 'Total de veces jugado' })
  @Column({ type: 'int', default: 0 })
  totalTimesPlayed: number;

  @ApiProperty({ description: 'Racha de días consecutivos de interacción' })
  @Column({ type: 'int', default: 0 })
  interactionStreak: number;

  @ApiProperty({ description: 'Mejor racha de interacción' })
  @Column({ type: 'int', default: 0 })
  bestInteractionStreak: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Constructor
  constructor(partial: Partial<Pet>) {
    Object.assign(this, partial);
  }

  /**
   * Calcula el estado de ánimo basado en felicidad
   */
  getMood(): PetMood {
    if (this.happiness >= 90) return PetMood.ECSTATIC;
    if (this.happiness >= 70) return PetMood.HAPPY;
    if (this.happiness >= 50) return PetMood.CONTENT;
    if (this.happiness >= 30) return PetMood.SAD;
    return PetMood.VERY_SAD;
  }

  /**
   * Verifica si la mascota necesita atención
   */
  needsAttention(): boolean {
    return this.happiness < 50 || this.hunger > 50 || this.energy < 30;
  }

  /**
   * Verifica si puede evolucionar
   */
  canEvolve(
    lettersmastered: number,
    syllablesMastered: number,
    wordsMastered: number,
  ): boolean {
    switch (this.evolutionStage) {
      case EvolutionStage.EGG:
        return lettersmastered >= 3; // 3 letras para salir del huevo
      case EvolutionStage.BABY:
        return lettersmastered >= 10; // 10 letras para crecer
      case EvolutionStage.CHILD:
        return syllablesMastered >= 10; // 10 sílabas
      case EvolutionStage.TEEN:
        return wordsMastered >= 20; // 20 palabras
      case EvolutionStage.ADULT:
        return false; // Ya está en máxima evolución
      default:
        return false;
    }
  }
}
