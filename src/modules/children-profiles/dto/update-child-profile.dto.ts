import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsBoolean,
} from 'class-validator';

export class UpdateChildProfileDto {
  @ApiPropertyOptional({
    example: 'Sofía María',
    description: 'Nombre del niño',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name?: string;

  @ApiPropertyOptional({
    example: 'avatar_02',
    description: 'Identificador del avatar seleccionado',
  })
  @IsOptional()
  @IsString({ message: 'El avatarId debe ser texto' })
  @MaxLength(50, { message: 'El avatarId no puede exceder 50 caracteres' })
  avatarId?: string;

  @ApiPropertyOptional({
    example: 'https://storage.letrito.app/avatars/custom/abc123.png',
    description: 'URL del avatar personalizado',
  })
  @IsOptional()
  @IsString({ message: 'El avatarUrl debe ser texto' })
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: '2019-05-15',
    description: 'Fecha de nacimiento del niño (formato YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'La fecha de nacimiento debe tener formato válido (YYYY-MM-DD)',
    },
  )
  birthDate?: string;

  @ApiPropertyOptional({
    example: 6,
    description: 'Edad del niño',
    minimum: 2,
    maximum: 12,
  })
  @IsOptional()
  @IsInt({ message: 'La edad debe ser un número entero' })
  @Min(2, { message: 'La edad mínima es 2 años' })
  @Max(12, { message: 'La edad máxima es 12 años' })
  age?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Si el perfil está activo',
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser booleano' })
  isActive?: boolean;
}
