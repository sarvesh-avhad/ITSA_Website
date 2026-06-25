import { Router } from 'express';
import { authenticate, requireRole, requirePermission } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import { individualRegistrationSchema, teamRegistrationSchema, PERMISSIONS } from '@itsa/shared';
import { registrationsService } from './registrations.service';
import { createAuditLog } from '@/middleware/audit.middleware';

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
    
    const { flatData, columns } = await registrationsService.exportAllRegistrations(search);
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
      newValue: { format, recordsExported: flatData.length },
    });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=all_registrations_export_${new Date().toISOString().split('T')[0]}.${extension}`);
    res.send(buffer);
  } catch (err) { next(err); }
});

// Admin: Get all registrations
router.get('/', authenticate, requirePermission(PERMISSIONS.EVENTS_READ), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    
    const result = await registrationsService.getAllRegistrations(page, limit, search, req.user!);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// Admin: Scan QR Code
router.post('/scan', authenticate, requirePermission(PERMISSIONS.EVENTS_MANAGE_REGISTRATIONS), async (req, res, next) => {
  try {
    const result = await registrationsService.scanRegistration(req.body.qrCode, req);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});
// Cancel registration
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await registrationsService.cancelRegistration((req.params.id as string) as string, req.user!.userId, req);
    res.json({ success: true, data: { message: 'Registration cancelled' } });
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
