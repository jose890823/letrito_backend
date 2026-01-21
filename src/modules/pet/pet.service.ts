import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet, EvolutionStage } from './entities/pet.entity';
import { PetAccessory } from './entities/pet-accessory.entity';
import {
  EVOLUTION_REQUIREMENTS,
  INTERACTION_BONUSES,
  STAT_DECAY_CONFIG,
  INITIAL_ACCESSORIES,
  PET_MESSAGES,
  PET_VARIANTS,
  getExperienceForNextLevel,
} from './constants/pet.constants';
import {
  PetResponseDto,
  InteractionResultDto,
  AccessoryResponseDto,
  AccessorySummaryDto,
} from './dto';
import { ChildProfile } from '../children-profiles/entities/child-profile.entity';
import { ChildLevel } from '../progress/entities/child-level.entity';

@Injectable()
export class PetService {
  private readonly logger = new Logger(PetService.name);

  constructor(
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
    @InjectRepository(PetAccessory)
    private readonly accessoryRepository: Repository<PetAccessory>,
    @InjectRepository(ChildProfile)
    private readonly childProfileRepository: Repository<ChildProfile>,
    @InjectRepository(ChildLevel)
    private readonly childLevelRepository: Repository<ChildLevel>,
  ) {}

  /**
   * Crear mascota para un niño
   */
  async createPetForChild(childProfileId: string, name?: string): Promise<Pet> {
    // Verificar que el niño existe
    const childProfile = await this.childProfileRepository.findOne({
      where: { id: childProfileId },
    });
    if (!childProfile) {
      throw new NotFoundException('Perfil del niño no encontrado');
    }

    // Verificar que no tenga mascota ya
    const existingPet = await this.petRepository.findOne({
      where: { childProfileId },
    });
    if (existingPet) {
      throw new ConflictException('El niño ya tiene una mascota');
    }

    const pet = this.petRepository.create({
      childProfileId,
      name: name || 'Letrito',
      level: 1,
      experience: 0,
      experienceToNextLevel: getExperienceForNextLevel(1),
      evolutionStage: EvolutionStage.EGG,
      happiness: 100,
      energy: 100,
      hunger: 0,
      variant: 'orange',
      equippedAccessories: {},
      unlockedAccessoryIds: [],
      lastInteractionAt: new Date(),
    });

    const savedPet = await this.petRepository.save(pet);
    this.logger.log(`Mascota creada para niño ${childProfileId}`);

    // Desbloquear accesorios gratuitos
    await this.checkAndUnlockAccessories(savedPet);

    return savedPet;
  }

  /**
   * Obtener mascota por ID de niño
   */
  async getPetByChildId(childProfileId: string): Promise<Pet> {
    const pet = await this.petRepository.findOne({
      where: { childProfileId },
    });

    if (!pet) {
      throw new NotFoundException('El niño no tiene mascota');
    }

    // Aplicar decaimiento de stats basado en tiempo
    await this.applyStatDecay(pet);

    return pet;
  }

  /**
   * Obtener mascota con datos completos para respuesta
   */
  async getPetResponse(childProfileId: string): Promise<PetResponseDto> {
    const pet = await this.getPetByChildId(childProfileId);
    return this.toPetResponseDto(pet);
  }

