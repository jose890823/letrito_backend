import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Event, EventType } from './entities/event.entity';
import {
  EventResponseDto,
  EventsHistoryResponseDto,
} from './dto/event-response.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  /**
   * Registrar un nuevo evento
   */
  async track(
    userId: string,
    eventType: EventType,
    metadata?: Record<string, any>,
  ): Promise<Event> {
    const event = this.eventRepository.create({
      userId,
      eventType,
      metadata: metadata || null,
    });

    await this.eventRepository.save(event);
    this.logger.debug(`Evento registrado: ${eventType} para usuario ${userId}`);

    return event;
  }

  /**
   * Obtener historial de eventos de un usuario
   */
  async getHistory(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      eventType?: EventType;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<EventsHistoryResponseDto> {
    const {
      limit = 50,
      offset = 0,
      eventType,
      startDate,
      endDate,
    } = options || {};

    const whereConditions: any = { userId };

    if (eventType) {
      whereConditions.eventType = eventType;
    }

    if (startDate && endDate) {
      whereConditions.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      whereConditions.createdAt = MoreThanOrEqual(startDate);
    } else if (endDate) {
      whereConditions.createdAt = LessThanOrEqual(endDate);
    }

    const [events, total] = await this.eventRepository.findAndCount({
      where: whereConditions,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      events: events.map((e) => this.toResponseDto(e)),
      total,
    };
  }

  /**
   * Obtener eventos de hoy para un usuario
   */
  async getTodayEvents(userId: string): Promise<EventResponseDto[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const events = await this.eventRepository.find({
      where: {
        userId,
        createdAt: Between(today, tomorrow),
      },
      order: { createdAt: 'DESC' },
    });

    return events.map((e) => this.toResponseDto(e));
  }

  /**
   * Contar eventos por tipo en un periodo
   */
  async countByType(
    userId: string,
    eventType: EventType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const whereConditions: any = { userId, eventType };

    if (startDate && endDate) {
      whereConditions.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      whereConditions.createdAt = MoreThanOrEqual(startDate);
    }

    return this.eventRepository.count({ where: whereConditions });
  }

  /**
   * Verificar si un evento ocurrio hoy
   */
  async hasEventToday(userId: string, eventType: EventType): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await this.eventRepository.count({
      where: {
        userId,
        eventType,
        createdAt: Between(today, tomorrow),
      },
    });

    return count > 0;
  }

  /**
   * Obtener estadisticas de actividad
   */
  async getActivityStats(
    userId: string,
    days: number = 7,
  ): Promise<{
    totalEvents: number;
    generationsCreated: number;
    generationsUsed: number;
    checkIns: number;
    daysActive: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const [totalEvents, generationsCreated, generationsUsed, checkIns] =
      await Promise.all([
        this.eventRepository.count({
          where: {
            userId,
            createdAt: MoreThanOrEqual(startDate),
          },
        }),
        this.countByType(userId, EventType.GENERATION_CREATED, startDate),
        this.countByType(userId, EventType.GENERATION_USED, startDate),
        this.countByType(userId, EventType.STREAK_CHECK_IN, startDate),
      ]);

    // Contar dias unicos con actividad
    const distinctDays = await this.eventRepository
      .createQueryBuilder('event')
      .select('DATE(event.createdAt)', 'date')
      .where('event.userId = :userId', { userId })
      .andWhere('event.createdAt >= :startDate', { startDate })
      .groupBy('DATE(event.createdAt)')
      .getRawMany();

    return {
      totalEvents,
      generationsCreated,
      generationsUsed,
      checkIns,
      daysActive: distinctDays.length,
    };
  }

  /**
   * Convertir entidad a DTO
   */
  private toResponseDto(event: Event): EventResponseDto {
    return {
      id: event.id,
      eventType: event.eventType,
      metadata: event.metadata ?? undefined,
      createdAt: event.createdAt,
    };
  }

  // ==================== ADMIN METHODS ====================

  /**
   * Obtener todos los eventos con filtros (Admin)
   */
  async findAllAdmin(filters: {
    page: number;
    limit: number;
    eventType?: EventType;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page, limit, eventType, userId, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.user', 'user')
      .orderBy('event.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (eventType) {
      queryBuilder.andWhere('event.eventType = :eventType', { eventType });
    }

    if (userId) {
      queryBuilder.andWhere('event.userId = :userId', { userId });
    }

    if (startDate) {
      queryBuilder.andWhere('event.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('event.createdAt <= :endDate', { endDate: end });
    }

    const [events, total] = await queryBuilder.getManyAndCount();

    return {
      data: events.map((e) => ({
        id: e.id,
        userId: e.userId,
        userName: e.user ? `${e.user.firstName} ${e.user.lastName}` : 'Usuario',
        userEmail: e.user?.email || '',
        eventType: e.eventType,
        metadata: e.metadata,
        createdAt: e.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener estadísticas de eventos (Admin)
   */
  async getAdminStats(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total de eventos
    const totalEvents = await this.eventRepository.count();

    // Eventos hoy
    const eventsToday = await this.eventRepository.count({
      where: { createdAt: Between(today, tomorrow) },
    });

    // Eventos en el período
    const eventsPeriod = await this.eventRepository.count({
      where: { createdAt: MoreThanOrEqual(startDate) },
    });

    // Por tipo de evento
    const byEventType = await this.eventRepository
      .createQueryBuilder('event')
      .select('event.eventType', 'eventType')
      .addSelect('COUNT(*)', 'count')
      .where('event.createdAt >= :startDate', { startDate })
      .groupBy('event.eventType')
      .orderBy('count', 'DESC')
      .getRawMany();

    // Usuarios únicos activos
    const uniqueUsers = await this.eventRepository
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.userId)', 'count')
      .where('event.createdAt >= :startDate', { startDate })
      .getRawOne();

    // Eventos por categoría
    const categories = {
      onboarding: [
        'onboarding_started',
        'onboarding_niche_selected',
        'onboarding_platform_selected',
        'onboarding_completed',
      ],
      generations: [
        'generation_created',
        'generation_viewed',
        'generation_used',
      ],
      streaks: ['streak_check_in', 'streak_broken', 'streak_milestone'],
      subscriptions: [
        'subscription_started',
        'subscription_cancelled',
        'subscription_renewed',
        'trial_started',
        'trial_ended',
      ],
      users: ['user_login', 'user_logout', 'profile_updated'],
    };

    const byCategory: Record<string, number> = {};
    for (const [category, types] of Object.entries(categories)) {
      const count = await this.eventRepository
        .createQueryBuilder('event')
        .where('event.eventType IN (:...types)', { types })
        .andWhere('event.createdAt >= :startDate', { startDate })
        .getCount();
      byCategory[category] = count;
    }

    return {
      totalEvents,
      eventsToday,
      eventsPeriod,
      periodDays: days,
      uniqueActiveUsers: Number(uniqueUsers?.count || 0),
      byEventType: byEventType.map((e) => ({
        eventType: e.eventType,
        count: Number(e.count),
      })),
      byCategory,
    };
  }

  /**
   * Obtener timeline de actividad (Admin)
   */
  async getActivityTimeline(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const timeline = await this.eventRepository
      .createQueryBuilder('event')
      .select('DATE(event.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('event.createdAt >= :startDate', { startDate })
      .groupBy('DATE(event.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Generar todos los días del período
    const result: { date: string; count: number }[] = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const found = timeline.find(
        (t) =>
          t.date === dateStr ||
          t.date?.toISOString?.()?.split('T')[0] === dateStr,
      );
      result.push({
        date: dateStr,
        count: found ? Number(found.count) : 0,
      });
    }

    return result;
  }

  /**
   * Obtener un evento por ID (Admin)
   */
  async findByIdAdmin(id: string) {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!event) {
      throw new NotFoundException('Evento no encontrado');
    }

    return {
      id: event.id,
      userId: event.userId,
      userName: event.user
        ? `${event.user.firstName} ${event.user.lastName}`
        : 'Usuario',
      userEmail: event.user?.email || '',
      eventType: event.eventType,
      metadata: event.metadata,
      createdAt: event.createdAt,
    };
  }

  /**
   * Eliminar un evento (Admin)
   */
  async removeAdmin(id: string) {
    const event = await this.eventRepository.findOne({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Evento no encontrado');
    }

    await this.eventRepository.remove(event);
    this.logger.log(`Evento ${id} eliminado por admin`);

    return { message: 'Evento eliminado correctamente' };
  }
}
