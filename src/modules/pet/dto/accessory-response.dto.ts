import { ApiProperty } from '@nestjs/swagger';
import {
  AccessoryType,
  AccessoryRarity,
  UnlockRequirementType,
} from '../entities/pet-accessory.entity';

/**
 * DTO de respuesta para accesorio
 */
export class AccessoryResponseDto {
  @ApiProperty({ description: 'ID del accesorio' })
  id: string;

  @ApiProperty({
    description: 'Nombre del accesorio',
    example: 'Gorro de Graduación',
  })
  name: string;

  @ApiProperty({ description: 'Descripción' })
  description: string;

  @ApiProperty({ description: 'Tipo de accesorio', enum: AccessoryType })
  type: AccessoryType;

  @ApiProperty({ description: 'Rareza', enum: AccessoryRarity })
  rarity: AccessoryRarity;

  @ApiProperty({ description: 'ID del asset en la app' })
  assetId: string;

  @ApiProperty({ description: 'URL de imagen', nullable: true })
  imageUrl: string | null;

  @ApiProperty({
    description: 'Tipo de requisito',
    enum: UnlockRequirementType,
  })
  unlockRequirementType: UnlockRequirementType;

  @ApiProperty({ description: 'Valor del requisito', example: 10 })
  unlockRequirementValue: number;

  @ApiProperty({ description: 'Mensaje de desbloqueo' })
  unlockMessage: string | null;

  @ApiProperty({
    description: '¿Está desbloqueado para este niño?',
    example: true,
  })
  isUnlocked: boolean;

  @ApiProperty({ description: '¿Está actualmente equipado?', example: false })
  isEquipped: boolean;

  @ApiProperty({
    description: 'Progreso hacia desbloqueo (0-100)',
    example: 75,
  })
  unlockProgress: number;
}

/**
 * Lista de accesorios agrupados por tipo
 */
export class AccessoriesByTypeDto {
  @ApiProperty({ description: 'Sombreros', type: [AccessoryResponseDto] })
  hat: AccessoryResponseDto[];

  @ApiProperty({ description: 'Lentes', type: [AccessoryResponseDto] })
  glasses: AccessoryResponseDto[];

  @ApiProperty({ description: 'Collares', type: [AccessoryResponseDto] })
  collar: AccessoryResponseDto[];

  @ApiProperty({ description: 'Fondos', type: [AccessoryResponseDto] })
  background: AccessoryResponseDto[];

  @ApiProperty({ description: 'Trajes', type: [AccessoryResponseDto] })
  outfit: AccessoryResponseDto[];

  @ApiProperty({ description: 'Juguetes', type: [AccessoryResponseDto] })
  toy: AccessoryResponseDto[];
}

/**
 * Resumen de accesorios del niño
 */
export class AccessorySummaryDto {
  @ApiProperty({ description: 'Total de accesorios disponibles', example: 20 })
  totalAccessories: number;

  @ApiProperty({ description: 'Accesorios desbloqueados', example: 8 })
  unlockedCount: number;

  @ApiProperty({ description: 'Accesorios equipados', example: 3 })
  equippedCount: number;

  @ApiProperty({ description: 'Porcentaje de colección', example: 40 })
  collectionPercentage: number;

  @ApiProperty({ description: 'Próximo accesorio a desbloquear' })
  nextToUnlock: AccessoryResponseDto | null;
}
