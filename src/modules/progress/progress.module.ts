import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningProgress } from './entities/learning-progress.entity';
import { LearningSession } from './entities/learning-session.entity';
import { ChildLevel } from './entities/child-level.entity';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { ChildrenProfilesModule } from '../children-profiles/children-profiles.module';

/**
 * Módulo de Progreso de Aprendizaje
 *
 * Gestiona el seguimiento del progreso de aprendizaje de lectura y escritura
 * de cada niño, incluyendo:
 *
 * Features:
 * - Registro de intentos individuales por elemento (letra, sílaba, palabra)
 * - Registro de sesiones de práctica completas
 * - Cálculo automático de niveles de dominio (mastery)
 * - Sistema de niveles por categoría (1-5) y nivel general (1-10)
 * - Sistema de XP y recompensas
 * - Recomendaciones inteligentes de elementos a practicar
 * - Dashboard para padres con actividad semanal y estadísticas
 * - Línea de tiempo de logros
 *
 * Entidades:
 * - LearningProgress: Progreso por elemento individual
 * - LearningSession: Sesiones de práctica completas
 * - ChildLevel: Cache de niveles calculados (1:1 con ChildProfile)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([LearningProgress, LearningSession, ChildLevel]),
    ChildrenProfilesModule,
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
