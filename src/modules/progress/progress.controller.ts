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
  ParseIntPipe,
  DefaultValuePipe,
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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { ProgressService } from './progress.service';
import {
  RecordAttemptDto,
  RecordSessionDto,
  AttemptResultResponseDto,
  ProgressSummaryDto,
  ElementProgressSummaryDto,
  ChildLevelResponseDto,
  WeeklyActivityResponseDto,
  SessionHistoryResponseDto,
  TimelineResponseDto,
  RecommendedElementsResponseDto,
} from './dto';

@ApiTags('Progress')
@Controller('progress')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  // ============================================
  // REGISTRO DE PROGRESO
  // ============================================

  @Post('attempt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar intento individual',
    description:
      'Registra un intento individual de lectura o escritura de un elemento',
  })
  @ApiResponse({
    status: 200,
    description: 'Intento registrado exitosamente',
    type: AttemptResultResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para registrar en este perfil',
  })
  async recordAttempt(
    @Body() dto: RecordAttemptDto,
    @CurrentUser() user: User,
  ): Promise<AttemptResultResponseDto> {
    return this.progressService.recordAttempt(user.id, dto);
  }

  @Post('session')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar sesión completa',
    description:
      'Registra una sesión de práctica completa con múltiples ejercicios',
  })
  @ApiResponse({
    status: 201,
    description: 'Sesión registrada exitosamente',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para registrar en este perfil',
  })
  async recordSession(
    @Body() dto: RecordSessionDto,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean; sessionId: string }> {
    const session = await this.progressService.recordSession(user.id, dto);
    return { success: true, sessionId: session.id };
  }

  // ============================================
  // CONSULTAS DE PROGRESO
  // ============================================

  @Get('child/:id/summary')
  @ApiOperation({
    summary: 'Obtener resumen de progreso',
    description:
      'Obtiene un resumen completo del progreso de aprendizaje del niño',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del perfil del niño',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumen de progreso',
    type: ProgressSummaryDto,
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para acceder a este perfil',
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil no encontrado',
  })
  async getProgressSummary(
    @Param('id', ParseUUIDPipe) childProfileId: string,
    @CurrentUser() user: User,
  ): Promise<ProgressSummaryDto> {
    return this.progressService.getProgressSummary(user.id, childProfileId);
  }

  @Get('child/:id/letters')
  @ApiOperation({
    summary: 'Obtener progreso de letras',
    description: 'Obtiene el progreso detallado de todas las letras',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del perfil del niño',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Progreso de letras',
    type: [ElementProgressSummaryDto],
  })
  async getLettersProgress(
    @Param('id', ParseUUIDPipe) childProfileId: string,
    @CurrentUser() user: User,
  ): Promise<ElementProgressSummaryDto[]> {
    return this.progressService.getLettersProgress(user.id, childProfileId);
  }

  @Get('child/:id/syllables')
  @ApiOperation({
    summary: 'Obtener progreso de sílabas',
    description:
      'Obtiene el progreso detallado de todas las sílabas practicadas',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del perfil del niño',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Progreso de sílabas',
    type: [ElementProgressSummaryDto],
  })
  async getSyllablesProgress(
    @Param('id', ParseUUIDPipe) childProfileId: string,
    @CurrentUser() user: User,
  ): Promise<ElementProgressSummaryDto[]> {
    return this.progressService.getSyllablesProgress(user.id, childProfileId);
  }

  @Get('child/:id/words')
  @ApiOperation({
    summary: 'Obtener progreso de palabras',
    description:
      'Obtiene el progreso detallado de todas las palabras practicadas',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del perfil del niño',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Progreso de palabras',
    type: [ElementProgressSummaryDto],
  })
  async getWordsProgress(
    @Param('id', ParseUUIDPipe) childProfileId: string,
    @CurrentUser() user: User,
  ): Promise<ElementProgressSummaryDto[]> {
    return this.progressService.getWordsProgress(user.id, childProfileId);
  }

  @Get('child/:id/level')
  @ApiOperation({
    summary: 'Obtener nivel actual',
    description:
      'Obtiene los niveles actuales del niño en todas las categorías',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del perfil del niño',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Nivel del niño',
    type: ChildLevelResponseDto,
  })
  async getChildLevel(
    @Param('id', ParseUUIDPipe) childProfileId: string,
    @CurrentUser() user: User,
  ): Promise<ChildLevelResponseDto> {
    return this.progressService.getChildLevel(user.id, childProfileId);
  }

  @Get('child/:id/recommended')
  @ApiOperation({
    summary: 'Obtener elementos recomendados',
    description:
      'Obtiene una lista de elementos recomendados para practicar basada en el progreso actual',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del perfil del niño',
    type: 'string',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Número máximo de recomendaciones',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Elementos recomendados',
    type: RecommendedElementsResponseDto,
  })
  async getRecommendedElements(
    @Param('id', ParseUUIDPipe) childProfileId: string,
    @CurrentUser() user: User,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<RecommendedElementsResponseDto> {
    return this.progressService.getRecommendedElements(
      user.id,
      childProfileId,
      limit,
    );
  }

  // ============================================
  // DASHBOARD DE PADRES
  // ============================================

  @Get('child/:id/weekly-activity')
  @ApiOperation({
    summary: 'Obtener actividad semanal',
    description: 'Obtiene un resumen de la actividad de los últimos 7 días',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del perfil del niño',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Actividad semanal',
    type: WeeklyActivityResponseDto,
  })
  async getWeeklyActivity(
    @Param('id', ParseUUIDPipe) childProfileId: string,
    @CurrentUser() user: User,
  ): Promise<WeeklyActivityResponseDto> {
    return this.progressService.getWeeklyActivity(user.id, childProfileId);
  }

  @Get('child/:id/sessions')
  @ApiOperation({
    summary: 'Obtener historial de sesiones',
    description: 'Obtiene el historial de sesiones de práctica con paginación',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del perfil del niño',
    type: 'string',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'page',
    description: 'Número de página',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Elementos por página',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de sesiones',
    type: SessionHistoryResponseDto,
  })
  async getSessionHistory(
    @Param('id', ParseUUIDPipe) childProfileId: string,
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<SessionHistoryResponseDto> {
    return this.progressService.getSessionHistory(
      user.id,
      childProfileId,
      page,
      limit,
    );
  }

  @Get('child/:id/timeline')
  @ApiOperation({
    summary: 'Obtener línea de tiempo',
    description: 'Obtiene una línea de tiempo de logros y eventos importantes',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del perfil del niño',
    type: 'string',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Número máximo de eventos',
    required: false,
    type: Number,
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Línea de tiempo',
    type: TimelineResponseDto,
  })
  async getTimeline(
    @Param('id', ParseUUIDPipe) childProfileId: string,
    @CurrentUser() user: User,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<TimelineResponseDto> {
    return this.progressService.getTimeline(user.id, childProfileId, limit);
  }
}
