import { Router } from 'express';
import { authenticate, requirePermission } from '@/middleware/auth.middleware';
import { PERMISSIONS } from '@itsa/shared';
import { AuditController } from './audit.controller';

const router = Router();
const controller = new AuditController();

// All audit routes require AUDIT_LOGS_READ permission
router.use(authenticate, requirePermission(PERMISSIONS.AUDIT_LOGS_READ));

router.get('/export', controller.exportAuditLogs);
router.get('/', controller.getAuditLogs);

export default router;