  /**
   * Alimentar a la mascota
   */
  async feedPet(childProfileId: string): Promise<InteractionResultDto> {
    const pet = await this.getPetByChildId(childProfileId);
    const now = new Date();

    // Verificar cooldown
    const cooldownMs = INTERACTION_BONUSES.feed.cooldownMinutes * 60 * 1000;
    if (
      pet.lastFedAt &&
      now.getTime() - new Date(pet.lastFedAt).getTime() < cooldownMs
    ) {
      const minutesRemaining = Math.ceil(
        (cooldownMs - (now.getTime() - new Date(pet.lastFedAt).getTime())) /
          60000,
      );
      throw new BadRequestException(
        `Debes esperar ${minutesRemaining} minutos para alimentar de nuevo`,
      );
    }

    // Aplicar bonificaciones
    const bonus = INTERACTION_BONUSES.feed;
    const oldHappiness = pet.happiness;
    const oldHunger = pet.hunger;

    pet.hunger = Math.max(0, pet.hunger - bonus.hungerReduction);
    pet.happiness = Math.min(100, pet.happiness + bonus.happinessGain);
    pet.experience += bonus.experienceGain;
    pet.lastFedAt = now;
    pet.lastInteractionAt = now;
    pet.totalTimesFed += 1;

    // Verificar si sube de nivel
    const leveledUp = this.checkLevelUp(pet);

    // Verificar evolución
    const evolved = await this.checkEvolution(pet, childProfileId);

    await this.petRepository.save(pet);

    // Verificar nuevos accesorios
    const newAccessories = await this.checkAndUnlockAccessories(pet);

    const message = this.getRandomMessage(PET_MESSAGES.afterFeeding);

    return {
      success: true,
      message,
      experienceGained: bonus.experienceGain,
      happinessChange: pet.happiness - oldHappiness,
      energyChange: 0,
      hungerChange: pet.hunger - oldHunger,
      newHappiness: pet.happiness,
      newEnergy: pet.energy,
      newHunger: pet.hunger,
      newMood: pet.getMood(),
      leveledUp,
      newLevel: leveledUp ? pet.level : null,
      evolved,
      newEvolutionStage: evolved ? pet.evolutionStage : null,
      evolutionMessage: evolved
        ? EVOLUTION_REQUIREMENTS[pet.evolutionStage]?.message || null
        : null,
      newAccessoriesUnlocked: newAccessories,
      cooldownMinutes: bonus.cooldownMinutes,
    };
  }

  /**
   * Jugar con la mascota
   */
  async playWithPet(childProfileId: string): Promise<InteractionResultDto> {
    const pet = await this.getPetByChildId(childProfileId);
    const now = new Date();

    // Verificar cooldown
    const cooldownMs = INTERACTION_BONUSES.play.cooldownMinutes * 60 * 1000;
    if (
      pet.lastPlayedAt &&
      now.getTime() - new Date(pet.lastPlayedAt).getTime() < cooldownMs
    ) {
      const minutesRemaining = Math.ceil(
        (cooldownMs - (now.getTime() - new Date(pet.lastPlayedAt).getTime())) /
          60000,
      );
      throw new BadRequestException(
        `Debes esperar ${minutesRemaining} minutos para jugar de nuevo`,
      );
    }

    // Verificar energía suficiente
    if (pet.energy < INTERACTION_BONUSES.play.energyCost) {
      throw new BadRequestException(
        'Tu mascota no tiene suficiente energía para jugar',
      );
    }

    // Aplicar bonificaciones
    const bonus = INTERACTION_BONUSES.play;
    const oldHappiness = pet.happiness;
    const oldEnergy = pet.energy;

    pet.happiness = Math.min(100, pet.happiness + bonus.happinessGain);
    pet.energy = Math.max(0, pet.energy - bonus.energyCost);
    pet.experience += bonus.experienceGain;
    pet.lastPlayedAt = now;
    pet.lastInteractionAt = now;
    pet.totalTimesPlayed += 1;

    // Actualizar racha de interacción
    this.updateInteractionStreak(pet);

    // Verificar si sube de nivel
    const leveledUp = this.checkLevelUp(pet);

    // Verificar evolución
    const evolved = await this.checkEvolution(pet, childProfileId);

    await this.petRepository.save(pet);

    // Verificar nuevos accesorios
    const newAccessories = await this.checkAndUnlockAccessories(pet);

    const message = this.getRandomMessage(PET_MESSAGES.afterPlaying);

    return {
      success: true,
      message,
      experienceGained: bonus.experienceGain,
      happinessChange: pet.happiness - oldHappiness,
      energyChange: pet.energy - oldEnergy,
      hungerChange: 0,
      newHappiness: pet.happiness,
      newEnergy: pet.energy,
      newHunger: pet.hunger,
      newMood: pet.getMood(),
      leveledUp,
      newLevel: leveledUp ? pet.level : null,
      evolved,
      newEvolutionStage: evolved ? pet.evolutionStage : null,
      evolutionMessage: evolved
        ? EVOLUTION_REQUIREMENTS[pet.evolutionStage]?.message || null
        : null,
      newAccessoriesUnlocked: newAccessories,
      cooldownMinutes: bonus.cooldownMinutes,
    };
  }

