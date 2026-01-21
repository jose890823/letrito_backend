import { ApiProperty } from '@nestjs/swagger';

export class ChildLevelResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del perfil del niño',
  })
  childProfileId: string;

  @ApiProperty({
    example: 3,
    description: 'Nivel de lectura de letras (1-5)',
  })
  lettersReadingLevel: number;

  @ApiProperty({
    example: 2,
    description: 'Nivel de escritura de letras (1-5)',
  })
  lettersWritingLevel: number;

  @ApiProperty({
    example: 2,
    description: 'Nivel de lectura de sílabas (1-5)',
  })
  syllablesReadingLevel: number;

  @ApiProperty({
    example: 1,
    description: 'Nivel de escritura de sílabas (1-5)',
  })
  syllablesWritingLevel: number;

  @ApiProperty({
    example: 1,
    description: 'Nivel de lectura de palabras (1-5)',
  })
  wordsReadingLevel: number;

  @ApiProperty({
    example: 1,
    description: 'Nivel de escritura de palabras (1-5)',
  })
  wordsWritingLevel: number;

  @ApiProperty({
    example: 3,
    description: 'Nivel general (1-10)',
  })
  overallLevel: number;

  @ApiProperty({
    example: 1250,
    description: 'XP total',
  })
  totalXp: number;

  @ApiProperty({
    example: 1500,
    description: 'XP necesario para siguiente nivel',
  })
  xpForNextLevel: number;

  @ApiProperty({
    example: 2.5,
    description: 'Promedio de todos los niveles',
  })
  averageLevel: number;

  @ApiProperty({
    example: 15,
    description: 'Letras dominadas',
  })
  lettersMastered: number;

  @ApiProperty({
    example: 8,
    description: 'Sílabas dominadas',
  })
  syllablesMastered: number;

  @ApiProperty({
    example: 3,
    description: 'Palabras dominadas',
  })
  wordsMastered: number;

  @ApiProperty({
    example: 26,
    description: 'Total de elementos dominados',
  })
  totalMastered: number;
}
