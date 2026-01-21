import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { ParentalService } from './parental.service';
import {
  SetPinDto,
  VerifyPinDto,
  UpdateParentalControlDto,
  ApplyPresetDto,
  ParentalControlResponseDto,
  PinVerificationResponseDto,
  AccessStatusResponseDto,
} from './dto/parental-control.dto';
import {
  GetActivityLogsQueryDto,
  ActivityLogListResponseDto,
  ActivityCountsDto,
} from './dto/activity-log.dto';
import {
  GetUsageQueryDto,
  DailyUsageResponseDto,
  WeeklySummaryDto,
  QuickStatsDto,
} from './dto/usage-summary.dto';
import { PARENTAL_PRESETS } from './constants/parental.constants';

@ApiTags('Parental')
@Controller('parental')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ParentalController {
  constructor(private readonly parentalService: ParentalService) {}

  // ==================== CONTROL PARENTAL ====================

  @Get('child/:childId/settings')
  @ApiOperation({
    summary: 'Obtener configuración de control parental',
    description: 'Retorna la configuración de control parental del niño',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({
    status: 200,
    description: 'Configuración encontrada',
    type: ParentalControlResponseDto,
  })
  async getParentalControl(
    @Param('childId', ParseUUIDPipe) childId: string,
    @CurrentUser() user: User,
  ): Promise<ParentalControlResponseDto> {
    await this.parentalService.verifyParentAccess(childId, user.id);
    return this.parentalService.getParentalControl(childId);
  }

  @Patch('child/:childId/settings')
  @ApiOperation({
    summary: 'Actualizar configuración de control parental',
    description: 'Actualiza límites, horarios y otras configuraciones',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({
    status: 200,
    description: 'Configuración actualizada',
    type: ParentalControlResponseDto,
  })
  async updateParentalControl(
    @Param('childId', ParseUUIDPipe) childId: string,
    @Body() dto: UpdateParentalControlDto,
    @CurrentUser() user: User,
  ): Promise<ParentalControlResponseDto> {
    await this.parentalService.verifyParentAccess(childId, user.id);
    return this.parentalService.updateParentalControl(childId, dto);
  }

  @Post('child/:childId/settings/preset')
  @ApiOperation({
    summary: 'Aplicar preset de configuración',
    description: 'Aplica un preset predefinido de control parental',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({
    status: 200,
    description: 'Preset aplicado',
    type: ParentalControlResponseDto,
  })
  async applyPreset(
    @Param('childId', ParseUUIDPipe) childId: string,
    @Body() dto: ApplyPresetDto,
    @CurrentUser() user: User,
  ): Promise<ParentalControlResponseDto> {
    await this.parentalService.verifyParentAccess(childId, user.id);
    return this.parentalService.applyPreset(childId, dto.preset);
  }

  @Get('presets')
  @ApiOperation({
    summary: 'Obtener presets disponibles',
    description: 'Lista los presets de configuración disponibles',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de presets',
  })
  getPresets() {
    return Object.entries(PARENTAL_PRESETS).map(([key, value]) => ({
      id: key,
      name: value.name,
      description: value.description,
      dailyTimeLimitMinutes: value.dailyTimeLimitMinutes,
      weeklyTimeLimitMinutes: value.weeklyTimeLimitMinutes,
    }));
  }

  // ==================== PIN ====================

  @Post('child/:childId/pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Configurar PIN parental',
    description: 'Establece o actualiza el PIN de control parental',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({ status: 200, description: 'PIN configurado' })
  async setPin(
    @Param('childId', ParseUUIDPipe) childId: string,
    @Body() dto: SetPinDto,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    await this.parentalService.verifyParentAccess(childId, user.id);
    await this.parentalService.setPin(childId, dto.pin);
    return { message: 'PIN configurado correctamente' };
  }

  @Delete('child/:childId/pin')
  @ApiOperation({
    summary: 'Eliminar PIN parental',
    description: 'Elimina el PIN de control parental',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({ status: 200, description: 'PIN eliminado' })
  async removePin(
    @Param('childId', ParseUUIDPipe) childId: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    await this.parentalService.verifyParentAccess(childId, user.id);
    await this.parentalService.removePin(childId);
    return { message: 'PIN eliminado correctamente' };
  }

  @Post('child/:childId/pin/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar PIN parental',
    description: 'Verifica si el PIN ingresado es correcto',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({
    status: 200,
    description: 'Resultado de verificación',
    type: PinVerificationResponseDto,
  })
  async verifyPin(
    @Param('childId', ParseUUIDPipe) childId: string,
    @Body() dto: VerifyPinDto,
    @CurrentUser() user: User,
  ): Promise<PinVerificationResponseDto> {
    await this.parentalService.verifyParentAccess(childId, user.id);
    return this.parentalService.verifyPin(childId, dto.pin);
  }

  // ==================== ESTADO DE ACCESO ====================

  @Get('child/:childId/access-status')
  @ApiOperation({
    summary: 'Verificar estado de acceso',
    description:
      'Verifica si el niño puede usar la app según límites y horarios',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({
    status: 200,
    description: 'Estado de acceso',
    type: AccessStatusResponseDto,
  })
  async getAccessStatus(
    @Param('childId', ParseUUIDPipe) childId: string,
    @CurrentUser() user: User,
  ): Promise<AccessStatusResponseDto> {
    await this.parentalService.verifyParentAccess(childId, user.id);
    return this.parentalService.getAccessStatus(childId);
  }

  // ==================== USO Y ESTADÍSTICAS ====================

  @Get('child/:childId/stats')
  @ApiOperation({
    summary: 'Obtener estadísticas rápidas',
    description: 'Resumen de uso actual y estadísticas clave',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas rápidas',
    type: QuickStatsDto,
  })
  async getQuickStats(
    @Param('childId', ParseUUIDPipe) childId: string,
    @CurrentUser() user: User,
  ): Promise<QuickStatsDto> {
    await this.parentalService.verifyParentAccess(childId, user.id);
    return this.parentalService.getQuickStats(childId);
  }

  @Get('child/:childId/usage')
  @ApiOperation({
    summary: 'Obtener historial de uso',
    description: 'Historial de uso diario con filtros opcionales',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({
    status: 200,
    description: 'Historial de uso',
    type: [DailyUsageResponseDto],
  })
  async getUsageHistory(
    @Param('childId', ParseUUIDPipe) childId: string,
    @Query() query: GetUsageQueryDto,
    @CurrentUser() user: User,
  ): Promise<DailyUsageResponseDto[]> {
    await this.parentalService.verifyParentAccess(childId, user.id);
    return this.parentalService.getUsageHistory(childId, query);
  }

  @Get('child/:childId/usage/weekly')
  @ApiOperation({
    summary: 'Obtener resumen semanal',
    description: 'Resumen detallado de los últimos 7 días',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({
    status: 200,
    description: 'Resumen semanal',
    type: WeeklySummaryDto,
  })
  async getWeeklySummary(
    @Param('childId', ParseUUIDPipe) childId: string,
    @CurrentUser() user: User,
  ): Promise<WeeklySummaryDto> {
    await this.parentalService.verifyParentAccess(childId, user.id);
    return this.parentalService.getWeeklySummary(childId);
  }

  // ==================== ACTIVITY LOG ====================

  @Get('child/:childId/activity')
  @ApiOperation({
    summary: 'Obtener logs de actividad',
    description: 'Lista de eventos y actividades del niño',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({
    status: 200,
    description: 'Lista de actividades',
    type: ActivityLogListResponseDto,
  })
  async getActivityLogs(
    @Param('childId', ParseUUIDPipe) childId: string,
    @Query() query: GetActivityLogsQueryDto,
    @CurrentUser() user: User,
  ): Promise<ActivityLogListResponseDto> {
    await this.parentalService.verifyParentAccess(childId, user.id);
    return this.parentalService.getActivityLogs(childId, query);
  }

  @Get('child/:childId/activity/counts')
  @ApiOperation({
    summary: 'Obtener conteos de actividad',
    description: 'Resumen de conteos por tipo y severidad',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({
    status: 200,
    description: 'Conteos de actividad',
    type: ActivityCountsDto,
  })
  async getActivityCounts(
    @Param('childId', ParseUUIDPipe) childId: string,
    @CurrentUser() user: User,
  ): Promise<ActivityCountsDto> {
    await this.parentalService.verifyParentAccess(childId, user.id);
    return this.parentalService.getActivityCounts(childId);
  }

  @Post('child/:childId/activity/mark-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar actividades como leídas',
    description:
      'Marca todas o algunas actividades como leídas. Si no se envía body, marca todas.',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({
    status: 200,
    description: 'Cantidad de actividades marcadas',
  })
  async markActivityAsRead(
    @Param('childId', ParseUUIDPipe) childId: string,
    @Body() body: { logIds?: string[] },
    @CurrentUser() user: User,
  ): Promise<{ markedCount: number }> {
    await this.parentalService.verifyParentAccess(childId, user.id);
    const count = await this.parentalService.markLogsAsRead(
      childId,
      body.logIds,
    );
    return { markedCount: count };
  }
}