  /**
   * Acariciar a la mascota (interacción rápida)
   */
  async petThePet(childProfileId: string): Promise<InteractionResultDto> {
    const pet = await this.getPetByChildId(childProfileId);
    const now = new Date();

    // Aplicar bonificaciones (sin cooldown estricto, solo XP reducido)
    const bonus = INTERACTION_BONUSES.pet;
    const oldHappiness = pet.happiness;

    pet.happiness = Math.min(100, pet.happiness + bonus.happinessGain);
    pet.experience += bonus.experienceGain;
    pet.lastInteractionAt = now;

    // Verificar si sube de nivel
    const leveledUp = this.checkLevelUp(pet);

    await this.petRepository.save(pet);

    // Verificar nuevos accesorios
    const newAccessories = await this.checkAndUnlockAccessories(pet);

    return {
      success: true,
      message: '¡A tu mascota le gusta!',
      experienceGained: bonus.experienceGain,
      happinessChange: pet.happiness - oldHappiness,
      energyChange: 0,
      hungerChange: 0,
      newHappiness: pet.happiness,
      newEnergy: pet.energy,
      newHunger: pet.hunger,
      newMood: pet.getMood(),
      leveledUp,
      newLevel: leveledUp ? pet.level : null,
      evolved: false,
      newEvolutionStage: null,
      evolutionMessage: null,
      newAccessoriesUnlocked: newAccessories,
      cooldownMinutes: bonus.cooldownMinutes,
    };
  }

  /**
   * Recompensa por estudiar (llamado desde ProgressService)
   */
  async rewardForStudying(
    childProfileId: string,
    correct: boolean,
  ): Promise<void> {
    try {
      const pet = await this.petRepository.findOne({
        where: { childProfileId },
      });

      if (!pet) return;

      const bonus = INTERACTION_BONUSES.study;
      if (correct) {
        pet.happiness = Math.min(100, pet.happiness + bonus.happinessGain);
        pet.experience += bonus.experienceGain;
        pet.lastInteractionAt = new Date();

        this.checkLevelUp(pet);
        await this.checkEvolution(pet, childProfileId);
        await this.petRepository.save(pet);
      }
    } catch (error) {
      this.logger.warn(`Error al recompensar mascota: ${error}`);
    }
  }

  /**
   * Actualizar nombre de la mascota
   */
  async updatePetName(childProfileId: string, name: string): Promise<Pet> {
    const pet = await this.getPetByChildId(childProfileId);
    pet.name = name;
    return this.petRepository.save(pet);
  }

  /**
   * Actualizar variante de la mascota
   */
  async updatePetVariant(
    childProfileId: string,
    variant: string,
  ): Promise<Pet> {
    const validVariant = PET_VARIANTS.find((v) => v.id === variant);
    if (!validVariant) {
      throw new BadRequestException('Variante no válida');
    }

    const pet = await this.getPetByChildId(childProfileId);
    pet.variant = variant;
    return this.petRepository.save(pet);
  }

  /**
   * Equipar accesorio
   */
  async equipAccessory(
    childProfileId: string,
    accessoryId: string,
  ): Promise<Pet> {
    const pet = await this.getPetByChildId(childProfileId);

    // Verificar que el accesorio existe
    const accessory = await this.accessoryRepository.findOne({
      where: { id: accessoryId, isActive: true },
    });
    if (!accessory) {
      throw new NotFoundException('Accesorio no encontrado');
    }

    // Verificar que está desbloqueado
    if (!pet.unlockedAccessoryIds.includes(accessoryId)) {
      throw new BadRequestException('Este accesorio no está desbloqueado');
    }

    // Equipar (reemplaza el del mismo tipo)
    pet.equippedAccessories = {
      ...pet.equippedAccessories,
      [accessory.type]: accessoryId,
    };

    return this.petRepository.save(pet);
  }

