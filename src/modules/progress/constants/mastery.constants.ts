import {
  MasteryLevel,
  ElementType,
} from '../entities/learning-progress.entity';

/**
 * Criterios para cada nivel de dominio
 */
export interface MasteryCriteria {
  /** Nivel de dominio */
  level: MasteryLevel;
  /** Mínimo de intentos requeridos */
  minAttempts: number;
  /** Mínimo de precisión requerida (0-1) */
  minAccuracy: number;
  /** Mínimo de racha requerida */
  minStreak: number;
}

/**
 * Criterios de dominio por nivel
 */
export const MASTERY_CRITERIA: MasteryCriteria[] = [
  {
    level: MasteryLevel.NOT_STARTED,
    minAttempts: 0,
    minAccuracy: 0,
    minStreak: 0,
  },
  {
    level: MasteryLevel.LEARNING,
    minAttempts: 1,
    minAccuracy: 0,
    minStreak: 0,
  },
  {
    level: MasteryLevel.PRACTICING,
    minAttempts: 5,
    minAccuracy: 0.6,
    minStreak: 2,
  },
  {
    level: MasteryLevel.MASTERED,
    minAttempts: 10,
    minAccuracy: 0.85,
    minStreak: 5,
  },
];

/**
 * Obtiene los criterios para un nivel específico
 */
export function getMasteryCriteria(level: MasteryLevel): MasteryCriteria {
  return MASTERY_CRITERIA.find((c) => c.level === level) || MASTERY_CRITERIA[0];
}

/**
 * Determina el nivel de dominio basado en estadísticas
 */
export function calculateMasteryLevel(
  totalAttempts: number,
  accuracyRate: number,
  currentStreak: number,
): MasteryLevel {
  // Verificar de mayor a menor nivel
  const masteredCriteria = getMasteryCriteria(MasteryLevel.MASTERED);
  if (
    totalAttempts >= masteredCriteria.minAttempts &&
    accuracyRate >= masteredCriteria.minAccuracy &&
    currentStreak >= masteredCriteria.minStreak
  ) {
    return MasteryLevel.MASTERED;
  }

  const practicingCriteria = getMasteryCriteria(MasteryLevel.PRACTICING);
  if (
    totalAttempts >= practicingCriteria.minAttempts &&
    accuracyRate >= practicingCriteria.minAccuracy &&
    currentStreak >= practicingCriteria.minStreak
  ) {
    return MasteryLevel.PRACTICING;
  }

  const learningCriteria = getMasteryCriteria(MasteryLevel.LEARNING);
  if (totalAttempts >= learningCriteria.minAttempts) {
    return MasteryLevel.LEARNING;
  }

  return MasteryLevel.NOT_STARTED;
}

/**
 * Total de letras en español (incluyendo ñ)
 */
export const TOTAL_LETTERS = 27;

/**
 * Configuración de niveles por categoría
 */
export interface LevelThreshold {
  /** Nivel (1-5) */
  level: number;
  /** Porcentaje mínimo de elementos dominados */
  minMasteredPercent: number;
}

/**
 * Umbrales de nivel para letras (27 total)
 * - Nivel 2: 20% dominadas (5-6 letras)
 * - Nivel 3: 40% dominadas (10-11 letras)
 * - Nivel 4: 60% dominadas (16-17 letras)
 * - Nivel 5: 85% dominadas (23+ letras)
 */
export const LETTERS_LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, minMasteredPercent: 0 },
  { level: 2, minMasteredPercent: 0.2 },
  { level: 3, minMasteredPercent: 0.4 },
  { level: 4, minMasteredPercent: 0.6 },
  { level: 5, minMasteredPercent: 0.85 },
];

/**
 * Umbrales de nivel para sílabas
 */
export const SYLLABLES_LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, minMasteredPercent: 0 },
  { level: 2, minMasteredPercent: 0.15 },
  { level: 3, minMasteredPercent: 0.35 },
  { level: 4, minMasteredPercent: 0.55 },
  { level: 5, minMasteredPercent: 0.8 },
];

/**
 * Umbrales de nivel para palabras
 */
export const WORDS_LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, minMasteredPercent: 0 },
  { level: 2, minMasteredPercent: 0.1 },
  { level: 3, minMasteredPercent: 0.25 },
  { level: 4, minMasteredPercent: 0.45 },
  { level: 5, minMasteredPercent: 0.7 },
];

/**
 * Obtiene los umbrales según el tipo de elemento
 */
export function getLevelThresholds(elementType: ElementType): LevelThreshold[] {
  switch (elementType) {
    case ElementType.LETTER:
      return LETTERS_LEVEL_THRESHOLDS;
    case ElementType.SYLLABLE:
      return SYLLABLES_LEVEL_THRESHOLDS;
    case ElementType.WORD:
      return WORDS_LEVEL_THRESHOLDS;
    default:
      return LETTERS_LEVEL_THRESHOLDS;
  }
}

/**
 * Calcula el nivel basado en elementos dominados
 */
export function calculateLevel(
  masteredCount: number,
  totalCount: number,
  thresholds: LevelThreshold[],
): number {
  if (totalCount === 0) return 1;

  const masteredPercent = masteredCount / totalCount;
  let level = 1;

  for (const threshold of thresholds) {
    if (masteredPercent >= threshold.minMasteredPercent) {
      level = threshold.level;
    }
  }

  return level;
}

/**
 * XP otorgado por tipo de acción
 */
export const XP_REWARDS = {
  /** XP por ejercicio correcto */
  CORRECT_ANSWER: 10,
  /** XP adicional por racha de 3 */
  STREAK_BONUS_3: 5,
  /** XP adicional por racha de 5 */
  STREAK_BONUS_5: 10,
  /** XP adicional por racha de 10 */
  STREAK_BONUS_10: 25,
  /** XP por dominar un elemento (letra/sílaba/palabra) */
  ELEMENT_MASTERED: 50,
  /** XP por completar una sesión */
  SESSION_COMPLETED: 20,
  /** XP adicional por sesión con >80% precisión */
  HIGH_ACCURACY_SESSION: 15,
};

/**
 * Umbrales para nivel general (1-10)
 */
export const OVERALL_LEVEL_XP_THRESHOLDS = [
  { level: 1, minXp: 0 },
  { level: 2, minXp: 100 },
  { level: 3, minXp: 300 },
  { level: 4, minXp: 600 },
  { level: 5, minXp: 1000 },
  { level: 6, minXp: 1500 },
  { level: 7, minXp: 2200 },
  { level: 8, minXp: 3000 },
  { level: 9, minXp: 4000 },
  { level: 10, minXp: 5500 },
];

/**
 * Calcula el nivel general basado en XP
 */
export function calculateOverallLevel(totalXp: number): number {
  let level = 1;

  for (const threshold of OVERALL_LEVEL_XP_THRESHOLDS) {
    if (totalXp >= threshold.minXp) {
      level = threshold.level;
    }
  }

  return level;
}

/**
 * Calcula XP para el siguiente nivel
 */
export function getXpForNextLevel(currentLevel: number): number {
  const nextLevel = currentLevel + 1;
  const threshold = OVERALL_LEVEL_XP_THRESHOLDS.find(
    (t) => t.level === nextLevel,
  );
  return (
    threshold?.minXp ??
    OVERALL_LEVEL_XP_THRESHOLDS[OVERALL_LEVEL_XP_THRESHOLDS.length - 1].minXp
  );
}
