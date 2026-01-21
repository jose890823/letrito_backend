import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { ChildrenProfilesService } from './children-profiles.service';
import {
  CreateChildProfileDto,
  UpdateChildProfileDto,
  UpdateChildSettingsDto,
  ChildProfileResponseDto,
  ChildProfileListResponseDto,
} from './dto';

@ApiTags('Children Profiles')
@Controller('children')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChildrenProfilesController {
  constructor(
    private readonly childrenProfilesService: ChildrenProfilesService,
  ) {}

  // ============================================
  // LISTAR PERFILES
  // ============================================

  @Get()
  @ApiOperation({
    summary: 'Listar perfiles de niños',
    description:
      'Obtiene todos los perfiles de niños activos del padre autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de perfiles obtenida exitosamente',
    type: ChildProfileListResponseDto,
  })
  async findAll(
    @CurrentUser() user: User,
  ): Promise<ChildProfileListResponseDto> {
    const children = await this.childrenProfilesService.findAllByParent(
      user.id,
    );

    return {
      children: children.map((child) =>
        this.childrenProfilesService.toResponseDto(child),
      ),
      total: children.length,
    };
  }

  // ============================================
  // OBTENER PERFIL
  // ============================================

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener perfil de niño',
    description: 'Obtiene un perfil de niño específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del perfil del niño',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil obtenido exitosamente',
    type: ChildProfileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil no encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para acceder a este perfil',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<ChildProfileResponseDto> {
    const profile = await this.childrenProfilesService.findByIdAndParent(
      id,
      user.id,
    );
    return this.childrenProfilesService.toResponseDto(profile);
  }

  // ============================================
  // CREAR PERFIL
  // ============================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear perfil de niño',
    description: 'Crea un nuevo perfil de niño para el padre autenticado',
  })
  @ApiResponse({
    status: 201,
    description: 'Perfil creado exitosamente',
    type: ChildProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o límite de perfiles alcanzado',
  })
  async create(
    @Body() dto: CreateChildProfileDto,
    @CurrentUser() user: User,
  ): Promise<ChildProfileResponseDto> {
    const profile = await this.childrenProfilesService.create(user.id, dto);
    return this.childrenProfilesService.toResponseDto(profile);
  }

  // ============================================
  // ACTUALIZAR PERFIL
  // ============================================

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar perfil de niño',
    description: 'Actualiza los datos básicos de un perfil de niño',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del perfil del niño',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado exitosamente',
    type: ChildProfileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil no encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para modificar este perfil',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChildProfileDto,
    @CurrentUser() user: User,
  ): Promise<ChildProfileResponseDto> {
    const profile = await this.childrenProfilesService.update(id, user.id, dto);
    return this.childrenProfilesService.toResponseDto(profile);
  }

  // ============================================
  // ACTUALIZAR CONFIGURACIÓN
  // ============================================

  @Patch(':id/settings')
  @ApiOperation({
    summary: 'Actualizar configuración del perfil',
    description:
      'Actualiza la configuración (límites, sonidos, etc.) de un perfil de niño',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del perfil del niño',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuración actualizada exitosamente',
    type: ChildProfileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil no encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para modificar este perfil',
  })
  async updateSettings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChildSettingsDto,
    @CurrentUser() user: User,
  ): Promise<ChildProfileResponseDto> {
    const profile = await this.childrenProfilesService.updateSettings(
      id,
      user.id,
      dto,
    );
    return this.childrenProfilesService.toResponseDto(profile);
  }

  // ============================================
  // ELIMINAR PERFIL
  // ============================================

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar perfil de niño',
    description: 'Elimina un perfil de niño (soft delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del perfil del niño',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Perfil eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil no encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para eliminar este perfil',
  })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.childrenProfilesService.delete(id, user.id);
  }

  // ============================================
  // VERIFICAR SI PUEDE CREAR MÁS
  // ============================================

  @Get('can-create/check')
  @ApiOperation({
    summary: 'Verificar si puede crear más perfiles',
    description: 'Verifica si el padre puede crear más perfiles de niños',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado de la verificación',
    schema: {
      type: 'object',
      properties: {
        canCreate: { type: 'boolean', example: true },
        currentCount: { type: 'number', example: 2 },
        maxAllowed: { type: 'number', example: 5 },
      },
    },
  })
  async canCreateMore(
    @CurrentUser() user: User,
  ): Promise<{ canCreate: boolean; currentCount: number; maxAllowed: number }> {
    const canCreate = await this.childrenProfilesService.canCreateMore(user.id);
    const currentCount = await this.childrenProfilesService.countByParent(
      user.id,
    );

    return {
      canCreate,
      currentCount,
      maxAllowed: 5, // TODO: obtener de configuración
    };
  }
}
