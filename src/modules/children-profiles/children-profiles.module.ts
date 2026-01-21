import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ChildProfile } from './entities/child-profile.entity';
import { ChildrenProfilesService } from './children-profiles.service';
import { ChildrenProfilesController } from './children-profiles.controller';

/**
 * Módulo de Perfiles de Niños
 *
 * Gestiona los perfiles de niños asociados a un padre/tutor.
 * Cada padre puede tener múltiples perfiles de niños, cada uno con
 * su propia configuración y progreso.
 *
 * Features:
 * - CRUD de perfiles de niños
 * - Configuración individual por perfil (límites, sonidos, etc.)
 * - Soft delete para eliminación segura
 * - Límite configurable de perfiles por padre
 */
@Module({
  imports: [TypeOrmModule.forFeature([ChildProfile]), ConfigModule],
  controllers: [ChildrenProfilesController],
  providers: [ChildrenProfilesService],
  exports: [ChildrenProfilesService],
})
export class ChildrenProfilesModule {}
