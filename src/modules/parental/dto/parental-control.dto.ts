import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsString,
  Min,
  Max,
  Matches,
  Length,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from '../entities/parental-control.entity';
import type {
  TimeRange,
  DaySchedule,
  NotificationSettings,
} from '../entities/parental-control.entity';

// ==================== SUB-DTOs ====================

export class TimeRangeDto implements TimeRange {
  @ApiProperty({
    description: 'Hora de inicio (HH:mm)',
    example: '08:00',
  })
  @IsString({ message: 'La hora de inicio debe ser texto' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Formato de hora inválido. Use HH:mm (ej: 08:00)',
  })
  start: string;

  @ApiProperty({
    description: 'Hora de fin (HH:mm)',
    example: '20:00',
  })
  @IsString({ message: 'La hora de fin debe ser texto' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Formato de hora inválido. Use HH:mm (ej: 20:00)',
  })
  end: string;
}

export class DayScheduleDto implements DaySchedule {
  @ApiProperty({
    description: 'Día de la semana',
    enum: DayOfWeek,
    example: DayOfWeek.MONDAY,
  })
  @IsEnum(DayOfWeek, { message: 'Día de la semana inválido' })
  day: DayOfWeek;

  @ApiProperty({
    description: 'Si el día está habilitado',
    example: true,
  })
  @IsBoolean({ message: 'enabled debe ser booleano' })
  enabled: boolean;

  @ApiProperty({
    description: 'Rangos de tiempo permitidos',
    type: [TimeRangeDto],
  })
  @IsArray({ message: 'timeRanges debe ser un array' })
  @ValidateNested({ each: true })
  @Type(() => TimeRangeDto)
  timeRanges: TimeRangeDto[];
}

export class NotificationSettingsDto {
  @ApiPropertyOptional({ description: 'Notificar al iniciar sesión' })
  @IsOptional()
  @IsBoolean()
  onSessionStart?: boolean;

  @ApiPropertyOptional({ description: 'Notificar al terminar sesión' })
  @IsOptional()
  @IsBoolean()
  onSessionEnd?: boolean;

  @ApiPropertyOptional({ description: 'Notificar al alcanzar límite diario' })
  @IsOptional()
  @IsBoolean()
  onDailyLimitReached?: boolean;

  @ApiPropertyOptional({ description: 'Notificar al alcanzar límite semanal' })
  @IsOptional()
  @IsBoolean()
  onWeeklyLimitReached?: boolean;

  @ApiPropertyOptional({ description: 'Notificar logros desbloqueados' })
  @IsOptional()
  @IsBoolean()
  onAchievementUnlocked?: boolean;

  @ApiPropertyOptional({ description: 'Notificar nuevas letras dominadas' })
  @IsOptional()
  @IsBoolean()
  onNewLetterMastered?: boolean;

  @ApiPropertyOptional({ description: 'Notificar hitos de racha' })
  @IsOptional()
  @IsBoolean()
  onStreakMilestone?: boolean;

  @ApiPropertyOptional({ description: 'Enviar resumen diario' })
  @IsOptional()
  @IsBoolean()
  dailySummary?: boolean;

  @ApiPropertyOptional({ description: 'Enviar resumen semanal' })
  @IsOptional()
  @IsBoolean()
  weeklySummary?: boolean;
}

// ==================== REQUEST DTOs ====================

export class SetPinDto {
  @ApiProperty({
    description: 'PIN de 4 dígitos',
    example: '1234',
    minLength: 4,
    maxLength: 4,
  })
  @IsString({ message: 'El PIN debe ser texto' })
  @Length(4, 4, { message: 'El PIN debe tener exactamente 4 dígitos' })
  @Matches(/^\d{4}$/, { message: 'El PIN debe contener solo números' })
  pin: string;
}

export class VerifyPinDto {
  @ApiProperty({
    description: 'PIN a verificar',
    example: '1234',
  })
  @IsString({ message: 'El PIN debe ser texto' })
  @Length(4, 4, { message: 'El PIN debe tener exactamente 4 dígitos' })
  @Matches(/^\d{4}$/, { message: 'El PIN debe contener solo números' })
  pin: string;
}

export class UpdateParentalControlDto {
  @ApiPropertyOptional({
    description: 'Límite diario en minutos (null para sin límite)',
    example: 60,
    minimum: 15,
    maximum: 480,
  })
  @IsOptional()
  @IsInt({ message: 'El límite diario debe ser un número entero' })
  @Min(15, { message: 'El límite diario mínimo es 15 minutos' })
  @Max(480, { message: 'El límite diario máximo es 480 minutos (8 horas)' })
  dailyTimeLimitMinutes?: number | null;

  @ApiPropertyOptional({
    description: 'Límite semanal en minutos (null para sin límite)',
    example: 300,
    minimum: 60,
    maximum: 2100,
  })
  @IsOptional()
  @IsInt({ message: 'El límite semanal debe ser un número entero' })
  @Min(60, { message: 'El límite semanal mínimo es 60 minutos' })
  @Max(2100, { message: 'El límite semanal máximo es 2100 minutos (35 horas)' })
  weeklyTimeLimitMinutes?: number | null;

