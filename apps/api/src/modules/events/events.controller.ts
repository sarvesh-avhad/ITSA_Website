import type { Request, Response } from 'express';
import { eventsService } from './events.service';
import type { CreateEventRequest, UpdateEventRequest, EventFilters } from '@itsa/shared';

export class EventsController {
  async list(req: Request, res: Response): Promise<void> {
    const filters = req.query as unknown as EventFilters;
    if (req.originalUrl.includes('/admin')) {
      (filters as any).isAdmin = true;
      (filters as any).userRole = req.user?.role;
      (filters as any).userId = req.user?.userId || req.user?.id;
    }
    const result = await eventsService.list(filters);
    res.json({ success: true, data: result.data, meta: result.meta });
  }

  async getBySlug(req: Request, res: Response): Promise<void> {
    const event = await eventsService.getBySlug(req.params.slug as string);
    res.json({ success: true, data: event });
  }

  async create(req: Request, res: Response): Promise<void> {
    const data = req.body as CreateEventRequest;
    const event = await eventsService.create(data, req.user!.userId, req);
    res.status(201).json({ success: true, data: event });
  }

  async update(req: Request, res: Response): Promise<void> {
    const data = req.body as UpdateEventRequest;
    const event = await eventsService.update(req.params.id as string, data, req);
    res.json({ success: true, data: event });
  }

  async delete(req: Request, res: Response): Promise<void> {
    await eventsService.delete(req.params.id as string, req);
    res.json({ success: true, data: { message: 'Event deleted successfully' } });
  }

  async getRegistrations(req: Request, res: Response): Promise<void> {
    const result = await eventsService.getRegistrations(req.params.id as string, req.query as any);
    res.json({ success: true, data: result.data, meta: result.meta });
  }

  async getCategories(_req: Request, res: Response): Promise<void> {
    const categories = await eventsService.getCategories();
    res.json({ success: true, data: categories });
  }
}

export const eventsController = new EventsController();
