import { ApiProperty } from '@nestjs/swagger';
import { EvolutionStage, PetMood } from '../entities/pet.entity';

/**
 * Resultado de una interacción con la mascota
 */
export class InteractionResultDto {
  @ApiProperty({ description: 'Si la interacción fue exitosa' })
  success: boolean;

  @ApiProperty({ description: 'Mensaje de la mascota' })
  message: string;

  @ApiProperty({ description: 'XP ganado', example: 10 })
  experienceGained: number;

  @ApiProperty({ description: 'Cambio en felicidad', example: 15 })
  happinessChange: number;

  @ApiProperty({ description: 'Cambio en energía', example: -10 })
  energyChange: number;

  @ApiProperty({ description: 'Cambio en hambre', example: -30 })
  hungerChange: number;

  @ApiProperty({ description: 'Nueva felicidad', example: 90 })
  newHappiness: number;

  @ApiProperty({ description: 'Nueva energía', example: 70 })
  newEnergy: number;

  @ApiProperty({ description: 'Nuevo hambre', example: 10 })
  newHunger: number;

  @ApiProperty({ description: 'Nuevo estado de ánimo', enum: PetMood })
  newMood: PetMood;

  @ApiProperty({ description: 'Si subió de nivel', example: false })
  leveledUp: boolean;

  @ApiProperty({ description: 'Nuevo nivel (si subió)', example: 5 })
  newLevel: number | null;

  @ApiProperty({ description: 'Si evolucionó', example: false })
  evolved: boolean;

  @ApiProperty({
    description: 'Nueva etapa de evolución',
    enum: EvolutionStage,
  })
  newEvolutionStage: EvolutionStage | null;

  @ApiProperty({ description: 'Mensaje de evolución', example: null })
  evolutionMessage: string | null;

  @ApiProperty({ description: 'Accesorios nuevos desbloqueados' })
  newAccessoriesUnlocked: string[];

  @ApiProperty({
    description: 'Cooldown en minutos hasta próxima interacción',
    example: 30,
  })
  cooldownMinutes: number;
}

/**
 * Resultado de alimentar a la mascota
 */
export class FeedResultDto extends InteractionResultDto {
  @ApiProperty({ description: 'Tipo de interacción', example: 'feed' })
  interactionType: 'feed';
}

/**
 * Resultado de jugar con la mascota
 */
export class PlayResultDto extends InteractionResultDto {
  @ApiProperty({ description: 'Tipo de interacción', example: 'play' })
  interactionType: 'play';
}

/**
 * Resultado de acariciar a la mascota
 */
export class PetResultDto extends InteractionResultDto {
  @ApiProperty({ description: 'Tipo de interacción', example: 'pet' })
  interactionType: 'pet';
}
