import { Router } from 'express';
import { authenticate, requireRole } from '@/middleware/auth.middleware';
import * as committeeController from './committee.controller';

const router = Router();

// Public route to get all assigned committee members
router.get('/assigned', committeeController.getAssignedMembers);

// Protected routes for SUPER_ADMIN
router.get('/admin-view', authenticate, requireRole('SUPER_ADMIN'), committeeController.getAdminView);
router.patch('/reorder', authenticate, requireRole('SUPER_ADMIN'), committeeController.reorderCommittee);
router.post('/:userId', authenticate, requireRole('SUPER_ADMIN'), committeeController.createCommitteeAssignment);
router.patch('/:userId', authenticate, requireRole('SUPER_ADMIN'), committeeController.updateCommitteeAssignment);
router.delete('/:userId', authenticate, requireRole('SUPER_ADMIN'), committeeController.deleteCommitteeAssignment);

export default router;
