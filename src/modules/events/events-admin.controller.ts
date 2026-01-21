import {
  Controller,
  Get,
  Param,
  Query,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { EventsService } from './events.service';
import { EventType } from './entities/event.entity';

@ApiTags('Admin - Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin/events')
export class EventsAdminController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los eventos con filtros' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'eventType', required: false, enum: EventType })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lista de eventos' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('eventType') eventType?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.eventsService.findAllAdmin({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      eventType: eventType as EventType | undefined,
      userId,
      startDate,
      endDate,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de eventos' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Estadísticas de eventos' })
  async getStats(@Query('days') days?: string) {
    return this.eventsService.getAdminStats(days ? parseInt(days, 10) : 7);
  }

  @Get('timeline')
  @ApiOperation({ summary: 'Obtener timeline de actividad' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Timeline de actividad' })
  async getTimeline(@Query('days') days?: string) {
    return this.eventsService.getActivityTimeline(
      days ? parseInt(days, 10) : 7,
    );
  }

  @Get('types')
  @ApiOperation({ summary: 'Obtener lista de tipos de eventos' })
  @ApiResponse({ status: 200, description: 'Lista de tipos de eventos' })
  async getEventTypes() {
    return Object.values(EventType).map((type) => ({
      value: type,
      label: this.formatEventTypeLabel(type),
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener evento por ID' })
  @ApiResponse({ status: 200, description: 'Detalle del evento' })
  @ApiResponse({ status: 404, description: 'Evento no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.findByIdAdmin(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar evento' })
  @ApiResponse({ status: 200, description: 'Evento eliminado' })
  @ApiResponse({ status: 404, description: 'Evento no encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.removeAdmin(id);
  }

  private formatEventTypeLabel(type: EventType): string {
    const labels: Record<EventType, string> = {
      [EventType.ONBOARDING_STARTED]: 'Onboarding Iniciado',
      [EventType.ONBOARDING_NICHE_SELECTED]: 'Nicho Seleccionado',
      [EventType.ONBOARDING_PLATFORM_SELECTED]: 'Plataforma Seleccionada',
      [EventType.ONBOARDING_COMPLETED]: 'Onboarding Completado',
      [EventType.GENERATION_CREATED]: 'Generación Creada',
      [EventType.GENERATION_VIEWED]: 'Generación Vista',
      [EventType.GENERATION_USED]: 'Generación Usada',
      [EventType.STREAK_CHECK_IN]: 'Check-in de Racha',
      [EventType.STREAK_BROKEN]: 'Racha Rota',
      [EventType.STREAK_MILESTONE]: 'Logro de Racha',
      [EventType.SUBSCRIPTION_STARTED]: 'Suscripción Iniciada',
      [EventType.SUBSCRIPTION_CANCELLED]: 'Suscripción Cancelada',
      [EventType.SUBSCRIPTION_RENEWED]: 'Suscripción Renovada',
      [EventType.TRIAL_STARTED]: 'Trial Iniciado',
      [EventType.TRIAL_ENDED]: 'Trial Finalizado',
      [EventType.USER_LOGIN]: 'Inicio de Sesión',
      [EventType.USER_LOGOUT]: 'Cierre de Sesión',
      [EventType.PROFILE_UPDATED]: 'Perfil Actualizado',
    };
    return labels[type] || type;
  }
}
