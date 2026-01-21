import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionEvent } from './entities/session-event.entity';
import { DailyUsage } from './entities/daily-usage.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsAdminController } from './analytics-admin.controller';
import { ChildrenProfilesModule } from '../children-profiles/children-profiles.module';

/**
 * Módulo de Analytics
 *
 * Gestiona el registro y análisis de eventos de uso de la aplicación
 * para cada niño, incluyendo:
 *
 * Features:
 * - Registro de eventos de sesión en batch
 * - Uso diario agregado automáticamente
 * - Reportes semanales con comparativas
 * - Reportes completos con tendencias y recomendaciones
 * - Identificación de áreas de mejora
 * - Mensajes motivacionales personalizados
 *
 * Entidades:
 * - SessionEvent: Eventos individuales de sesión
 * - DailyUsage: Uso diario agregado por niño
 *
 * Endpoints (User):
 * - POST /analytics/events - Registrar eventos en batch
 * - GET /analytics/:childId/daily - Uso diario
 * - GET /analytics/:childId/daily/range - Uso en rango de fechas
 * - GET /analytics/:childId/weekly - Reporte semanal
 * - GET /analytics/:childId/report - Reporte completo
 *
 * Endpoints (Admin):
 * - GET /analytics/admin/global - Estadísticas globales
 * - GET /analytics/admin/:childId - Analíticas de un niño
 * - GET /analytics/admin/:childId/daily - Uso diario (admin)
 * - GET /analytics/admin/:childId/weekly - Reportes semanales (admin)
 * - GET /analytics/admin/:childId/report - Reporte completo (admin)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([SessionEvent, DailyUsage]),
    ChildrenProfilesModule,
  ],
  controllers: [AnalyticsController, AnalyticsAdminController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
