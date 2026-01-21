import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  MaxLength,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ElementType, SkillType } from '../entities/learning-progress.entity';

export class SessionExerciseResultDto {
  @ApiProperty({
    example: 'letter',
    description: 'Tipo de elemento',
    enum: ElementType,
  })
  @IsNotEmpty({ message: 'El tipo de elemento es obligatorio' })
  @IsEnum(ElementType, {
    message: 'El tipo de elemento debe ser letter, syllable o word',
  })
  elementType: ElementType;

  @ApiProperty({
    example: 'A',
    description: 'ID del elemento',
  })
  @IsNotEmpty({ message: 'El ID del elemento es obligatorio' })
  @IsString({ message: 'El ID del elemento debe ser una cadena de texto' })
  @MaxLength(50, {
    message: 'El ID del elemento no debe exceder 50 caracteres',
  })
  elementId: string;

  @ApiProperty({
    example: 'reading',
    description: 'Tipo de habilidad',
    enum: SkillType,
  })
  @IsNotEmpty({ message: 'El tipo de habilidad es obligatorio' })
  @IsEnum(SkillType, {
    message: 'El tipo de habilidad debe ser reading o writing',
  })
  skillType: SkillType;

  @ApiProperty({
    example: true,
    description: 'Si fue correcto',
  })
  @IsNotEmpty({ message: 'El resultado es obligatorio' })
  @IsBoolean({ message: 'El resultado debe ser verdadero o falso' })
  correct: boolean;

  @ApiProperty({
    example: 1200,
    description: 'Tiempo de respuesta en ms',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El tiempo de respuesta debe ser un número' })
  @Min(0, { message: 'El tiempo de respuesta no puede ser negativo' })
  responseTimeMs?: number;

  @ApiProperty({
    example: 'B',
    description: 'Respuesta dada por el niño',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La respuesta dada debe ser una cadena de texto' })
  @MaxLength(100, {
    message: 'La respuesta dada no debe exceder 100 caracteres',
  })
  givenAnswer?: string;
}

export class RecordSessionDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del perfil del niño',
  })
  @IsNotEmpty({ message: 'El ID del perfil del niño es obligatorio' })
  @IsString({ message: 'El ID del perfil debe ser una cadena de texto' })
  childProfileId: string;

  @ApiProperty({
    example: 15,
    description: 'Duración de la sesión en minutos',
  })
  @IsNotEmpty({ message: 'La duración de la sesión es obligatoria' })
  @IsNumber({}, { message: 'La duración debe ser un número' })
  @Min(1, { message: 'La duración debe ser al menos 1 minuto' })
  durationMinutes: number;

  @ApiProperty({
    type: [SessionExerciseResultDto],
    description: 'Resultados de los ejercicios de la sesión',
  })
  @IsArray({ message: 'Los resultados deben ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => SessionExerciseResultDto)
  results: SessionExerciseResultDto[];

  @ApiProperty({
    example: 'letters',
    description: 'Área de enfoque de la sesión',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El área de enfoque debe ser una cadena de texto' })
  @MaxLength(50, {
    message: 'El área de enfoque no debe exceder 50 caracteres',
  })
  focusArea?: string;
}
