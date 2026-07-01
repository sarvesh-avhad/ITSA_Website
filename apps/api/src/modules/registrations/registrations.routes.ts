import { Router } from 'express';
import { authenticate, requireRole, requirePermission } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import { individualRegistrationSchema, teamRegistrationSchema, PERMISSIONS } from '@itsa/shared';
import { registrationsService } from './registrations.service';
import { createAuditLog } from '@/middleware/audit.middleware';
import { BadRequestError } from '@/lib/errors';

const router = Router();

// Individual registration
router.post('/individual', authenticate, requireRole('STUDENT'), validate(individualRegistrationSchema), async (req, res, next) => {
  try {
    const result = await registrationsService.registerIndividual(req.body, req.user!.userId, req);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Team registration
router.post('/team', authenticate, requireRole('STUDENT'), validate(teamRegistrationSchema), async (req, res, next) => {
  try {
    const result = await registrationsService.registerTeam(req.body, req.user!.userId, req);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

// My registrations
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const registrations = await registrationsService.getMyRegistrations(req.user!.userId);
    res.json({ success: true, data: registrations });
  } catch (err) { next(err); }
});

// Admin: Export all registrations
router.get('/export', authenticate, requirePermission(PERMISSIONS.EVENTS_READ), async (req, res, next) => {
  try {
    const format = req.query.format as 'csv' | 'excel' || 'csv';
    const search = (req.query.search as string) || '';
    const eventId = req.query.eventId as string | undefined;
    
    const { flatData, columns } = await registrationsService.exportAllRegistrations(search, eventId);
    const { generateCsvBuffer, generateExcelBuffer } = await import('@/utils/export.utils');
      
    let buffer: Buffer;
    let contentType: string;
    let extension: string;

    if (format === 'excel') {
      buffer = await generateExcelBuffer(flatData, columns, 'Registrations');
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      extension = 'xlsx';
    } else {
      buffer = await generateCsvBuffer(flatData, columns);
      contentType = 'text/csv';
      extension = 'csv';
    }

    await createAuditLog(req, {
      action: 'REPORT_EXPORTED',
      severity: 'INFO',
      resource: 'Registration',
      resourceId: 'export',
      targetUserName: 'Registrations Report',
      newValue: { format, recordsExported: flatData.length, eventId },
    });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=registrations_export_${new Date().toISOString().split('T')[0]}.${extension}`);
    res.send(buffer);
  } catch (err) { next(err); }
});

// Admin: Get events summary
router.get('/events-summary', authenticate, requirePermission(PERMISSIONS.EVENTS_READ), async (req, res, next) => {
  try {
    const summary = await registrationsService.getEventsSummary();
    res.json({ success: true, data: summary });
  } catch (err) { next(err); }
});

// Admin: Get event stats
router.get('/stats', authenticate, requirePermission(PERMISSIONS.EVENTS_READ), async (req, res, next) => {
  try {
    const eventId = req.query.eventId as string;
    if (!eventId) throw new BadRequestError('eventId is required');
    const stats = await registrationsService.getEventStats(eventId);
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});

// Admin: Get all registrations (filtered by event)
router.get('/', authenticate, requirePermission(PERMISSIONS.EVENTS_READ), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const eventId = req.query.eventId as string;
    
    const result = await registrationsService.getAllRegistrations(page, limit, search, req.user!, eventId);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// Admin: Scan QR Code
router.post('/scan', authenticate, requirePermission(PERMISSIONS.EVENTS_MANAGE_REGISTRATIONS), async (req, res, next) => {
  try {
    const result = await registrationsService.scanRegistration(req.body.qrCode, req, req.body.targetEventId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Cancel registration (User)
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await registrationsService.cancelRegistration((req.params.id as string) as string, req.user!.userId, req);
    res.json({ success: true, data: { message: 'Registration cancelled' } });
  } catch (err) { next(err); }
});

// Admin: Delete registration permanently (Soft Delete)
router.delete('/:id/admin', authenticate, requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    await registrationsService.adminDeleteRegistration((req.params.id as string) as string, req);
    res.json({ success: true, data: { message: 'Registration deleted successfully' } });
  } catch (err) { next(err); }
});

// Admin: Update status
router.patch('/:id/status', authenticate, requirePermission(PERMISSIONS.EVENTS_MANAGE_REGISTRATIONS), async (req, res, next) => {
  try {
    const result = await registrationsService.updateStatus((req.params.id as string) as string, req.body.status, req);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Admin: Mark attendance
router.post('/:id/attendance', authenticate, requirePermission(PERMISSIONS.EVENTS_MANAGE_REGISTRATIONS), async (req, res, next) => {
  try {
    const result = await registrationsService.markAttendance((req.params.id as string) as string, req);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

export default router;
