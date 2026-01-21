import {
  Controller,
  Get,
  Param,
  Query,
  Delete,
  Patch,
  UseGuards,
  ParseUUIDPipe,
  Body,
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
import { StreaksService } from './streaks.service';

@ApiTags('Admin - Streaks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin/streaks')
export class StreaksAdminController {
  constructor(private readonly streaksService: StreaksService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los streaks con filtros' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'minStreak', required: false, type: Number })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: [
      'currentStreak',
      'longestStreak',
      'totalDaysActive',
      'lastActiveDate',
    ],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, description: 'Lista de streaks' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('minStreak') minStreak?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.streaksService.findAllAdmin({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      minStreak: minStreak ? parseInt(minStreak, 10) : undefined,
      sortBy: sortBy as
        | 'currentStreak'
        | 'longestStreak'
        | 'totalDaysActive'
        | 'lastActiveDate'
        | undefined,
      sortOrder: sortOrder as 'ASC' | 'DESC' | undefined,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de streaks' })
  @ApiResponse({ status: 200, description: 'Estadísticas de streaks' })
  async getStats() {
    return this.streaksService.getAdminStats();
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Obtener ranking de usuarios por racha' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Leaderboard de streaks' })
  async getLeaderboard(@Query('limit') limit?: string) {
    return this.streaksService.getLeaderboard(limit ? parseInt(limit, 10) : 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener streak por ID' })
  @ApiResponse({ status: 200, description: 'Detalle del streak' })
  @ApiResponse({ status: 404, description: 'Streak no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.streaksService.findByIdAdmin(id);
  }

  @Patch(':id/reset')
  @ApiOperation({ summary: 'Resetear racha de un usuario' })
  @ApiResponse({ status: 200, description: 'Racha reseteada' })
  @ApiResponse({ status: 404, description: 'Streak no encontrado' })
  async resetStreak(@Param('id', ParseUUIDPipe) id: string) {
    return this.streaksService.resetStreakAdmin(id);
  }

  @Patch(':id/adjust')
  @ApiOperation({ summary: 'Ajustar racha de un usuario manualmente' })
  @ApiResponse({ status: 200, description: 'Racha ajustada' })
  @ApiResponse({ status: 404, description: 'Streak no encontrado' })
  async adjustStreak(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { currentStreak?: number; longestStreak?: number },
  ) {
    return this.streaksService.adjustStreakAdmin(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar registro de streak' })
  @ApiResponse({ status: 200, description: 'Streak eliminado' })
  @ApiResponse({ status: 404, description: 'Streak no encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.streaksService.removeAdmin(id);
  }
}
