import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ChildSettings } from '../entities/child-profile.entity';

export class ChildProfileResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID único del perfil',
  })
  id: string;

  @ApiProperty({
    example: 'Sofía',
    description: 'Nombre del niño',
  })
  name: string;

  @ApiPropertyOptional({
    example: 'avatar_01',
    description: 'Identificador del avatar',
  })
  avatarId: string | null;

  @ApiPropertyOptional({
    example: 'https://storage.letrito.app/avatars/custom/abc123.png',
    description: 'URL del avatar personalizado',
  })
  avatarUrl: string | null;

  @ApiPropertyOptional({
    example: '2019-05-15',
    description: 'Fecha de nacimiento',
  })
  birthDate: string | null;

  @ApiPropertyOptional({
    example: 5,
    description: 'Edad del niño',
  })
  age: number | null;

  @ApiProperty({
    description: 'Configuración del perfil',
    example: {
      dailyTimeLimit: 30,
      allowedHours: { start: '08:00', end: '20:00' },
      soundEnabled: true,
      ttsEnabled: true,
      musicEnabled: true,
      hapticEnabled: true,
    },
  })
  settings: ChildSettings;

  @ApiProperty({
    example: true,
    description: 'Si el perfil está activo',
  })
  isActive: boolean;

  @ApiPropertyOptional({
    example: '2025-01-20T10:30:00.000Z',
    description: 'Última vez que jugó',
  })
  lastPlayedAt: string | null;

  @ApiProperty({
    example: '2025-01-20T10:30:00.000Z',
    description: 'Fecha de creación',
  })
  createdAt: string;

  @ApiProperty({
    example: '2025-01-20T10:30:00.000Z',
    description: 'Fecha de última actualización',
  })
  updatedAt: string;
}

export class ChildProfileListResponseDto {
  @ApiProperty({
    type: [ChildProfileResponseDto],
    description: 'Lista de perfiles de niños',
  })
  children: ChildProfileResponseDto[];

  @ApiProperty({
    example: 2,
    description: 'Total de perfiles',
  })
  total: number;
}