  @ApiPropertyOptional({
    description: 'Duración máxima de sesión continua (minutos)',
    example: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(120)
  maxSessionDurationMinutes?: number | null;

  @ApiPropertyOptional({
    description: 'Tiempo de descanso entre sesiones (minutos)',
    example: 15,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(60)
  breakDurationMinutes?: number | null;

  @ApiPropertyOptional({
    description: 'Horario semanal',
    type: [DayScheduleDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayScheduleDto)
  @ArrayMinSize(0)
  weeklySchedule?: DayScheduleDto[];

  @ApiPropertyOptional({
    description: 'Bloqueo estricto fuera de horario',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  strictScheduleEnforcement?: boolean;

  @ApiPropertyOptional({
    description: 'Configuración de notificaciones',
    type: NotificationSettingsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notifications?: NotificationSettingsDto;

  @ApiPropertyOptional({
    description: 'Permitir interacción con mascota',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  allowPetInteraction?: boolean;

  @ApiPropertyOptional({
    description: 'Permitir cambios en el perfil',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  allowProfileChanges?: boolean;
}

export class ApplyPresetDto {
  @ApiProperty({
    description: 'Nombre del preset a aplicar',
    example: 'MODERATE',
    enum: ['UNRESTRICTED', 'MODERATE', 'RESTRICTED', 'WEEKENDS_ONLY'],
  })
  @IsString()
  @IsEnum(['UNRESTRICTED', 'MODERATE', 'RESTRICTED', 'WEEKENDS_ONLY'], {
    message: 'Preset inválido',
  })
  preset: 'UNRESTRICTED' | 'MODERATE' | 'RESTRICTED' | 'WEEKENDS_ONLY';
}

// ==================== RESPONSE DTOs ====================

export class ParentalControlResponseDto {
  @ApiProperty({ description: 'ID del control parental' })
  id: string;

  @ApiProperty({ description: 'ID del perfil del niño' })
  childProfileId: string;

  @ApiProperty({ description: 'PIN habilitado' })
  pinEnabled: boolean;

  @ApiProperty({ description: 'Límite diario en minutos', nullable: true })
  dailyTimeLimitMinutes: number | null;

  @ApiProperty({ description: 'Límite semanal en minutos', nullable: true })
  weeklyTimeLimitMinutes: number | null;

  @ApiProperty({ description: 'Duración máxima de sesión', nullable: true })
  maxSessionDurationMinutes: number | null;

  @ApiProperty({ description: 'Duración del descanso', nullable: true })
  breakDurationMinutes: number | null;

  @ApiProperty({ description: 'Horario semanal', type: [DayScheduleDto] })
  weeklySchedule: DayScheduleDto[];

  @ApiProperty({ description: 'Bloqueo estricto de horario' })
  strictScheduleEnforcement: boolean;

  @ApiProperty({
    description: 'Configuración de notificaciones',
    example: {
      onSessionStart: false,
      onSessionEnd: false,
      onDailyLimitReached: true,
      onWeeklyLimitReached: true,
      onAchievementUnlocked: true,
      onNewLetterMastered: true,
      onStreakMilestone: true,
      dailySummary: true,
      weeklySummary: true,
    },
  })
  notifications: NotificationSettingsDto;

  @ApiProperty({ description: 'Permitir interacción con mascota' })
  allowPetInteraction: boolean;

  @ApiProperty({ description: 'Permitir cambios en perfil' })
  allowProfileChanges: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;
}

export class PinVerificationResponseDto {
  @ApiProperty({ description: 'Indica si el PIN es correcto' })
  valid: boolean;

  @ApiProperty({
    description: 'Intentos restantes antes del bloqueo',
    nullable: true,
  })
  attemptsRemaining: number | null;

  @ApiProperty({
    description: 'Indica si el PIN está bloqueado',
  })
  locked: boolean;

  @ApiProperty({
    description: 'Minutos hasta que se desbloquee',
    nullable: true,
  })
  lockedForMinutes: number | null;
}

export class AccessStatusResponseDto {
  @ApiProperty({ description: 'Si el acceso está permitido ahora' })
  allowed: boolean;

  @ApiProperty({ description: 'Razón si no está permitido', nullable: true })
  reason: string | null;

  @ApiProperty({ description: 'Si está dentro del horario permitido' })
  withinSchedule: boolean;

  @ApiProperty({ description: 'Si hay tiempo disponible hoy' })
  hasTimeRemaining: boolean;

  @ApiProperty({ description: 'Minutos usados hoy' })
  minutesUsedToday: number;

  @ApiProperty({ description: 'Minutos restantes hoy', nullable: true })
  minutesRemainingToday: number | null;

  @ApiProperty({ description: 'Minutos usados esta semana' })
  minutesUsedThisWeek: number;

  @ApiProperty({ description: 'Minutos restantes esta semana', nullable: true })
  minutesRemainingThisWeek: number | null;

  @ApiProperty({ description: 'Próximo horario permitido', nullable: true })
  nextAllowedTime: string | null;
}
