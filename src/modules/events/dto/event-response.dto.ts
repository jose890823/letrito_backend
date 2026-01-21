import { ApiProperty } from '@nestjs/swagger';
import { EventType } from '../entities/event.entity';

export class EventResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del evento',
  })
  id: string;

  @ApiProperty({
    example: 'generation_created',
    description: 'Tipo de evento',
    enum: EventType,
  })
  eventType: EventType;

  @ApiProperty({
    example: { generationId: '123' },
    description: 'Metadata del evento',
    required: false,
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    example: '2025-01-15T10:30:00.000Z',
    description: 'Fecha del evento',
  })
  createdAt: Date;
}

export class CreateEventDto {
  @ApiProperty({
    example: 'generation_created',
    description: 'Tipo de evento',
    enum: EventType,
  })
  eventType: EventType;

  @ApiProperty({
    example: { generationId: '123' },
    description: 'Metadata del evento',
    required: false,
  })
  metadata?: Record<string, any>;
}

export class EventsHistoryResponseDto {
  @ApiProperty({
    type: [EventResponseDto],
    description: 'Lista de eventos',
  })
  events: EventResponseDto[];

  @ApiProperty({
    example: 50,
    description: 'Total de eventos',
  })
  total: number;
}
