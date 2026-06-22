import type { Request, Response } from 'express';
import { authService } from './auth.service';
import type { LoginRequest, RegisterRequest } from '@itsa/shared';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const data = req.body as RegisterRequest;
    const result = await authService.register(data, req);
    res.status(201).json({ success: true, data: result });
  }

  async login(req: Request, res: Response): Promise<void> {
    const data = req.body as LoginRequest;
    const result = await authService.login(data, req, res);
    res.json({ success: true, data: result });
  }

  async googleAuth(req: Request, res: Response): Promise<void> {
    const { credential } = req.body;
    const result = await authService.googleAuth(credential, req, res);
    res.json({ success: true, data: result });
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    const result = await authService.refreshToken(req, res);
    res.json({ success: true, data: result });
  }

  async logout(req: Request, res: Response): Promise<void> {
    await authService.logout(req, res);
    res.json({ success: true, data: { message: 'Logged out successfully' } });
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    await authService.forgotPassword(req.body.email);
    res.json({ success: true, data: { message: 'If the email exists, a reset link has been sent' } });
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    await authService.resetPassword(req.body.token, req.body.password);
    res.json({ success: true, data: { message: 'Password reset successfully' } });
  }

  async getMe(req: Request, res: Response): Promise<void> {
    const user = await authService.getProfile(req.user!.userId);
    res.json({ success: true, data: user });
  }

  async updateMe(req: Request, res: Response): Promise<void> {
    const user = await authService.updateProfile(req.user!.userId, req.body);
    res.json({ success: true, data: user });
  }
}

export const authController = new AuthController();
