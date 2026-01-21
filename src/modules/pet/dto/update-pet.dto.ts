import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * DTO para actualizar nombre de la mascota
 */
export class UpdatePetNameDto {
  @ApiProperty({
    description: 'Nuevo nombre para la mascota',
    example: 'Zorrito',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede tener más de 50 caracteres' })
  name: string;
}

/**
 * DTO para cambiar variante de la mascota
 */
export class UpdatePetVariantDto {
  @ApiProperty({
    description: 'ID de la variante de color',
    example: 'orange',
  })
  @IsString({ message: 'La variante debe ser texto' })
  variant: string;
}

/**
 * DTO para equipar accesorio
 */
export class EquipAccessoryDto {
  @ApiProperty({
    description: 'ID del accesorio a equipar',
    example: 'uuid-accesorio',
  })
  @IsString({ message: 'El ID del accesorio es requerido' })
  accessoryId: string;
}

/**
 * DTO para desequipar accesorio por tipo
 */
export class UnequipAccessoryDto {
  @ApiProperty({
    description: 'Tipo de accesorio a desequipar',
    example: 'hat',
  })
  @IsString({ message: 'El tipo de accesorio es requerido' })
  accessoryType: string;
}
