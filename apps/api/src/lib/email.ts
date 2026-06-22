import { Resend } from 'resend';
import { env } from '@/config/env';
import { logger } from './logger';

let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    if (!env.RESEND_API_KEY) {
      logger.warn('RESEND_API_KEY not set — emails will be logged but not sent');
    }
    resend = new Resend(env.RESEND_API_KEY || 'placeholder');
  }
  return resend;
}

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<void> {
  const client = getResendClient();

  if (!env.RESEND_API_KEY) {
    logger.info({ to, subject }, '📧 [DEV] Email would be sent:');
    return;
  }

  try {
    await client.emails.send({
      from: env.EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    });
    logger.info({ to, subject }, 'Email sent successfully');
  } catch (err) {
    logger.error({ err, to, subject }, 'Failed to send email');
    throw err;
  }
}

// ============================================================
// Email Templates
// ============================================================

export function registrationConfirmationEmail(data: {
  studentName: string;
  eventName: string;
  eventDate: string;
  venue: string;
  qrCodeUrl?: string;
}): { subject: string; html: string } {
  return {
    subject: `Registration Confirmed — ${data.eventName} | ITSA`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e5e5e5; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #a78bfa; font-size: 24px; margin: 0;">ITSA Platform</h1>
        </div>
        <div style="background: #1a1a2e; border: 1px solid #2d2d44; border-radius: 12px; padding: 32px;">
          <h2 style="color: #ffffff; margin-top: 0;">Registration Confirmed! 🎉</h2>
          <p>Hey <strong>${data.studentName}</strong>,</p>
          <p>Your registration for <strong style="color: #a78bfa;">${data.eventName}</strong> has been confirmed.</p>
          <table style="width: 100%; margin: 24px 0; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #a0a0a0;">Event</td>
              <td style="padding: 8px 0; text-align: right;">${data.eventName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #a0a0a0;">Date</td>
              <td style="padding: 8px 0; text-align: right;">${data.eventDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #a0a0a0;">Venue</td>
              <td style="padding: 8px 0; text-align: right;">${data.venue}</td>
            </tr>
          </table>
          ${data.qrCodeUrl ? `<div style="text-align: center; margin: 24px 0;"><img src="${data.qrCodeUrl}" alt="QR Code" style="width: 200px; height: 200px; border-radius: 8px;" /></div>` : ''}
          <p style="color: #a0a0a0; font-size: 14px;">Please show this QR code at the venue for attendance.</p>
        </div>
        <p style="text-align: center; color: #666; font-size: 12px; margin-top: 32px;">© ${new Date().getFullYear()} ITSA — Information Technology Students Association</p>
      </body>
      </html>
    `,
  };
}

export function welcomeEmail(data: { name: string }): { subject: string; html: string } {
  return {
    subject: `Welcome to ITSA Platform!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e5e5e5; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #a78bfa; font-size: 24px; margin: 0;">ITSA Platform</h1>
        </div>
        <div style="background: #1a1a2e; border: 1px solid #2d2d44; border-radius: 12px; padding: 32px;">
          <h2 style="color: #ffffff; margin-top: 0;">Welcome, ${data.name}! 👋</h2>
          <p>You've successfully joined the ITSA Platform. Here's what you can do:</p>
          <ul style="padding-left: 20px; line-height: 1.8;">
            <li>Browse and register for upcoming events</li>
            <li>View event galleries and relive memories</li>
            <li>Download your participation certificates</li>
            <li>Stay updated with announcements</li>
          </ul>
        </div>
        <p style="text-align: center; color: #666; font-size: 12px; margin-top: 32px;">© ${new Date().getFullYear()} ITSA — Information Technology Students Association</p>
      </body>
      </html>
    `,
  };
}

export function passwordResetEmail(data: { name: string; resetUrl: string }): { subject: string; html: string } {
  return {
    subject: `Reset Your Password — ITSA Platform`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e5e5e5; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #a78bfa; font-size: 24px; margin: 0;">ITSA Platform</h1>
        </div>
        <div style="background: #1a1a2e; border: 1px solid #2d2d44; border-radius: 12px; padding: 32px;">
          <h2 style="color: #ffffff; margin-top: 0;">Password Reset Request</h2>
          <p>Hey <strong>${data.name}</strong>,</p>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.resetUrl}" style="background: #7c3aed; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #a0a0a0; font-size: 14px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        </div>
        <p style="text-align: center; color: #666; font-size: 12px; margin-top: 32px;">© ${new Date().getFullYear()} ITSA — Information Technology Students Association</p>
      </body>
      </html>
    `,
  };
}
