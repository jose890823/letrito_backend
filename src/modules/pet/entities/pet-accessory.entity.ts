import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Tipo de accesorio
 */
export enum AccessoryType {
  HAT = 'hat', // Sombreros
  GLASSES = 'glasses', // Lentes
  COLLAR = 'collar', // Collares
  BACKGROUND = 'background', // Fondos
  OUTFIT = 'outfit', // Trajes/ropa
  TOY = 'toy', // Juguetes
}

/**
 * Tipo de requisito para desbloquear
 */
export enum UnlockRequirementType {
  LEVEL = 'level', // Nivel de mascota
  LETTERS_MASTERED = 'letters_mastered', // Letras dominadas
  SYLLABLES_MASTERED = 'syllables_mastered', // Sílabas dominadas
  WORDS_MASTERED = 'words_mastered', // Palabras dominadas
  EVOLUTION_STAGE = 'evolution_stage', // Etapa de evolución
  STREAK_DAYS = 'streak_days', // Días de racha
  TOTAL_XP = 'total_xp', // XP total acumulado
  FREE = 'free', // Gratis desde el inicio
}

/**
 * Rareza del accesorio
 */
export enum AccessoryRarity {
  COMMON = 'common', // Común
  UNCOMMON = 'uncommon', // Poco común
  RARE = 'rare', // Raro
  EPIC = 'epic', // Épico
  LEGENDARY = 'legendary', // Legendario
}

/**
 * Entidad de accesorios para la mascota
 */
@Entity('pet_accessories')
@Index(['type'])
@Index(['rarity'])
@Index(['isActive'])
export class PetAccessory {
  @ApiProperty({ description: 'ID único del accesorio' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nombre del accesorio',
    example: 'Gorro de Graduación',
  })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ description: 'Descripción del accesorio' })
  @Column({ type: 'varchar', length: 255 })
  description: string;

  @ApiProperty({
    description: 'Tipo de accesorio',
    enum: AccessoryType,
    example: AccessoryType.HAT,
  })
  @Column({ type: 'enum', enum: AccessoryType })
  type: AccessoryType;

  @ApiProperty({
    description: 'Rareza del accesorio',
    enum: AccessoryRarity,
    example: AccessoryRarity.COMMON,
  })
  @Column({
    type: 'enum',
    enum: AccessoryRarity,
    default: AccessoryRarity.COMMON,
  })
  rarity: AccessoryRarity;

  @ApiProperty({ description: 'URL de la imagen del accesorio' })
  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  @ApiProperty({ description: 'Identificador del asset en la app' })
  @Column({ type: 'varchar', length: 100 })
  assetId: string;

  @ApiProperty({
    description: 'Tipo de requisito para desbloquear',
    enum: UnlockRequirementType,
  })
  @Column({
    type: 'enum',
    enum: UnlockRequirementType,
    default: UnlockRequirementType.LEVEL,
  })
  unlockRequirementType: UnlockRequirementType;

  @ApiProperty({
    description: 'Valor del requisito (ej: nivel 5, 10 letras)',
    example: 5,
  })
  @Column({ type: 'int', default: 1 })
  unlockRequirementValue: number;

  @ApiProperty({
    description: 'Mensaje de desbloqueo',
    example: 'Domina 5 letras para desbloquear',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  unlockMessage: string | null;

  @ApiProperty({ description: 'Orden de visualización' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiProperty({ description: 'Si el accesorio está activo' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Constructor
  constructor(partial: Partial<PetAccessory>) {
    Object.assign(this, partial);
  }

  /**
   * Verifica si el accesorio está desbloqueado según el progreso
   */
  isUnlocked(progress: {
    petLevel?: number;
    lettersMastered?: number;
    syllablesMastered?: number;
    wordsMastered?: number;
    evolutionStage?: string;
    streakDays?: number;
    totalXp?: number;
  }): boolean {
    switch (this.unlockRequirementType) {
      case UnlockRequirementType.FREE:
        return true;
      case UnlockRequirementType.LEVEL:
        return (progress.petLevel ?? 0) >= this.unlockRequirementValue;
      case UnlockRequirementType.LETTERS_MASTERED:
        return (progress.lettersMastered ?? 0) >= this.unlockRequirementValue;
      case UnlockRequirementType.SYLLABLES_MASTERED:
        return (progress.syllablesMastered ?? 0) >= this.unlockRequirementValue;
      case UnlockRequirementType.WORDS_MASTERED:
        return (progress.wordsMastered ?? 0) >= this.unlockRequirementValue;
      case UnlockRequirementType.STREAK_DAYS:
        return (progress.streakDays ?? 0) >= this.unlockRequirementValue;
      case UnlockRequirementType.TOTAL_XP:
        return (progress.totalXp ?? 0) >= this.unlockRequirementValue;
      default:
        return false;
    }
  }
}
