import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class AllowedHoursDto {
  @ApiProperty({
    example: '08:00',
    description: 'Hora de inicio (formato HH:mm)',
  })
  @IsString({ message: 'La hora de inicio debe ser texto' })
  start: string;

  @ApiProperty({
    example: '20:00',
    description: 'Hora de fin (formato HH:mm)',
  })
  @IsString({ message: 'La hora de fin debe ser texto' })
  end: string;
}

class ChildSettingsDto {
  @ApiPropertyOptional({
    example: 60,
    description: 'Límite diario en minutos (null = sin límite)',
  })
  @IsOptional()
  @IsInt({ message: 'El límite diario debe ser un número entero' })
  @Min(5, { message: 'El límite mínimo es 5 minutos' })
  @Max(480, { message: 'El límite máximo es 480 minutos (8 horas)' })
  dailyTimeLimit?: number;

  @ApiPropertyOptional({
    description: 'Horas permitidas para jugar',
    type: AllowedHoursDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AllowedHoursDto)
  allowedHours?: AllowedHoursDto;

  @ApiPropertyOptional({
    example: true,
    description: 'Sonidos habilitados',
  })
  @IsOptional()
  @IsBoolean({ message: 'soundEnabled debe ser booleano' })
  soundEnabled?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Text-to-speech habilitado',
  })
  @IsOptional()
  @IsBoolean({ message: 'ttsEnabled debe ser booleano' })
  ttsEnabled?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Música de fondo habilitada',
  })
  @IsOptional()
  @IsBoolean({ message: 'musicEnabled debe ser booleano' })
  musicEnabled?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Vibraciones habilitadas',
  })
  @IsOptional()
  @IsBoolean({ message: 'hapticEnabled debe ser booleano' })
  hapticEnabled?: boolean;
}

export class CreateChildProfileDto {
  @ApiProperty({
    example: 'Sofía',
    description: 'Nombre del niño',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser texto' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string;

  @ApiPropertyOptional({
    example: 'avatar_01',
    description: 'Identificador del avatar seleccionado',
  })
  @IsOptional()
  @IsString({ message: 'El avatarId debe ser texto' })
  @MaxLength(50, { message: 'El avatarId no puede exceder 50 caracteres' })
  avatarId?: string;

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
    example: 5,
    description: 'Edad del niño (si no se proporciona fecha de nacimiento)',
    minimum: 2,
    maximum: 12,
  })
  @IsOptional()
  @IsInt({ message: 'La edad debe ser un número entero' })
  @Min(2, { message: 'La edad mínima es 2 años' })
  @Max(12, { message: 'La edad máxima es 12 años' })
  age?: number;

  @ApiPropertyOptional({
    description: 'Configuración inicial del perfil',
    type: ChildSettingsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChildSettingsDto)
  settings?: ChildSettingsDto;
}
