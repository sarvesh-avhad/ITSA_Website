import { Router } from 'express';
import { authenticate, requireRole } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { NotFoundError, BadRequestError } from '@/lib/errors';
import { createAuditLog } from '@/middleware/audit.middleware';
import { CertificateService } from './certificates.service';
import { uploadRaw, cloudinary } from '@/config/cloudinary';
import { CertificateOrientation, CertificateType } from '@prisma/client';
import { extractPlaceholders } from '@/utils/certificate-generator.utils';

const router = Router();

// ==========================================
// TEMPLATES (Admin Only)
// ==========================================

const createTemplateSchema = z.object({
  name: z.string(),
  type: z.nativeEnum(CertificateType),
  orientation: z.nativeEnum(CertificateOrientation),
});

import multer from 'multer';
const uploadMem = multer({ storage: multer.memoryStorage() });

router.post(
  '/templates',
  authenticate,
  requireRole('ADMIN'),
  uploadMem.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) throw new BadRequestError('Template file is required');
      
      // We parse body fields that might come in as strings due to multipart/form-data
      const data = {
        name: req.body.name,
        type: req.body.type as CertificateType,
        orientation: req.body.orientation as CertificateOrientation,
      };

      const template = await CertificateService.uploadTemplate(req.file, data);

      await createAuditLog(req, {
        action: 'TEMPLATE_UPLOADED',
        severity: 'INFO',
        resource: 'CertificateTemplate',
        resourceId: template.id,
        newValue: { name: template.name, type: template.type },
      });

      res.status(201).json({ success: true, data: template });
    } catch (err) { 
      console.error("TEMPLATE UPLOAD ERROR:", err);
      next(err); 
    }
  }
);

router.get('/templates', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const templates = await prisma.certificateTemplate.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: templates });
  } catch (err) { next(err); }
});
router.patch('/templates/:id', authenticate, requireRole('ADMIN'), uploadMem.single('file'), async (req, res, next) => {
  try {
    const { name, type, orientation } = req.body;
    let dataToUpdate: any = { name, type, orientation };
    
    // If a new file is uploaded, upload to cloudinary and extract fields
    if (req.file && req.file.buffer) {
      const detectedFields = extractPlaceholders(req.file.buffer);
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'itsa_certificates/templates', resource_type: 'raw', format: 'pptx' },
          (error, result) => { if (error) reject(error); else resolve(result); }
        );
        stream.end(req.file.buffer);
      });
      dataToUpdate.fileUrl = uploadResult.secure_url;
      dataToUpdate.cloudinaryId = uploadResult.public_id;
      dataToUpdate.detectedFields = JSON.stringify(detectedFields);
      dataToUpdate.version = { increment: 1 };
    }

    const template = await prisma.certificateTemplate.update({
      where: { id: req.params.id },
      data: dataToUpdate
    });

    await createAuditLog(req, {
      action: 'TEMPLATE_UPDATED',
      severity: 'INFO',
      resource: 'CertificateTemplate',
      resourceId: template.id,
      newValue: { name: template.name, type: template.type, version: template.version },
    });

    res.json({ success: true, data: template });
  } catch (err) { next(err); }
});
router.delete('/templates/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const template = await prisma.certificateTemplate.update({
      where: { id: req.params.id as string },
      data: { deletedAt: new Date(), isActive: false }
    });
    
    await createAuditLog(req, {
      action: 'TEMPLATE_DELETED',
      severity: 'WARNING',
      resource: 'CertificateTemplate',
      resourceId: template.id,
    });

    res.json({ success: true, data: template });
  } catch (err) { next(err); }
});

// ==========================================
// GENERATION (Admin Only)
// ==========================================

const generateSchema = z.object({
  eventId: z.string(),
  templateId: z.string(),
  userIds: z.array(z.string()).min(1),
  duplicateAction: z.enum(['SKIP', 'REGENERATE', 'OVERWRITE']).default('SKIP'),
});

router.post('/generate', authenticate, requireRole('ADMIN'), validate(generateSchema), async (req, res, next) => {
  try {
    const { eventId, templateId, userIds, duplicateAction } = req.body;
    
    const jobInfo = await CertificateService.triggerGenerationJob(eventId, templateId, userIds, duplicateAction);

    res.status(202).json({ success: true, data: jobInfo, message: 'Generation job started' });
  } catch (err) { next(err); }
});

router.get('/generate/progress/:jobId', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const progress = await CertificateService.getJobProgress(req.params.jobId as string);
    res.json({ success: true, data: progress });
  } catch (err) { next(err); }
});


// ==========================================
// CERTIFICATE MANAGEMENT (Admin)
// ==========================================
router.get('/', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const certificates = await prisma.certificate.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true, prn: true } },
        event: { select: { title: true } },
        template: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // pagination placeholder
    });
    res.json({ success: true, data: certificates });
  } catch (err) { next(err); }
});

router.post('/:id/revoke', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const cert = await CertificateService.revokeCertificate(req.params.id as string);
    
    await createAuditLog(req, {
      action: 'CERTIFICATE_REVOKED',
      severity: 'WARNING',
      resource: 'Certificate',
      resourceId: cert.id,
      newValue: { status: 'REVOKED' },
    });

    res.json({ success: true, data: cert });
  } catch (err) { next(err); }
});


// ==========================================
// STUDENT & PUBLIC ROUTES
// ==========================================

router.get('/my', authenticate, async (req, res, next) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { userId: req.user!.userId, status: 'GENERATED' },
      include: { event: { select: { title: true, slug: true, startDate: true } }, template: { select: { type: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: certificates });
  } catch (err) { next(err); }
});

router.get('/verify/:tokenOrNumber', async (req, res, next) => {
  try {
    const cert = await prisma.certificate.findFirst({
      where: {
        OR: [
          { verificationToken: req.params.tokenOrNumber as string },
          { certificateNumber: req.params.tokenOrNumber as string }
        ]
      },
      include: {
        user: { select: { firstName: true, lastName: true, prn: true } },
        event: { select: { title: true } },
        template: { select: { type: true, name: true } }
      },
    });

    if (!cert) {
      return res.json({ success: true, data: { isValid: false } });
    }

    res.json({
      success: true,
      data: {
        isValid: cert.status === 'GENERATED',
        certificate: {
          number: cert.certificateNumber,
          holder: `${cert.user.firstName} ${cert.user.lastName}`,
          event: cert.event.title,
          type: cert.template?.type || 'CUSTOM',
          issueDate: cert.createdAt,
          status: cert.status,
          generatedData: cert.generatedData
        },
      },
    });
  } catch (err) { next(err); }
});

export default router;
