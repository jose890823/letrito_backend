import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO para completar el onboarding en Letrito
 * Solo requiere timezone para notificaciones y recordatorios
 */
export class CompleteOnboardingDto {
  @ApiProperty({
    example: 'America/Mexico_City',
    description: 'Zona horaria del usuario',
    required: false,
  })
  @IsString()
  @IsOptional()
  timezone?: string;
}

/**
 * Respuesta del estado de onboarding
 */
export class OnboardingStatusResponseDto {
  @ApiProperty({
    example: true,
    description: 'Si el onboarding está completado',
  })
  completed: boolean;

  @ApiProperty({
    example: 'America/Mexico_City',
    description: 'Zona horaria',
    required: false,
  })
  timezone?: string;

  @ApiProperty({
    example: 2,
    description: 'Número de perfiles de niños creados',
  })
  childProfilesCount: number;
}
