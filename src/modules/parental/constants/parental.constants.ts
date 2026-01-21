import {
  DayOfWeek,
  DaySchedule,
  NotificationSettings,
} from '../entities/parental-control.entity';
import {
  ActivityType,
  ActivitySeverity,
} from '../entities/activity-log.entity';

// ==================== LÍMITES DE TIEMPO ====================

/**
 * Límites de tiempo predeterminados (en minutos)
 */
export const TIME_LIMITS = {
  /** Límite diario mínimo permitido */
  MIN_DAILY_LIMIT: 15,
  /** Límite diario máximo permitido */
  MAX_DAILY_LIMIT: 480, // 8 horas
  /** Límite diario recomendado para niños */
  RECOMMENDED_DAILY_LIMIT: 60,

  /** Límite semanal mínimo */
  MIN_WEEKLY_LIMIT: 60,
  /** Límite semanal máximo */
  MAX_WEEKLY_LIMIT: 2100, // 35 horas
  /** Límite semanal recomendado */
  RECOMMENDED_WEEKLY_LIMIT: 300, // 5 horas

  /** Duración mínima de sesión para contar */
  MIN_SESSION_DURATION: 1,
  /** Duración máxima de sesión continua recomendada */
  RECOMMENDED_MAX_SESSION: 30,

  /** Descanso mínimo entre sesiones */
  MIN_BREAK_DURATION: 5,
  /** Descanso recomendado entre sesiones */
  RECOMMENDED_BREAK_DURATION: 15,
} as const;

// ==================== PIN PARENTAL ====================

/**
 * Configuración del PIN parental
 */
export const PIN_CONFIG = {
  /** Longitud del PIN */
  PIN_LENGTH: 4,
  /** Máximo de intentos antes de bloqueo */
  MAX_ATTEMPTS: 5,
  /** Tiempo de bloqueo en minutos tras exceder intentos */
  LOCKOUT_DURATION_MINUTES: 30,
  /** Segundos entre intentos para rate limiting */
  ATTEMPT_COOLDOWN_SECONDS: 3,
} as const;

// ==================== HORARIOS ====================

/**
 * Horario predeterminado (todos los días habilitados, 8am-8pm)
 */
export const DEFAULT_WEEKLY_SCHEDULE: DaySchedule[] = [
  {
    day: DayOfWeek.MONDAY,
    enabled: true,
    timeRanges: [{ start: '08:00', end: '20:00' }],
  },
  {
    day: DayOfWeek.TUESDAY,
    enabled: true,
    timeRanges: [{ start: '08:00', end: '20:00' }],
  },
  {
    day: DayOfWeek.WEDNESDAY,
    enabled: true,
    timeRanges: [{ start: '08:00', end: '20:00' }],
  },
  {
    day: DayOfWeek.THURSDAY,
    enabled: true,
    timeRanges: [{ start: '08:00', end: '20:00' }],
  },
  {
    day: DayOfWeek.FRIDAY,
    enabled: true,
    timeRanges: [{ start: '08:00', end: '20:00' }],
  },
  {
    day: DayOfWeek.SATURDAY,
    enabled: true,
    timeRanges: [{ start: '09:00', end: '21:00' }],
  },
  {
    day: DayOfWeek.SUNDAY,
    enabled: true,
    timeRanges: [{ start: '09:00', end: '21:00' }],
  },
];

/**
 * Horario para días de semana (lunes a viernes)
 */
export const WEEKDAY_SCHEDULE: DaySchedule[] = [
  {
    day: DayOfWeek.MONDAY,
    enabled: true,
    timeRanges: [
      { start: '07:00', end: '08:00' },
      { start: '15:00', end: '20:00' },
    ],
  },
  {
    day: DayOfWeek.TUESDAY,
    enabled: true,
    timeRanges: [
      { start: '07:00', end: '08:00' },
      { start: '15:00', end: '20:00' },
    ],
  },
  {
    day: DayOfWeek.WEDNESDAY,
    enabled: true,
    timeRanges: [
      { start: '07:00', end: '08:00' },
      { start: '15:00', end: '20:00' },
    ],
  },
  {
    day: DayOfWeek.THURSDAY,
    enabled: true,
    timeRanges: [
      { start: '07:00', end: '08:00' },
      { start: '15:00', end: '20:00' },
    ],
  },
  {
    day: DayOfWeek.FRIDAY,
    enabled: true,
    timeRanges: [
      { start: '07:00', end: '08:00' },
      { start: '15:00', end: '21:00' },
    ],
  },
  {
    day: DayOfWeek.SATURDAY,
    enabled: true,
    timeRanges: [{ start: '08:00', end: '21:00' }],
  },
  {
    day: DayOfWeek.SUNDAY,
    enabled: true,
    timeRanges: [{ start: '08:00', end: '20:00' }],
  },
];

