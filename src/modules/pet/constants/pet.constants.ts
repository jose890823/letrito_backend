import { EvolutionStage } from '../entities/pet.entity';
import {
  AccessoryType,
  AccessoryRarity,
  UnlockRequirementType,
} from '../entities/pet-accessory.entity';

/**
 * Requisitos de evolución por etapa
 */
export const EVOLUTION_REQUIREMENTS = {
  [EvolutionStage.EGG]: {
    nextStage: EvolutionStage.BABY,
    lettersMastered: 3,
    syllablesMastered: 0,
    wordsMastered: 0,
    message: '¡Tu mascota ha nacido! Sigue aprendiendo letras.',
  },
  [EvolutionStage.BABY]: {
    nextStage: EvolutionStage.CHILD,
    lettersMastered: 10,
    syllablesMastered: 0,
    wordsMastered: 0,
    message: '¡Tu mascota ha crecido! Ahora puede aprender sílabas.',
  },
  [EvolutionStage.CHILD]: {
    nextStage: EvolutionStage.TEEN,
    lettersMastered: 20,
    syllablesMastered: 10,
    wordsMastered: 0,
    message: '¡Tu mascota es un adolescente! Hora de aprender palabras.',
  },
  [EvolutionStage.TEEN]: {
    nextStage: EvolutionStage.ADULT,
    lettersMastered: 27,
    syllablesMastered: 30,
    wordsMastered: 20,
    message: '¡Felicidades! Tu mascota es un adulto. ¡Eres un experto!',
  },
  [EvolutionStage.ADULT]: {
    nextStage: null,
    lettersMastered: 27,
    syllablesMastered: 50,
    wordsMastered: 100,
    message: '¡Tu mascota ha alcanzado su máximo potencial!',
  },
};

/**
 * Tabla de experiencia por nivel
 * Nivel -> XP necesario para alcanzarlo
 */
export const LEVEL_EXPERIENCE_TABLE: Record<number, number> = {
  1: 0,
  2: 100,
  3: 250,
  4: 450,
  5: 700,
  6: 1000,
  7: 1400,
  8: 1900,
  9: 2500,
  10: 3200,
  11: 4000,
  12: 5000,
  13: 6200,
  14: 7600,
  15: 9200,
  16: 11000,
  17: 13000,
  18: 15500,
  19: 18500,
  20: 22000,
};

/**
 * XP necesario para el siguiente nivel
 */
export function getExperienceForNextLevel(currentLevel: number): number {
  const nextLevel = currentLevel + 1;
  if (nextLevel > 20) return 0; // Nivel máximo
  return (
    LEVEL_EXPERIENCE_TABLE[nextLevel] - LEVEL_EXPERIENCE_TABLE[currentLevel]
  );
}

/**
 * Calcular nivel basado en XP total
 */
export function calculateLevelFromXp(totalXp: number): number {
  let level = 1;
  for (let i = 2; i <= 20; i++) {
    if (totalXp >= LEVEL_EXPERIENCE_TABLE[i]) {
      level = i;
    } else {
      break;
    }
  }
  return level;
}

/**
 * Configuración de decaimiento de stats
 */
export const STAT_DECAY_CONFIG = {
  // Cada cuántas horas decae
  happinessDecayHours: 8,
  hungerIncreaseHours: 6,
  energyDecayHours: 12,

  // Cantidad de decaimiento por periodo
  happinessDecayAmount: 10,
  hungerIncreaseAmount: 15,
  energyDecayAmount: 5,

  // Mínimos y máximos
  minHappiness: 0,
  maxHappiness: 100,
  minHunger: 0,
  maxHunger: 100,
  minEnergy: 0,
  maxEnergy: 100,
};

/**
 * Bonificaciones por interacciones
 */
export const INTERACTION_BONUSES = {
  feed: {
    hungerReduction: 40,
    happinessGain: 10,
    experienceGain: 5,
    cooldownMinutes: 60, // Una vez por hora
  },
  play: {
    happinessGain: 25,
    energyCost: 15,
    experienceGain: 10,
    cooldownMinutes: 30,
  },
  pet: {
    happinessGain: 5,
    experienceGain: 2,
    cooldownMinutes: 5,
  },
  study: {
    // Bonus cuando el niño practica
    happinessGain: 3,
    experienceGain: 15,
  },
};

/**
 * Variantes de color disponibles para la mascota
 */
