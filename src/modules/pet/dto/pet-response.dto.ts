import { ApiProperty } from '@nestjs/swagger';
import { EvolutionStage, PetMood } from '../entities/pet.entity';

/**
 * DTO de respuesta para la mascota
 */
export class PetResponseDto {
  @ApiProperty({ description: 'ID de la mascota' })
  id: string;

  @ApiProperty({ description: 'ID del perfil del niño' })
  childProfileId: string;

  @ApiProperty({ description: 'Nombre de la mascota', example: 'Letrito' })
  name: string;

  @ApiProperty({ description: 'Nivel actual', example: 5 })
  level: number;

  @ApiProperty({ description: 'Experiencia actual', example: 450 })
  experience: number;

  @ApiProperty({ description: 'XP para siguiente nivel', example: 250 })
  experienceToNextLevel: number;

  @ApiProperty({
    description: 'Progreso hacia siguiente nivel (0-100)',
    example: 60,
  })
  levelProgress: number;

  @ApiProperty({
    description: 'Etapa de evolución',
    enum: EvolutionStage,
    example: EvolutionStage.CHILD,
  })
  evolutionStage: EvolutionStage;

  @ApiProperty({ description: 'Felicidad (0-100)', example: 85 })
  happiness: number;

  @ApiProperty({ description: 'Energía (0-100)', example: 70 })
  energy: number;

  @ApiProperty({ description: 'Hambre (0-100)', example: 20 })
  hunger: number;

  @ApiProperty({
    description: 'Estado de ánimo actual',
    enum: PetMood,
    example: PetMood.HAPPY,
  })
  mood: PetMood;

  @ApiProperty({ description: 'Variante de color', example: 'orange' })
  variant: string;

  @ApiProperty({ description: 'Accesorios equipados' })
  equippedAccessories: Record<string, string>;

  @ApiProperty({ description: '¿Necesita atención?', example: false })
  needsAttention: boolean;

  @ApiProperty({ description: '¿Puede alimentarse?', example: true })
  canFeed: boolean;

  @ApiProperty({ description: '¿Puede jugar?', example: true })
  canPlay: boolean;

  @ApiProperty({ description: 'Minutos hasta poder alimentar', example: 0 })
  minutesUntilCanFeed: number;

  @ApiProperty({ description: 'Minutos hasta poder jugar', example: 0 })
  minutesUntilCanPlay: number;

  @ApiProperty({ description: 'Racha de interacción', example: 5 })
  interactionStreak: number;

  @ApiProperty({ description: 'Última interacción' })
  lastInteractionAt: string | null;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: string;
}

/**
 * DTO resumido de mascota (para listas)
 */
export class PetSummaryDto {
  @ApiProperty({ description: 'ID de la mascota' })
  id: string;

  @ApiProperty({ description: 'Nombre', example: 'Letrito' })
  name: string;

  @ApiProperty({ description: 'Nivel', example: 5 })
  level: number;

  @ApiProperty({ description: 'Etapa de evolución', enum: EvolutionStage })
  evolutionStage: EvolutionStage;

  @ApiProperty({ description: 'Estado de ánimo', enum: PetMood })
  mood: PetMood;

  @ApiProperty({ description: '¿Necesita atención?' })
  needsAttention: boolean;
}
