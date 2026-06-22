import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '@itsa/shared';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), (req, res, next) => {
  authController.register(req, res).catch(next);
});

router.post('/login', validate(loginSchema), (req, res, next) => {
  authController.login(req, res).catch(next);
});

router.post('/google', (req, res, next) => {
  authController.googleAuth(req, res).catch(next);
});

router.post('/refresh', (req, res, next) => {
  authController.refreshToken(req, res).catch(next);
});

router.post('/forgot-password', validate(forgotPasswordSchema), (req, res, next) => {
  authController.forgotPassword(req, res).catch(next);
});

router.post('/reset-password', validate(resetPasswordSchema), (req, res, next) => {
  authController.resetPassword(req, res).catch(next);
});

// Protected routes
router.post('/logout', authenticate, (req, res, next) => {
  authController.logout(req, res).catch(next);
});

router.get('/me', authenticate, (req, res, next) => {
  authController.getMe(req, res).catch(next);
});

router.patch('/me', authenticate, validate(updateProfileSchema), (req, res, next) => {
  authController.updateMe(req, res).catch(next);
});

export default router;