  /**
   * Desequipar accesorio
   */
  async unequipAccessory(
    childProfileId: string,
    accessoryType: string,
  ): Promise<Pet> {
    const pet = await this.getPetByChildId(childProfileId);

    if (!pet.equippedAccessories[accessoryType]) {
      throw new BadRequestException('No hay accesorio de ese tipo equipado');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [accessoryType]: _removed, ...rest } = pet.equippedAccessories;
    pet.equippedAccessories = rest;

    return this.petRepository.save(pet);
  }

  /**
   * Obtener todos los accesorios con estado de desbloqueo
   */
  async getAccessoriesForChild(
    childProfileId: string,
  ): Promise<AccessoryResponseDto[]> {
    const pet = await this.getPetByChildId(childProfileId);
    const childLevel = await this.childLevelRepository.findOne({
      where: { childProfileId },
    });

    const accessories = await this.accessoryRepository.find({
      where: { isActive: true },
      order: { type: 'ASC', sortOrder: 'ASC' },
    });

    const progress = {
      petLevel: pet.level,
      lettersMastered: childLevel?.lettersMastered ?? 0,
      syllablesMastered: childLevel?.syllablesMastered ?? 0,
      wordsMastered: childLevel?.wordsMastered ?? 0,
      evolutionStage: pet.evolutionStage,
      streakDays: pet.interactionStreak,
      totalXp: childLevel?.totalXp ?? 0,
    };

    return accessories.map((acc) =>
      this.toAccessoryResponseDto(acc, pet, progress),
    );
  }

  /**
   * Obtener resumen de accesorios
   */
  async getAccessorySummary(
    childProfileId: string,
  ): Promise<AccessorySummaryDto> {
    const accessories = await this.getAccessoriesForChild(childProfileId);

    const totalAccessories = accessories.length;
    const unlockedCount = accessories.filter((a) => a.isUnlocked).length;
    const equippedCount = accessories.filter((a) => a.isEquipped).length;

    // Encontrar próximo a desbloquear
    const nextToUnlock =
      accessories
        .filter((a) => !a.isUnlocked)
        .sort((a, b) => b.unlockProgress - a.unlockProgress)[0] || null;

    return {
      totalAccessories,
      unlockedCount,
      equippedCount,
      collectionPercentage: Math.round(
        (unlockedCount / totalAccessories) * 100,
      ),
      nextToUnlock,
    };
  }

  /**
   * Obtener variantes disponibles
   */
  getAvailableVariants() {
    return PET_VARIANTS;
  }

