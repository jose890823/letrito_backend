import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { EventsHistoryResponseDto } from './dto/event-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';

@ApiTags('Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener historial de eventos',
    description: 'Retorna el historial de eventos del usuario',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limite de resultados (default 50)',
    example: 50,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Offset para paginacion',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de eventos',
    type: EventsHistoryResponseDto,
  })
  async getHistory(
    @CurrentUser() user: User,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<EventsHistoryResponseDto> {
    return this.eventsService.getHistory(user.id, {
      limit: parseInt(limit || '50', 10),
      offset: parseInt(offset || '0', 10),
    });
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Obtener estadisticas de actividad',
    description: 'Retorna estadisticas de actividad del usuario',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Numero de dias a consultar (default 7)',
    example: 7,
  })
  @ApiResponse({
    status: 200,
    description: 'Estadisticas de actividad',
  })
  async getActivityStats(
    @CurrentUser() user: User,
    @Query('days') days?: string,
  ): Promise<{
    totalEvents: number;
    generationsCreated: number;
    generationsUsed: number;
    checkIns: number;
    daysActive: number;
  }> {
    const daysNum = Math.min(parseInt(days || '7', 10) || 7, 90);
    return this.eventsService.getActivityStats(user.id, daysNum);
  }
}
