import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  ChildProfile,
  ChildSettings,
  DEFAULT_CHILD_SETTINGS,
} from './entities/child-profile.entity';
import {
  CreateChildProfileDto,
  UpdateChildProfileDto,
  UpdateChildSettingsDto,
  ChildProfileResponseDto,
} from './dto';

@Injectable()
export class ChildrenProfilesService {
  private readonly logger = new Logger(ChildrenProfilesService.name);
  private readonly maxChildrenPerParent: number;

  constructor(
    @InjectRepository(ChildProfile)
    private readonly childProfileRepository: Repository<ChildProfile>,
    private readonly configService: ConfigService,
  ) {
    this.maxChildrenPerParent = this.configService.get<number>(
      'MAX_CHILDREN_PER_PARENT',
      5,
    );
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Obtener todos los perfiles de niños de un padre
   */
  async findAllByParent(parentId: string): Promise<ChildProfile[]> {
    return this.childProfileRepository.find({
      where: { parentId, isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Obtener todos los perfiles (incluyendo inactivos) de un padre
   */
  async findAllByParentIncludeInactive(
    parentId: string,
  ): Promise<ChildProfile[]> {
    return this.childProfileRepository.find({
      where: { parentId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Obtener un perfil por ID
   * @throws NotFoundException si no existe
   */
  async findById(id: string): Promise<ChildProfile> {
    const profile = await this.childProfileRepository.findOne({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de niño no encontrado');
    }

    return profile;
  }

  /**
   * Obtener un perfil verificando que pertenece al padre
   * @throws NotFoundException si no existe
   * @throws ForbiddenException si no pertenece al padre
   */
  async findByIdAndParent(id: string, parentId: string): Promise<ChildProfile> {
    const profile = await this.findById(id);

    if (profile.parentId !== parentId) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a este perfil',
      );
    }

    return profile;
  }

  /**
   * Crear un nuevo perfil de niño
   * @throws BadRequestException si excede el límite de perfiles
   */
  async create(
    parentId: string,
    dto: CreateChildProfileDto,
  ): Promise<ChildProfile> {
    // Verificar límite de perfiles
    const existingCount = await this.childProfileRepository.count({
      where: { parentId },
    });

    if (existingCount >= this.maxChildrenPerParent) {
      throw new BadRequestException(
        `Has alcanzado el límite máximo de ${this.maxChildrenPerParent} perfiles de niños`,
      );
    }

    // Preparar configuración con valores por defecto
    const settings: ChildSettings = {
      ...DEFAULT_CHILD_SETTINGS,
      ...(dto.settings || {}),
    };

    // Crear el perfil
    const profile = this.childProfileRepository.create({
      name: dto.name,
      avatarId: dto.avatarId || null,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
      age: dto.age || null,
      settings,
      parentId,
    });

    const savedProfile = await this.childProfileRepository.save(profile);

    this.logger.log(
      `Perfil de niño creado: ${savedProfile.id} para padre ${parentId}`,
    );

    return savedProfile;
  }

  /**
   * Actualizar un perfil de niño
   * @throws NotFoundException si no existe
   * @throws ForbiddenException si no pertenece al padre
   */
  async update(
    id: string,
    parentId: string,
    dto: UpdateChildProfileDto,
  ): Promise<ChildProfile> {
    const profile = await this.findByIdAndParent(id, parentId);

    // Actualizar campos proporcionados
    if (dto.name !== undefined) profile.name = dto.name;
    if (dto.avatarId !== undefined) profile.avatarId = dto.avatarId;
    if (dto.avatarUrl !== undefined) profile.avatarUrl = dto.avatarUrl;
    if (dto.birthDate !== undefined) {
      profile.birthDate = dto.birthDate ? new Date(dto.birthDate) : null;
    }
    if (dto.age !== undefined) profile.age = dto.age;
    if (dto.isActive !== undefined) profile.isActive = dto.isActive;

    const updatedProfile = await this.childProfileRepository.save(profile);

    this.logger.log(`Perfil de niño actualizado: ${id}`);

    return updatedProfile;
  }

  /**
   * Actualizar configuración de un perfil
   * @throws NotFoundException si no existe
   * @throws ForbiddenException si no pertenece al padre
   */
  async updateSettings(
    id: string,
    parentId: string,
    dto: UpdateChildSettingsDto,
  ): Promise<ChildProfile> {
    const profile = await this.findByIdAndParent(id, parentId);

    // Construir nueva configuración manualmente para manejar null -> undefined
    const newSettings: ChildSettings = { ...profile.settings };

    // Manejar dailyTimeLimit: null significa quitar límite
    if (dto.dailyTimeLimit !== undefined) {
      if (dto.dailyTimeLimit === null) {
        delete newSettings.dailyTimeLimit;
      } else {
        newSettings.dailyTimeLimit = dto.dailyTimeLimit;
      }
    }

    // Manejar allowedHours: null significa quitar restricción
    if (dto.allowedHours !== undefined) {
      if (dto.allowedHours === null) {
        delete newSettings.allowedHours;
      } else {
        newSettings.allowedHours = {
          start:
            dto.allowedHours.start ??
            newSettings.allowedHours?.start ??
            '00:00',
          end: dto.allowedHours.end ?? newSettings.allowedHours?.end ?? '23:59',
        };
      }
    }

    // Actualizar booleanos si están presentes
    if (dto.soundEnabled !== undefined)
      newSettings.soundEnabled = dto.soundEnabled;
    if (dto.ttsEnabled !== undefined) newSettings.ttsEnabled = dto.ttsEnabled;
    if (dto.musicEnabled !== undefined)
      newSettings.musicEnabled = dto.musicEnabled;
    if (dto.hapticEnabled !== undefined)
      newSettings.hapticEnabled = dto.hapticEnabled;

    profile.settings = newSettings;

    const updatedProfile = await this.childProfileRepository.save(profile);

    this.logger.log(`Configuración actualizada para perfil: ${id}`);

    return updatedProfile;
  }

  /**
   * Eliminar un perfil (soft delete)
   * @throws NotFoundException si no existe
   * @throws ForbiddenException si no pertenece al padre
   */
  async delete(id: string, parentId: string): Promise<void> {
    const profile = await this.findByIdAndParent(id, parentId);

    await this.childProfileRepository.softDelete(profile.id);

    this.logger.log(`Perfil de niño eliminado (soft): ${id}`);
  }

  /**
   * Eliminar un perfil permanentemente (hard delete)
   * Solo para admins o casos especiales
   */
  async hardDelete(id: string): Promise<void> {
    const profile = await this.childProfileRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!profile) {
      throw new NotFoundException('Perfil de niño no encontrado');
    }

    await this.childProfileRepository.remove(profile);

    this.logger.log(`Perfil de niño eliminado permanentemente: ${id}`);
  }

  // ============================================
  // OPERACIONES ADICIONALES
  // ============================================

  /**
   * Actualizar última vez que jugó
   */
  async updateLastPlayed(id: string): Promise<void> {
    await this.childProfileRepository.update(id, {
      lastPlayedAt: new Date(),
    });
  }

  /**
   * Contar perfiles activos de un padre
   */
  async countByParent(parentId: string): Promise<number> {
    return this.childProfileRepository.count({
      where: { parentId, isActive: true },
    });
  }

  /**
   * Verificar si el padre puede crear más perfiles
   */
  async canCreateMore(parentId: string): Promise<boolean> {
    const count = await this.countByParent(parentId);
    return count < this.maxChildrenPerParent;
  }

  // ============================================
  // MAPEO A DTO
  // ============================================

  /**
   * Convertir entidad a DTO de respuesta
   */
  toResponseDto(profile: ChildProfile): ChildProfileResponseDto {
    return {
      id: profile.id,
      name: profile.name,
      avatarId: profile.avatarId,
      avatarUrl: profile.avatarUrl,
      birthDate: profile.birthDate?.toISOString().split('T')[0] || null,
      age: profile.calculatedAge,
      settings: profile.settings,
      isActive: profile.isActive,
      lastPlayedAt: profile.lastPlayedAt?.toISOString() || null,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