  /**
   * Sembrar accesorios iniciales (para seeder)
   */
  async seedAccessories(): Promise<void> {
    const existingCount = await this.accessoryRepository.count();
    if (existingCount > 0) {
      this.logger.log('Accesorios ya existen, saltando seed');
      return;
    }

    for (const accessoryData of INITIAL_ACCESSORIES) {
      const accessory = this.accessoryRepository.create(accessoryData);
      await this.accessoryRepository.save(accessory);
    }

    this.logger.log(
      `${INITIAL_ACCESSORIES.length} accesorios iniciales creados`,
    );
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Aplicar decaimiento de stats basado en tiempo
   */
  private async applyStatDecay(pet: Pet): Promise<void> {
    if (!pet.lastInteractionAt) return;

    const now = new Date();
    const lastInteraction = new Date(pet.lastInteractionAt);
    const hoursSinceInteraction =
      (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60);

    let changed = false;

    // Decaer felicidad
    const happinessDecayPeriods = Math.floor(
      hoursSinceInteraction / STAT_DECAY_CONFIG.happinessDecayHours,
    );
    if (happinessDecayPeriods > 0) {
      pet.happiness = Math.max(
        STAT_DECAY_CONFIG.minHappiness,
        pet.happiness -
          happinessDecayPeriods * STAT_DECAY_CONFIG.happinessDecayAmount,
      );
      changed = true;
    }

    // Aumentar hambre
    const hungerIncreasePeriods = Math.floor(
      hoursSinceInteraction / STAT_DECAY_CONFIG.hungerIncreaseHours,
    );
    if (hungerIncreasePeriods > 0) {
      pet.hunger = Math.min(
        STAT_DECAY_CONFIG.maxHunger,
        pet.hunger +
          hungerIncreasePeriods * STAT_DECAY_CONFIG.hungerIncreaseAmount,
      );
      changed = true;
    }

    // Recuperar energía (con el tiempo)
    const energyRecoveryPeriods = Math.floor(
      hoursSinceInteraction / STAT_DECAY_CONFIG.energyDecayHours,
    );
    if (energyRecoveryPeriods > 0 && pet.energy < 100) {
      pet.energy = Math.min(100, pet.energy + energyRecoveryPeriods * 10);
      changed = true;
    }

    if (changed) {
      await this.petRepository.save(pet);
    }
  }

  /**
   * Verificar y aplicar subida de nivel
   */
  private checkLevelUp(pet: Pet): boolean {
    const xpForNext = getExperienceForNextLevel(pet.level);
    if (xpForNext === 0) return false; // Nivel máximo

    if (pet.experience >= pet.experienceToNextLevel + xpForNext) {
      pet.level += 1;
      pet.experienceToNextLevel = getExperienceForNextLevel(pet.level);
      this.logger.log(`Mascota ${pet.id} subió a nivel ${pet.level}`);
      return true;
    }

    return false;
  }

  /**
   * Verificar y aplicar evolución
   */
  private async checkEvolution(
    pet: Pet,
    childProfileId: string,
  ): Promise<boolean> {
    const childLevel = await this.childLevelRepository.findOne({
      where: { childProfileId },
    });

    if (!childLevel) return false;

    const requirement = EVOLUTION_REQUIREMENTS[pet.evolutionStage];
    if (!requirement || !requirement.nextStage) return false;

    const canEvolve =
      childLevel.lettersMastered >= requirement.lettersMastered &&
      childLevel.syllablesMastered >= requirement.syllablesMastered &&
      childLevel.wordsMastered >= requirement.wordsMastered;

    if (canEvolve) {
      pet.evolutionStage = requirement.nextStage;
      this.logger.log(`Mascota ${pet.id} evolucionó a ${pet.evolutionStage}`);
      return true;
    }

    return false;
  }

  /**
   * Actualizar racha de interacción diaria
   */
  private updateInteractionStreak(pet: Pet): void {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (pet.lastInteractionAt) {
      const lastDate = new Date(pet.lastInteractionAt)
        .toISOString()
        .split('T')[0];

      if (lastDate === today) {
        // Ya interactuó hoy, no hacer nada
        return;
      }

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastDate === yesterdayStr) {
        // Interactuó ayer, aumentar racha
        pet.interactionStreak += 1;
        if (pet.interactionStreak > pet.bestInteractionStreak) {
          pet.bestInteractionStreak = pet.interactionStreak;
        }
      } else {
        // Perdió la racha
        pet.interactionStreak = 1;
      }
    } else {
      pet.interactionStreak = 1;
    }
  }

  /**
   * Verificar y desbloquear nuevos accesorios
   */
  private async checkAndUnlockAccessories(pet: Pet): Promise<string[]> {
    const childLevel = await this.childLevelRepository.findOne({
      where: { childProfileId: pet.childProfileId },
    });

    const progress = {
      petLevel: pet.level,
      lettersMastered: childLevel?.lettersMastered ?? 0,
      syllablesMastered: childLevel?.syllablesMastered ?? 0,
      wordsMastered: childLevel?.wordsMastered ?? 0,
      evolutionStage: pet.evolutionStage,
      streakDays: pet.interactionStreak,
      totalXp: childLevel?.totalXp ?? 0,
    };

    const allAccessories = await this.accessoryRepository.find({
      where: { isActive: true },
    });

    const newlyUnlocked: string[] = [];

    for (const accessory of allAccessories) {
      if (
        !pet.unlockedAccessoryIds.includes(accessory.id) &&
        accessory.isUnlocked(progress)
      ) {
        pet.unlockedAccessoryIds.push(accessory.id);
        newlyUnlocked.push(accessory.name);
      }
    }

    if (newlyUnlocked.length > 0) {
      await this.petRepository.save(pet);
      this.logger.log(
        `Nuevos accesorios desbloqueados: ${newlyUnlocked.join(', ')}`,
      );
    }

    return newlyUnlocked;
  }