export const PET_VARIANTS = [
  { id: 'orange', name: 'Naranja', description: 'El zorrito clásico' },
  { id: 'red', name: 'Rojo', description: 'Un zorrito rojizo' },
  { id: 'white', name: 'Blanco', description: 'Zorrito ártico' },
  { id: 'gray', name: 'Gris', description: 'Zorrito plateado' },
  { id: 'golden', name: 'Dorado', description: 'Zorrito dorado especial' },
];

/**
 * Accesorios iniciales del sistema
 */
export const INITIAL_ACCESSORIES = [
  // === SOMBREROS ===
  {
    name: 'Gorro de Fiesta',
    description: '¡Para celebrar tus logros!',
    type: AccessoryType.HAT,
    rarity: AccessoryRarity.COMMON,
    assetId: 'hat_party',
    unlockRequirementType: UnlockRequirementType.FREE,
    unlockRequirementValue: 0,
    unlockMessage: 'Disponible desde el inicio',
    sortOrder: 1,
  },
  {
    name: 'Gorro de Graduación',
    description: 'Para los que dominan las letras',
    type: AccessoryType.HAT,
    rarity: AccessoryRarity.UNCOMMON,
    assetId: 'hat_graduation',
    unlockRequirementType: UnlockRequirementType.LETTERS_MASTERED,
    unlockRequirementValue: 10,
    unlockMessage: 'Domina 10 letras para desbloquear',
    sortOrder: 2,
  },
  {
    name: 'Corona de Rey',
    description: 'Para el rey de las palabras',
    type: AccessoryType.HAT,
    rarity: AccessoryRarity.EPIC,
    assetId: 'hat_crown',
    unlockRequirementType: UnlockRequirementType.WORDS_MASTERED,
    unlockRequirementValue: 50,
    unlockMessage: 'Domina 50 palabras para desbloquear',
    sortOrder: 3,
  },
  {
    name: 'Sombrero Mago',
    description: 'La magia de la lectura',
    type: AccessoryType.HAT,
    rarity: AccessoryRarity.LEGENDARY,
    assetId: 'hat_wizard',
    unlockRequirementType: UnlockRequirementType.LEVEL,
    unlockRequirementValue: 15,
    unlockMessage: 'Alcanza nivel 15 para desbloquear',
    sortOrder: 4,
  },

  // === LENTES ===
  {
    name: 'Lentes de Sol',
    description: 'Para verse cool',
    type: AccessoryType.GLASSES,
    rarity: AccessoryRarity.COMMON,
    assetId: 'glasses_sun',
    unlockRequirementType: UnlockRequirementType.FREE,
    unlockRequirementValue: 0,
    unlockMessage: 'Disponible desde el inicio',
    sortOrder: 10,
  },
  {
    name: 'Lentes de Lectura',
    description: 'Para leer mejor',
    type: AccessoryType.GLASSES,
    rarity: AccessoryRarity.UNCOMMON,
    assetId: 'glasses_reading',
    unlockRequirementType: UnlockRequirementType.SYLLABLES_MASTERED,
    unlockRequirementValue: 5,
    unlockMessage: 'Domina 5 sílabas para desbloquear',
    sortOrder: 11,
  },
  {
    name: 'Lentes de Estrella',
    description: '¡Eres una estrella!',
    type: AccessoryType.GLASSES,
    rarity: AccessoryRarity.RARE,
    assetId: 'glasses_star',
    unlockRequirementType: UnlockRequirementType.STREAK_DAYS,
    unlockRequirementValue: 7,
    unlockMessage: 'Mantén 7 días de racha para desbloquear',
    sortOrder: 12,
  },

  // === COLLARES ===
  {
    name: 'Collar Simple',
    description: 'Un collar básico',
    type: AccessoryType.COLLAR,
    rarity: AccessoryRarity.COMMON,
    assetId: 'collar_simple',
    unlockRequirementType: UnlockRequirementType.FREE,
    unlockRequirementValue: 0,
    unlockMessage: 'Disponible desde el inicio',
    sortOrder: 20,
  },
  {
    name: 'Collar de Letras',
    description: 'Con todas las letras del abecedario',
    type: AccessoryType.COLLAR,
    rarity: AccessoryRarity.RARE,
    assetId: 'collar_letters',
    unlockRequirementType: UnlockRequirementType.LETTERS_MASTERED,
    unlockRequirementValue: 27,
    unlockMessage: 'Domina todas las letras para desbloquear',
    sortOrder: 21,
  },
  {
    name: 'Medallón de Campeón',
    description: 'Para los verdaderos campeones',
    type: AccessoryType.COLLAR,
    rarity: AccessoryRarity.LEGENDARY,
    assetId: 'collar_champion',
    unlockRequirementType: UnlockRequirementType.TOTAL_XP,
    unlockRequirementValue: 10000,
    unlockMessage: 'Acumula 10,000 XP para desbloquear',
    sortOrder: 22,
  },

  // === FONDOS ===
  {
    name: 'Fondo Bosque',
    description: 'El hogar del zorrito',
    type: AccessoryType.BACKGROUND,
    rarity: AccessoryRarity.COMMON,
    assetId: 'bg_forest',
    unlockRequirementType: UnlockRequirementType.FREE,
    unlockRequirementValue: 0,
    unlockMessage: 'Disponible desde el inicio',
    sortOrder: 30,
  },
  {
    name: 'Fondo Biblioteca',
    description: 'Rodeado de libros',
    type: AccessoryType.BACKGROUND,
    rarity: AccessoryRarity.UNCOMMON,
    assetId: 'bg_library',
    unlockRequirementType: UnlockRequirementType.WORDS_MASTERED,
    unlockRequirementValue: 10,
    unlockMessage: 'Domina 10 palabras para desbloquear',
    sortOrder: 31,
  },
  {
    name: 'Fondo Espacio',
    description: '¡Hacia las estrellas!',
    type: AccessoryType.BACKGROUND,
    rarity: AccessoryRarity.EPIC,
    assetId: 'bg_space',
    unlockRequirementType: UnlockRequirementType.LEVEL,
    unlockRequirementValue: 10,
    unlockMessage: 'Alcanza nivel 10 para desbloquear',
    sortOrder: 32,
  },
  {
    name: 'Fondo Arcoíris',
    description: 'Un mundo de colores',
    type: AccessoryType.BACKGROUND,
    rarity: AccessoryRarity.LEGENDARY,
    assetId: 'bg_rainbow',
    unlockRequirementType: UnlockRequirementType.EVOLUTION_STAGE,
    unlockRequirementValue: 5, // ADULT stage
    unlockMessage: 'Evoluciona a la etapa adulta para desbloquear',
    sortOrder: 33,
  },

  // === TRAJES ===
  {
    name: 'Capa de Héroe',
    description: '¡Eres un superhéroe!',
    type: AccessoryType.OUTFIT,
    rarity: AccessoryRarity.RARE,
    assetId: 'outfit_hero',
    unlockRequirementType: UnlockRequirementType.STREAK_DAYS,
    unlockRequirementValue: 14,
    unlockMessage: 'Mantén 14 días de racha para desbloquear',
    sortOrder: 40,
  },
  {
    name: 'Traje de Científico',
    description: 'Para explorar el conocimiento',
    type: AccessoryType.OUTFIT,
    rarity: AccessoryRarity.EPIC,
    assetId: 'outfit_scientist',
    unlockRequirementType: UnlockRequirementType.SYLLABLES_MASTERED,
    unlockRequirementValue: 30,
    unlockMessage: 'Domina 30 sílabas para desbloquear',
    sortOrder: 41,
  },
];

/**
 * Mensajes de la mascota según su estado
 */
export const PET_MESSAGES = {
  greetings: {
    happy: [
      '¡Hola! ¡Qué bueno verte!',
      '¡Estoy muy feliz de verte!',
      '¡Vamos a aprender juntos!',
    ],
    sad: ['Te extrañé mucho...', '¡Por fin volviste!', 'Estaba esperándote...'],
    hungry: [
      'Tengo hambre...',
      '¿Me das de comer?',
      'Mi pancita hace ruidos...',
    ],
  },
  afterFeeding: [
    '¡Mmm, delicioso!',
    '¡Gracias por la comida!',
    '¡Estaba muy rico!',
  ],
  afterPlaying: [
    '¡Qué divertido!',
    '¡Me encanta jugar contigo!',
    '¡Otra vez, otra vez!',
  ],
  afterLearning: [
    '¡Muy bien! ¡Aprendimos algo nuevo!',
    '¡Eres muy inteligente!',
    '¡Sigue así, campeón!',
  ],
  evolution: [
    '¡Wow! ¡Estoy creciendo!',
    '¡Mira cómo he cambiado!',
    '¡Estoy evolucionando!',
  ],
};
