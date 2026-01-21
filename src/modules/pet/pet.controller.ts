import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
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
import { PetService } from './pet.service';
import {
  PetResponseDto,
  UpdatePetNameDto,
  UpdatePetVariantDto,
  EquipAccessoryDto,
  UnequipAccessoryDto,
  InteractionResultDto,
  AccessoryResponseDto,
  AccessorySummaryDto,
} from './dto';

@ApiTags('Pet')
@Controller('pet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PetController {
  constructor(private readonly petService: PetService) {}

  // ==================== MASCOTA ====================

  @Get('child/:childId')
  @ApiOperation({
    summary: 'Obtener mascota del niño',
    description:
      'Retorna la información completa de la mascota virtual del niño',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({
    status: 200,
    description: 'Mascota encontrada',
    type: PetResponseDto,
  })
  @ApiResponse({ status: 404, description: 'El niño no tiene mascota' })
  async getPet(
    @Param('childId', ParseUUIDPipe) childId: string,
  ): Promise<PetResponseDto> {
    return this.petService.getPetResponse(childId);
  }

  @Post('child/:childId')
  @ApiOperation({
    summary: 'Crear mascota para el niño',
    description:
      'Crea una nueva mascota para el perfil del niño (solo si no tiene una)',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({
    status: 201,
    description: 'Mascota creada',
    type: PetResponseDto,
  })
  @ApiResponse({ status: 409, description: 'El niño ya tiene una mascota' })
  async createPet(
    @Param('childId', ParseUUIDPipe) childId: string,
    @Body() body: { name?: string },
  ): Promise<PetResponseDto> {
    const pet = await this.petService.createPetForChild(childId, body.name);
    return this.petService.getPetResponse(pet.childProfileId);
  }

  @Patch('child/:childId/name')
  @ApiOperation({
    summary: 'Actualizar nombre de la mascota',
    description: 'Cambia el nombre de la mascota del niño',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({
    status: 200,
    description: 'Nombre actualizado',
    type: PetResponseDto,
  })
  async updateName(
    @Param('childId', ParseUUIDPipe) childId: string,
    @Body() dto: UpdatePetNameDto,
  ): Promise<PetResponseDto> {
    await this.petService.updatePetName(childId, dto.name);
    return this.petService.getPetResponse(childId);
  }

  @Patch('child/:childId/variant')
  @ApiOperation({
    summary: 'Cambiar variante de la mascota',
    description: 'Cambia el color/variante visual de la mascota',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({
    status: 200,
    description: 'Variante actualizada',
    type: PetResponseDto,
  })
  async updateVariant(
    @Param('childId', ParseUUIDPipe) childId: string,
    @Body() dto: UpdatePetVariantDto,
  ): Promise<PetResponseDto> {
    await this.petService.updatePetVariant(childId, dto.variant);
    return this.petService.getPetResponse(childId);
  }

  // ==================== INTERACCIONES ====================

  @Post('child/:childId/feed')
  @ApiOperation({
    summary: 'Alimentar a la mascota',
    description:
      'Alimenta a la mascota, reduce hambre y aumenta felicidad. Tiene cooldown.',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({
    status: 200,
    description: 'Mascota alimentada',
    type: InteractionResultDto,
  })
  @ApiResponse({ status: 400, description: 'Cooldown activo' })
  async feedPet(
    @Param('childId', ParseUUIDPipe) childId: string,
  ): Promise<InteractionResultDto> {
    return this.petService.feedPet(childId);
  }

  @Post('child/:childId/play')
  @ApiOperation({
    summary: 'Jugar con la mascota',
    description:
      'Juega con la mascota, aumenta felicidad pero consume energía. Tiene cooldown.',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({
    status: 200,
    description: 'Jugaste con la mascota',
    type: InteractionResultDto,
  })
  @ApiResponse({ status: 400, description: 'Sin energía o cooldown activo' })
  async playWithPet(
    @Param('childId', ParseUUIDPipe) childId: string,
  ): Promise<InteractionResultDto> {
    return this.petService.playWithPet(childId);
  }

  @Post('child/:childId/pet')
  @ApiOperation({
    summary: 'Acariciar a la mascota',
    description: 'Interacción rápida que aumenta un poco la felicidad',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({
    status: 200,
    description: 'Acariciaste a la mascota',
    type: InteractionResultDto,
  })
  async petThePet(
    @Param('childId', ParseUUIDPipe) childId: string,
  ): Promise<InteractionResultDto> {
    return this.petService.petThePet(childId);
  }

  // ==================== ACCESORIOS ====================

  @Get('child/:childId/accessories')
  @ApiOperation({
    summary: 'Obtener accesorios del niño',
    description:
      'Lista todos los accesorios con su estado de desbloqueo y equipamiento',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({
    status: 200,
    description: 'Lista de accesorios',
    type: [AccessoryResponseDto],
  })
  async getAccessories(
    @Param('childId', ParseUUIDPipe) childId: string,
  ): Promise<AccessoryResponseDto[]> {
    return this.petService.getAccessoriesForChild(childId);
  }

  @Get('child/:childId/accessories/summary')
  @ApiOperation({
    summary: 'Resumen de accesorios',
    description: 'Obtiene un resumen de la colección de accesorios del niño',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({
    status: 200,
    description: 'Resumen de accesorios',
    type: AccessorySummaryDto,
  })
  async getAccessorySummary(
    @Param('childId', ParseUUIDPipe) childId: string,
  ): Promise<AccessorySummaryDto> {
    return this.petService.getAccessorySummary(childId);
  }

  @Post('child/:childId/accessories/equip')
  @ApiOperation({
    summary: 'Equipar accesorio',
    description: 'Equipa un accesorio desbloqueado en la mascota',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({
    status: 200,
    description: 'Accesorio equipado',
    type: PetResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Accesorio no desbloqueado' })
  async equipAccessory(
    @Param('childId', ParseUUIDPipe) childId: string,
    @Body() dto: EquipAccessoryDto,
  ): Promise<PetResponseDto> {
    await this.petService.equipAccessory(childId, dto.accessoryId);
    return this.petService.getPetResponse(childId);
  }

  @Post('child/:childId/accessories/unequip')
  @ApiOperation({
    summary: 'Desequipar accesorio',
    description: 'Quita un accesorio equipado de la mascota',
  })
  @ApiParam({ name: 'childId', description: 'ID del perfil del niño' })
  @ApiResponse({
    status: 200,
    description: 'Accesorio desequipado',
    type: PetResponseDto,
  })
  async unequipAccessory(
    @Param('childId', ParseUUIDPipe) childId: string,
    @Body() dto: UnequipAccessoryDto,
  ): Promise<PetResponseDto> {
    await this.petService.unequipAccessory(childId, dto.accessoryType);
    return this.petService.getPetResponse(childId);
  }

  // ==================== UTILIDADES ====================

  @Get('variants')
  @ApiOperation({
    summary: 'Obtener variantes disponibles',
    description: 'Lista las variantes de color disponibles para la mascota',
  })
  @ApiResponse({ status: 200, description: 'Lista de variantes' })
  getVariants() {
    return this.petService.getAvailableVariants();
  }
}
