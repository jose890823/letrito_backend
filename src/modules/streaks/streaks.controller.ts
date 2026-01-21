import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StreaksService } from './streaks.service';
import {
  StreakResponseDto,
  StreakCheckInResponseDto,
} from './dto/streak-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';

@ApiTags('Streaks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('streaks')
export class StreaksController {
  constructor(private readonly streaksService: StreaksService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener estadisticas de racha',
    description:
      'Retorna la racha actual, racha mas larga y logros del usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadisticas de racha',
    type: StreakResponseDto,
  })
  async getStreakStats(@CurrentUser() user: User): Promise<StreakResponseDto> {
    return this.streaksService.getStreakStats(user);
  }

  @Post('check-in')
  @ApiOperation({
    summary: 'Registrar actividad del dia',
    description:
      'Registra que el usuario estuvo activo hoy y actualiza su racha',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado del check-in',
    type: StreakCheckInResponseDto,
  })
  async checkIn(@CurrentUser() user: User): Promise<StreakCheckInResponseDto> {
    return this.streaksService.checkIn(user);
  }
}
