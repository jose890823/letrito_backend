import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { ElementType, SkillType } from '../entities/learning-progress.entity';

export class RecordAttemptDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del perfil del niño',
  })
  @IsNotEmpty({ message: 'El ID del perfil del niño es obligatorio' })
  @IsString({ message: 'El ID del perfil debe ser una cadena de texto' })
  childProfileId: string;

  @ApiProperty({
    example: 'letter',
    description: 'Tipo de elemento (letra, sílaba, palabra)',
    enum: ElementType,
  })
  @IsNotEmpty({ message: 'El tipo de elemento es obligatorio' })
  @IsEnum(ElementType, {
    message: 'El tipo de elemento debe ser letter, syllable o word',
  })
  elementType: ElementType;

  @ApiProperty({
    example: 'A',
    description: 'Identificador del elemento (la letra, sílaba o palabra)',
  })
  @IsNotEmpty({ message: 'El ID del elemento es obligatorio' })
  @IsString({ message: 'El ID del elemento debe ser una cadena de texto' })
  @MaxLength(50, {
    message: 'El ID del elemento no debe exceder 50 caracteres',
  })
  elementId: string;

  @ApiProperty({
    example: 'reading',
    description: 'Tipo de habilidad (lectura o escritura)',
    enum: SkillType,
  })
  @IsNotEmpty({ message: 'El tipo de habilidad es obligatorio' })
  @IsEnum(SkillType, {
    message: 'El tipo de habilidad debe ser reading o writing',
  })
  skillType: SkillType;

  @ApiProperty({
    example: true,
    description: 'Si el intento fue correcto',
  })
  @IsNotEmpty({ message: 'El resultado del intento es obligatorio' })
  @IsBoolean({ message: 'El resultado debe ser verdadero o falso' })
  correct: boolean;

  @ApiProperty({
    example: 1500,
    description: 'Tiempo de respuesta en milisegundos',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El tiempo de respuesta debe ser un número' })
  @Min(0, { message: 'El tiempo de respuesta no puede ser negativo' })
  responseTimeMs?: number;

  @ApiProperty({
    example: 'B',
    description: 'Respuesta dada por el niño (si aplica)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La respuesta dada debe ser una cadena de texto' })
  @MaxLength(100, {
    message: 'La respuesta dada no debe exceder 100 caracteres',
  })
  givenAnswer?: string;
}
