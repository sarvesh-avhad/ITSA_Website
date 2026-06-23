import type { Request } from 'express';
import slugify from 'slugify';
import { prisma } from '@/lib/prisma';
import { getCache, setCache, invalidateCacheByPrefix } from '@/lib/redis';
import { NotFoundError, ConflictError } from '@/lib/errors';
import { createAuditLog } from '@/middleware/audit.middleware';
import { CACHE_TTL, PAGINATION } from '@itsa/shared';
import type { CreateEventRequest, UpdateEventRequest, EventFilters } from '@itsa/shared';

class EventsService {
  async list(filters: EventFilters) {
    const page = filters.page || PAGINATION.DEFAULT_PAGE;
    const limit = filters.limit || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    // Check cache
    const cacheKey = `events:list:${JSON.stringify(filters)}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) return cached;

    const where: any = {
      deletedAt: null,
    };

    if (!(filters as any).isAdmin) {
      where.isPublished = true;
    }

    if (filters.status) where.status = filters.status;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.eventType) where.eventType = filters.eventType;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { shortDescription: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.startDate) {
      where.startDate = { gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      where.endDate = { lte: new Date(filters.endDate) };
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { startDate: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          shortDescription: true,
          posterUrl: true,
          venue: true,
          startDate: true,
          endDate: true,
          status: true,
          eventType: true,
          currentCount: true,
          maxParticipants: true,
          minTeamSize: true,
          maxTeamSize: true,
          isFeatured: true,
          isPublished: true,
          registrationDeadline: true,
          category: {
            select: { id: true, name: true, slug: true, color: true, icon: true },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    const result = {
      data: events,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    await setCache(cacheKey, result, CACHE_TTL.EVENTS_LIST);
    return result;
  }

  async getBySlug(slug: string) {
    const cacheKey = `events:detail:${slug}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) return cached;

    const event = await prisma.event.findUnique({
      where: { slug, deletedAt: null },
      include: {
        category: true,
        sponsors: {
          include: {
            sponsor: { select: { id: true, name: true, logoUrl: true, tier: true } },
          },
        },
      },
    });

    if (!event) throw new NotFoundError('Event');

    await setCache(cacheKey, event, CACHE_TTL.EVENT_DETAIL);
    return event;
  }

  async create(data: CreateEventRequest, userId: string, req: Request) {
    const slug = slugify(data.title, { lower: true, strict: true });

    // Check slug uniqueness
    const existing = await prisma.event.findUnique({ where: { slug } });
    if (existing) throw new ConflictError('An event with this title already exists');

    const event = await prisma.event.create({
      data: {
        ...data,
        slug,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : null,
        faqs: data.faqs ? (data.faqs as any) : undefined,
        schedule: data.schedule ? (data.schedule as any) : undefined,
        createdBy: userId,
      },
      include: { category: true },
    });

    await invalidateCacheByPrefix('events');
    await createAuditLog(req, {
      action: 'CREATE',
      resource: 'Event',
      resourceId: event.id,
      newData: { title: event.title, slug: event.slug },
    });

    return event;
  }

  async update(id: string, data: UpdateEventRequest, req: Request) {
    const existing = await prisma.event.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Event');

    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.registrationDeadline) updateData.registrationDeadline = new Date(data.registrationDeadline);
    if (data.title) {
      updateData.slug = slugify(data.title, { lower: true, strict: true });
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    await invalidateCacheByPrefix('events');
    await createAuditLog(req, {
      action: 'UPDATE',
      resource: 'Event',
      resourceId: event.id,
      oldData: { title: existing.title, status: existing.status },
      newData: { title: event.title, status: event.status },
    });

    return event;
  }

  async delete(id: string, req: Request) {
    const event = await prisma.event.findUnique({ where: { id, deletedAt: null } });
    if (!event) throw new NotFoundError('Event');

    // Soft delete
    await prisma.event.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await invalidateCacheByPrefix('events');
    await createAuditLog(req, {
      action: 'DELETE',
      resource: 'Event',
      resourceId: id,
      oldData: { title: event.title },
    });
  }

  async getRegistrations(eventId: string, query: any) {
    const page = parseInt(query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(query.limit) || PAGINATION.ADMIN_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: any = { eventId, deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.search) {
      where.user = {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { prn: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true, firstName: true, lastName: true, email: true,
              prn: true, branch: true, year: true, phone: true,
            },
          },
          team: {
            include: {
              leader: { select: { id: true, firstName: true, lastName: true, email: true } },
              members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
            },
          },
        },
      }),
      prisma.registration.count({ where }),
    ]);

    return {
      data: registrations,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCategories() {
    return prisma.eventCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }
}

export const eventsService = new EventsService();
