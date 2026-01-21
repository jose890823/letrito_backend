import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import {
  ActivityType,
  ActivitySeverity,
} from '../entities/activity-log.entity';

// ==================== QUERY DTOs ====================

export class GetActivityLogsQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por tipo de actividad',
    enum: ActivityType,
  })
  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;

  @ApiPropertyOptional({
    description: 'Filtrar por severidad',
    enum: ActivitySeverity,
  })
  @IsOptional()
  @IsEnum(ActivitySeverity)
  severity?: ActivitySeverity;

  @ApiPropertyOptional({
    description: 'Solo eventos no leídos',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Fecha de inicio (YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin (YYYY-MM-DD)',
    example: '2025-01-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Número de página',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Elementos por página',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ==================== RESPONSE DTOs ====================

export class ActivityLogResponseDto {
  @ApiProperty({ description: 'ID del log' })
  id: string;

  @ApiProperty({ description: 'ID del perfil del niño' })
  childProfileId: string;

  @ApiProperty({
    description: 'Tipo de actividad',
    enum: ActivityType,
  })
  activityType: ActivityType;

  @ApiProperty({
    description: 'Severidad',
    enum: ActivitySeverity,
  })
  severity: ActivitySeverity;

  @ApiProperty({ description: 'Título del evento' })
  title: string;

  @ApiProperty({ description: 'Descripción del evento', nullable: true })
  description: string | null;

  @ApiProperty({
    description: 'Metadatos adicionales',
    example: { elementType: 'letter', elementId: 'A' },
  })
  metadata: Record<string, unknown>;

  @ApiProperty({ description: 'Indica si ha sido leído' })
  isRead: boolean;

  @ApiProperty({ description: 'Fecha del evento' })
  createdAt: Date;
}

export class ActivityLogListResponseDto {
  @ApiProperty({
    description: 'Lista de logs de actividad',
    type: [ActivityLogResponseDto],
  })
  items: ActivityLogResponseDto[];

  @ApiProperty({ description: 'Total de registros' })
  total: number;

  @ApiProperty({ description: 'Página actual' })
  page: number;

  @ApiProperty({ description: 'Elementos por página' })
  limit: number;

  @ApiProperty({ description: 'Total de páginas' })
  totalPages: number;

  @ApiProperty({ description: 'Cantidad de no leídos' })
  unreadCount: number;
}

export class ActivityCountsDto {
  @ApiProperty({ description: 'Total de eventos' })
  total: number;

  @ApiProperty({ description: 'Eventos no leídos' })
  unread: number;

  @ApiProperty({ description: 'Alertas pendientes' })
  alerts: number;

  @ApiProperty({ description: 'Logros recientes (últimos 7 días)' })
  recentAchievements: number;

  @ApiProperty({ description: 'Desglose por tipo' })
  byType: Record<string, number>;

  @ApiProperty({ description: 'Desglose por severidad' })
  bySeverity: Record<string, number>;
}

export class TimelineEventDto {
  @ApiProperty({ description: 'ID del evento' })
  id: string;

  @ApiProperty({ description: 'Tipo de evento' })
  type: ActivityType;

  @ApiProperty({ description: 'Severidad' })
  severity: ActivitySeverity;

  @ApiProperty({ description: 'Título' })
  title: string;

  @ApiProperty({ description: 'Descripción', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Hora del evento (HH:mm)' })
  time: string;

  @ApiProperty({ description: 'Fecha del evento' })
  date: string;

  @ApiProperty({ description: 'Icono sugerido' })
  icon: string;

  @ApiProperty({ description: 'Color sugerido' })
  color: string;

  @ApiProperty({ description: 'Leído' })
  isRead: boolean;
}

export class DailyTimelineDto {
  @ApiProperty({ description: 'Fecha (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({
    description: 'Eventos del día ordenados por hora',
    type: [TimelineEventDto],
  })
  events: TimelineEventDto[];

  @ApiProperty({ description: 'Total de minutos de uso del día' })
  totalMinutes: number;

  @ApiProperty({ description: 'Cantidad de sesiones' })
  sessionsCount: number;
}
