import { Router } from 'express';
import { eventsController } from './events.controller';
import { authenticate, requireRole, requirePermission } from '@/middleware/auth.middleware';
import { validate, validateQuery } from '@/middleware/validate.middleware';
import { createEventSchema, updateEventSchema, eventFiltersSchema, PERMISSIONS } from '@itsa/shared';

const router = Router();

// Public routes
router.get('/', validateQuery(eventFiltersSchema), (req, res, next) => {
  eventsController.list(req, res).catch(next);
});

router.get('/categories', (req, res, next) => {
  eventsController.getCategories(req, res).catch(next);
});

router.get('/admin', /* authenticate, requireRole('ADMIN'), */ validateQuery(eventFiltersSchema), (req, res, next) => {
  eventsController.list(req, res).catch(next);
});

router.get('/:slug', (req, res, next) => {
  eventsController.getBySlug(req, res).catch(next);
});

// Protected routes
router.post('/', authenticate, requireRole('ADMIN'), validate(createEventSchema), (req, res, next) => {
  eventsController.create(req, res).catch(next);
});

router.patch('/:id', authenticate, requireRole('ADMIN'), validate(updateEventSchema), (req, res, next) => {
  eventsController.update(req, res).catch(next);
});

router.delete('/:id', authenticate, requireRole('ADMIN'), (req, res, next) => {
  eventsController.delete(req, res).catch(next);
});

router.get('/:id/registrations/export', authenticate, requirePermission(PERMISSIONS.EVENTS_READ), (req, res, next) => {
  eventsController.exportRegistrations(req, res, next).catch(next);
});

router.get('/:id/registrations', authenticate, requirePermission(PERMISSIONS.EVENTS_READ), (req, res, next) => {
  eventsController.getRegistrations(req, res).catch(next);
});

export default router;