  /**
   * Obtener mensaje aleatorio de una lista
   */
  private getRandomMessage(messages: string[]): string {
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Convertir Pet a DTO de respuesta
   */
  private toPetResponseDto(pet: Pet): PetResponseDto {
    const now = new Date();
    const xpForNext = getExperienceForNextLevel(pet.level);

    // Calcular cooldowns
    let canFeed = true;
    let minutesUntilCanFeed = 0;
    if (pet.lastFedAt) {
      const cooldownMs = INTERACTION_BONUSES.feed.cooldownMinutes * 60 * 1000;
      const timeSinceFeed = now.getTime() - new Date(pet.lastFedAt).getTime();
      if (timeSinceFeed < cooldownMs) {
        canFeed = false;
        minutesUntilCanFeed = Math.ceil((cooldownMs - timeSinceFeed) / 60000);
      }
    }

    let canPlay = true;
    let minutesUntilCanPlay = 0;
    if (pet.lastPlayedAt) {
      const cooldownMs = INTERACTION_BONUSES.play.cooldownMinutes * 60 * 1000;
      const timeSincePlay =
        now.getTime() - new Date(pet.lastPlayedAt).getTime();
      if (timeSincePlay < cooldownMs) {
        canPlay = false;
        minutesUntilCanPlay = Math.ceil((cooldownMs - timeSincePlay) / 60000);
      }
    }

    // También verificar energía para jugar
    if (pet.energy < INTERACTION_BONUSES.play.energyCost) {
      canPlay = false;
    }

    return {
      id: pet.id,
      childProfileId: pet.childProfileId,
      name: pet.name,
      level: pet.level,
      experience: pet.experience,
      experienceToNextLevel: xpForNext,
      levelProgress:
        xpForNext > 0 ? Math.round((pet.experience / xpForNext) * 100) : 100,
      evolutionStage: pet.evolutionStage,
      happiness: pet.happiness,
      energy: pet.energy,
      hunger: pet.hunger,
      mood: pet.getMood(),
      variant: pet.variant,
      equippedAccessories: pet.equippedAccessories,
      needsAttention: pet.needsAttention(),
      canFeed,
      canPlay,
      minutesUntilCanFeed,
      minutesUntilCanPlay,
      interactionStreak: pet.interactionStreak,
      lastInteractionAt: pet.lastInteractionAt?.toISOString() ?? null,
      createdAt: pet.createdAt.toISOString(),
    };
  }

  /**
   * Convertir Accessory a DTO
   */
  private toAccessoryResponseDto(
    accessory: PetAccessory,
    pet: Pet,
    progress: Record<string, number | string>,
  ): AccessoryResponseDto {
    const isUnlocked = pet.unlockedAccessoryIds.includes(accessory.id);
    const isEquipped = Object.values(pet.equippedAccessories).includes(
      accessory.id,
    );

    // Calcular progreso hacia desbloqueo
    let unlockProgress = 0;
    if (!isUnlocked) {
      const currentValue =
        (progress[
          this.getProgressKey(accessory.unlockRequirementType)
        ] as number) || 0;
      unlockProgress = Math.min(
        100,
        Math.round((currentValue / accessory.unlockRequirementValue) * 100),
      );
    } else {
      unlockProgress = 100;
    }

    return {
      id: accessory.id,
      name: accessory.name,
      description: accessory.description,
      type: accessory.type,
      rarity: accessory.rarity,
      assetId: accessory.assetId,
      imageUrl: accessory.imageUrl,
      unlockRequirementType: accessory.unlockRequirementType,
      unlockRequirementValue: accessory.unlockRequirementValue,
      unlockMessage: accessory.unlockMessage,
      isUnlocked,
      isEquipped,
      unlockProgress,
    };
  }

  /**
   * Obtener key de progreso según tipo de requisito
   */
  private getProgressKey(type: string): string {
    const mapping: Record<string, string> = {
      level: 'petLevel',
      letters_mastered: 'lettersMastered',
      syllables_mastered: 'syllablesMastered',
      words_mastered: 'wordsMastered',
      streak_days: 'streakDays',
      total_xp: 'totalXp',
    };
    return mapping[type] || type;
  }
}