// ==================== NOTIFICACIONES ====================

/**
 * Configuración de notificaciones predeterminada
 */
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  onSessionStart: false,
  onSessionEnd: false,
  onDailyLimitReached: true,
  onWeeklyLimitReached: true,
  onAchievementUnlocked: true,
  onNewLetterMastered: true,
  onStreakMilestone: true,
  dailySummary: true,
  weeklySummary: true,
};

/**
 * Configuración de notificaciones mínima (solo alertas)
 */
export const MINIMAL_NOTIFICATION_SETTINGS: NotificationSettings = {
  onSessionStart: false,
  onSessionEnd: false,
  onDailyLimitReached: true,
  onWeeklyLimitReached: true,
  onAchievementUnlocked: false,
  onNewLetterMastered: false,
  onStreakMilestone: false,
  dailySummary: false,
  weeklySummary: true,
};

// ==================== MENSAJES DE ACTIVIDAD ====================

/**
 * Títulos predeterminados para cada tipo de actividad
 */
export const ACTIVITY_TITLES: Record<ActivityType, string> = {
  // Sesiones
  [ActivityType.SESSION_START]: 'Sesión iniciada',
  [ActivityType.SESSION_END]: 'Sesión finalizada',
  [ActivityType.SESSION_PAUSED]: 'Sesión pausada',
  [ActivityType.SESSION_RESUMED]: 'Sesión reanudada',

  // Límites
  [ActivityType.DAILY_LIMIT_WARNING]: 'Cerca del límite diario',
  [ActivityType.DAILY_LIMIT_REACHED]: 'Límite diario alcanzado',
  [ActivityType.WEEKLY_LIMIT_REACHED]: 'Límite semanal alcanzado',
  [ActivityType.BREAK_REMINDER]: 'Recordatorio de descanso',

  // Horarios
  [ActivityType.OUTSIDE_SCHEDULE_ATTEMPT]: 'Intento fuera de horario',
  [ActivityType.SCHEDULE_BLOCK_START]: 'Horario bloqueado iniciado',
  [ActivityType.SCHEDULE_BLOCK_END]: 'Horario bloqueado finalizado',

  // Logros
  [ActivityType.LETTER_MASTERED]: 'Nueva letra dominada',
  [ActivityType.SYLLABLE_MASTERED]: 'Nueva sílaba dominada',
  [ActivityType.WORD_MASTERED]: 'Nueva palabra dominada',
  [ActivityType.LEVEL_UP]: 'Subió de nivel',
  [ActivityType.STREAK_MILESTONE]: 'Hito de racha alcanzado',
  [ActivityType.ACHIEVEMENT_UNLOCKED]: 'Logro desbloqueado',

  // Mascota
  [ActivityType.PET_EVOLUTION]: 'Mascota evolucionó',
  [ActivityType.PET_ACCESSORY_UNLOCKED]: 'Nuevo accesorio desbloqueado',
  [ActivityType.PET_LOW_HAPPINESS]: 'Mascota triste',

  // Configuración
  [ActivityType.SETTINGS_CHANGED]: 'Configuración modificada',
  [ActivityType.PIN_CHANGED]: 'PIN cambiado',
  [ActivityType.PIN_FAILED_ATTEMPT]: 'Intento de PIN fallido',
  [ActivityType.PIN_LOCKED]: 'PIN bloqueado',
};

/**
 * Severidad predeterminada para cada tipo de actividad
 */
