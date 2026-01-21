import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsDateString,
  IsUUID,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventType } from '../entities/session-event.entity';
import type { SessionEventMetadata } from '../entities/session-event.entity';

/**
 * DTO para un evento individual
 */
export class EventDto {
  @ApiProperty({
    description: 'Tipo de evento',
    enum: EventType,
    example: EventType.LEVEL_COMPLETE,
  })
  @IsNotEmpty({ message: 'El tipo de evento es obligatorio' })
  @IsEnum(EventType, { message: 'Tipo de evento no válido' })
  eventType: EventType;

  @ApiProperty({
    description: 'Timestamp del evento (ISO 8601)',
    example: '2025-01-20T10:30:00.000Z',
  })
  @IsNotEmpty({ message: 'El timestamp es obligatorio' })
  @IsDateString({}, { message: 'El timestamp debe ser una fecha válida ISO 8601' })
  timestamp: string;

  @ApiProperty({
    description: 'Metadatos adicionales del evento',
    required: false,
    example: { letter: 'A', levelNumber: 5, stars: 3 },
  })
  @IsOptional()
  @IsObject({ message: 'Los metadatos deben ser un objeto' })
  metadata?: SessionEventMetadata;

  @ApiProperty({
    description: 'ID de sesión para agrupar eventos',
    required: false,
    example: 'session-123-abc',
  })
  @IsOptional()
  @IsString({ message: 'El ID de sesión debe ser una cadena' })
  sessionId?: string;
}

/**
 * DTO para registrar múltiples eventos (batch)
 */
export class RegisterEventsDto {
  @ApiProperty({
    description: 'ID del perfil del niño',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'El ID del perfil es obligatorio' })
  @IsUUID('4', { message: 'El ID del perfil debe ser un UUID válido' })
  childProfileId: string;

  @ApiProperty({
    description: 'Lista de eventos a registrar',
    type: [EventDto],
    example: [
      {
        eventType: 'LEVEL_COMPLETE',
        timestamp: '2025-01-20T10:30:00.000Z',
        metadata: { letter: 'A', levelNumber: 5, stars: 3 },
        sessionId: 'session-123',
      },
    ],
  })
  @IsArray({ message: 'Los eventos deben ser un array' })
  @ArrayMinSize(1, { message: 'Debe proporcionar al menos un evento' })
  @ValidateNested({ each: true })
  @Type(() => EventDto)
  events: EventDto[];
}

/**
 * Respuesta al registrar eventos
 */
export class RegisterEventsResponseDto {
  @ApiProperty({ description: 'Eventos registrados exitosamente', example: 5 })
  eventsRegistered: number;

  @ApiProperty({ description: 'Eventos que fallaron', example: 0 })
  eventsFailed: number;

  @ApiProperty({
    description: 'Uso diario actualizado',
    required: false,
  })
  dailyUsageUpdated?: boolean;
}
