import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import {
  RegisterEventsDto,
  RegisterEventsResponseDto,
  DailyUsageResponseDto,
  DailyUsageListResponseDto,
  WeeklyReportResponseDto,
  FullReportResponseDto,
} from './dto';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Registra múltiples eventos en batch
   */
  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar eventos',
    description: 'Registra múltiples eventos de sesión en batch para análisis',
  })
  @ApiResponse({
    status: 201,
    description: 'Eventos registrados exitosamente',
    type: RegisterEventsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de evento inválidos' })
  @ApiResponse({ status: 404, description: 'Perfil de niño no encontrado' })
  async registerEvents(
    @Body() registerEventsDto: RegisterEventsDto,
  ): Promise<RegisterEventsResponseDto> {
    return this.analyticsService.registerEvents(registerEventsDto);
  }

  /**
   * Obtiene uso diario de un niño para una fecha específica
   */
  @Get(':childId/daily')
  @ApiOperation({
    summary: 'Obtener uso diario',
    description: 'Obtiene estadísticas de uso para un día específico o el día actual',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Fecha en formato YYYY-MM-DD (default: hoy)',
    example: '2025-01-20',
  })
  @ApiResponse({
    status: 200,
    description: 'Uso diario del niño',
    type: DailyUsageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Perfil de niño no encontrado' })
  async getDailyUsage(
    @Param('childId', ParseUUIDPipe) childId: string,
    @Query('date') date?: string,
  ): Promise<DailyUsageResponseDto | { message: string }> {
    const usage = await this.analyticsService.getDailyUsage(childId, date);
    if (!usage) {
      return { message: 'No hay datos de uso para esta fecha' };
    }
    return usage;
  }

  /**
   * Obtiene uso diario en un rango de fechas
   */
  @Get(':childId/daily/range')
  @ApiOperation({
    summary: 'Obtener uso diario (rango)',
    description: 'Obtiene estadísticas de uso para un rango de fechas',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Fecha de inicio (YYYY-MM-DD)',
    example: '2025-01-14',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'Fecha de fin (YYYY-MM-DD)',
    example: '2025-01-20',
  })
  @ApiResponse({
    status: 200,
    description: 'Uso diario en el rango de fechas',
    type: DailyUsageListResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Perfil de niño no encontrado' })
  async getDailyUsageRange(
    @Param('childId', ParseUUIDPipe) childId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<DailyUsageListResponseDto> {
    return this.analyticsService.getDailyUsageRange(childId, startDate, endDate);
  }

  /**
   * Obtiene reporte semanal
   */
  @Get(':childId/weekly')
  @ApiOperation({
    summary: 'Obtener reporte semanal',
    description:
      'Genera un reporte completo de la semana actual o una semana anterior',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiQuery({
    name: 'weekOffset',
    required: false,
    description: 'Semanas hacia atrás (0 = esta semana, 1 = semana pasada)',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Reporte semanal completo',
    type: WeeklyReportResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Perfil de niño no encontrado' })
  async getWeeklyReport(
    @Param('childId', ParseUUIDPipe) childId: string,
    @Query('weekOffset') weekOffset?: string,
  ): Promise<WeeklyReportResponseDto> {
    const offset = weekOffset ? parseInt(weekOffset, 10) : 0;
    return this.analyticsService.getWeeklyReport(childId, offset);
  }

  /**
   * Obtiene reporte completo
   */
  @Get(':childId/report')
  @ApiOperation({
    summary: 'Obtener reporte completo',
    description:
      'Genera un reporte completo con todas las estadísticas, progreso y recomendaciones',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({
    status: 200,
    description: 'Reporte completo del niño',
    type: FullReportResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Perfil de niño no encontrado' })
  async getFullReport(
    @Param('childId', ParseUUIDPipe) childId: string,
  ): Promise<FullReportResponseDto> {
    return this.analyticsService.getFullReport(childId);
  }
}
