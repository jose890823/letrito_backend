import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
  ValidateNested,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

class AllowedHoursDto {
  @ApiPropertyOptional({
    example: '08:00',
    description: 'Hora de inicio (formato HH:mm)',
  })
  @IsOptional()
  @IsString({ message: 'La hora de inicio debe ser texto' })
  start?: string;

  @ApiPropertyOptional({
    example: '20:00',
    description: 'Hora de fin (formato HH:mm)',
  })
  @IsOptional()
  @IsString({ message: 'La hora de fin debe ser texto' })
  end?: string;
}

export class UpdateChildSettingsDto {
  @ApiPropertyOptional({
    example: 60,
    description: 'Límite diario en minutos (null para quitar límite)',
  })
  @IsOptional()
  @IsInt({ message: 'El límite diario debe ser un número entero' })
  @Min(5, { message: 'El límite mínimo es 5 minutos' })
  @Max(480, { message: 'El límite máximo es 480 minutos (8 horas)' })
  dailyTimeLimit?: number | null;

  @ApiPropertyOptional({
    description: 'Horas permitidas para jugar (null para quitar restricción)',
    type: AllowedHoursDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AllowedHoursDto)
  allowedHours?: AllowedHoursDto | null;

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