export const ACTIVITY_SEVERITIES: Record<ActivityType, ActivitySeverity> = {
  // Sesiones - INFO
  [ActivityType.SESSION_START]: ActivitySeverity.INFO,
  [ActivityType.SESSION_END]: ActivitySeverity.INFO,
  [ActivityType.SESSION_PAUSED]: ActivitySeverity.INFO,
  [ActivityType.SESSION_RESUMED]: ActivitySeverity.INFO,

  // Límites - WARNING/ALERT
  [ActivityType.DAILY_LIMIT_WARNING]: ActivitySeverity.WARNING,
  [ActivityType.DAILY_LIMIT_REACHED]: ActivitySeverity.ALERT,
  [ActivityType.WEEKLY_LIMIT_REACHED]: ActivitySeverity.ALERT,
  [ActivityType.BREAK_REMINDER]: ActivitySeverity.WARNING,

  // Horarios - WARNING
  [ActivityType.OUTSIDE_SCHEDULE_ATTEMPT]: ActivitySeverity.WARNING,
  [ActivityType.SCHEDULE_BLOCK_START]: ActivitySeverity.INFO,
  [ActivityType.SCHEDULE_BLOCK_END]: ActivitySeverity.INFO,

  // Logros - SUCCESS
  [ActivityType.LETTER_MASTERED]: ActivitySeverity.SUCCESS,
  [ActivityType.SYLLABLE_MASTERED]: ActivitySeverity.SUCCESS,
  [ActivityType.WORD_MASTERED]: ActivitySeverity.SUCCESS,
  [ActivityType.LEVEL_UP]: ActivitySeverity.SUCCESS,
  [ActivityType.STREAK_MILESTONE]: ActivitySeverity.SUCCESS,
  [ActivityType.ACHIEVEMENT_UNLOCKED]: ActivitySeverity.SUCCESS,

  // Mascota - SUCCESS/WARNING
  [ActivityType.PET_EVOLUTION]: ActivitySeverity.SUCCESS,
  [ActivityType.PET_ACCESSORY_UNLOCKED]: ActivitySeverity.SUCCESS,
  [ActivityType.PET_LOW_HAPPINESS]: ActivitySeverity.WARNING,

  // Configuración - INFO/WARNING
  [ActivityType.SETTINGS_CHANGED]: ActivitySeverity.INFO,
  [ActivityType.PIN_CHANGED]: ActivitySeverity.INFO,
  [ActivityType.PIN_FAILED_ATTEMPT]: ActivitySeverity.WARNING,
  [ActivityType.PIN_LOCKED]: ActivitySeverity.ALERT,
};

// ==================== REPORTES ====================

/**
 * Configuración de reportes
 */
export const REPORT_CONFIG = {
  /** Días de historial para reporte semanal */
  WEEKLY_REPORT_DAYS: 7,
  /** Días de historial para reporte mensual */
  MONTHLY_REPORT_DAYS: 30,
  /** Máximo de eventos en timeline */
  MAX_TIMELINE_EVENTS: 100,
  /** Días de retención de logs de actividad */
  ACTIVITY_LOG_RETENTION_DAYS: 90,
} as const;

// ==================== PRESETS DE CONFIGURACIÓN ====================

/**
 * Presets de configuración parental
 */
export const PARENTAL_PRESETS = {
  /** Sin restricciones */
  UNRESTRICTED: {
    name: 'Sin restricciones',
    description: 'Sin límites de tiempo ni horarios',
    dailyTimeLimitMinutes: null,
    weeklyTimeLimitMinutes: null,
    weeklySchedule: [],
    strictScheduleEnforcement: false,
  },

  /** Uso moderado */
  MODERATE: {
    name: 'Uso moderado',
    description: '1 hora diaria, 5 horas semanales',
    dailyTimeLimitMinutes: 60,
    weeklyTimeLimitMinutes: 300,
    weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
    strictScheduleEnforcement: false,
  },

  /** Uso restringido */
  RESTRICTED: {
    name: 'Uso restringido',
    description: '30 minutos diarios, horarios de escuela',
    dailyTimeLimitMinutes: 30,
    weeklyTimeLimitMinutes: 150,
    weeklySchedule: WEEKDAY_SCHEDULE,
    strictScheduleEnforcement: true,
  },

  /** Solo fines de semana */
  WEEKENDS_ONLY: {
    name: 'Solo fines de semana',
    description: 'Acceso solo sábados y domingos',
    dailyTimeLimitMinutes: 90,
    weeklyTimeLimitMinutes: 180,
    weeklySchedule: [
      { day: DayOfWeek.MONDAY, enabled: false, timeRanges: [] },
      { day: DayOfWeek.TUESDAY, enabled: false, timeRanges: [] },
      { day: DayOfWeek.WEDNESDAY, enabled: false, timeRanges: [] },
      { day: DayOfWeek.THURSDAY, enabled: false, timeRanges: [] },
      { day: DayOfWeek.FRIDAY, enabled: false, timeRanges: [] },
      {
        day: DayOfWeek.SATURDAY,
        enabled: true,
        timeRanges: [{ start: '09:00', end: '20:00' }],
      },
      {
        day: DayOfWeek.SUNDAY,
        enabled: true,
        timeRanges: [{ start: '09:00', end: '19:00' }],
      },
    ],
    strictScheduleEnforcement: true,
  },
} as const;

// ==================== UMBRALES DE ALERTA ====================

/**
 * Umbrales para generar alertas
 */
export const ALERT_THRESHOLDS = {
  /** Porcentaje del límite diario para advertencia */
  DAILY_LIMIT_WARNING_PERCENT: 80,
  /** Porcentaje del límite semanal para advertencia */
  WEEKLY_LIMIT_WARNING_PERCENT: 80,
  /** Nivel de felicidad de mascota para alerta */
  PET_LOW_HAPPINESS_THRESHOLD: 20,
  /** Días sin actividad para alerta de inactividad */
  INACTIVITY_DAYS_THRESHOLD: 7,
} as const;
