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
      include: {
        _count: {
          select: { certificates: true }
        }
      },
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
    let fileBuffer: Buffer | undefined;
    if (req.file && req.file.buffer) {
      fileBuffer = req.file.buffer;
    }

    if (fileBuffer) {
      const detectedFields = extractPlaceholders(fileBuffer);
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'itsa_certificates/templates', resource_type: 'raw', format: 'pptx' },
          (error, result) => { if (error) reject(error); else resolve(result); }
        );
        stream.end(fileBuffer);
      });
      dataToUpdate.fileUrl = uploadResult.secure_url;
      dataToUpdate.cloudinaryId = uploadResult.public_id;
      dataToUpdate.detectedFields = JSON.stringify(detectedFields);
      dataToUpdate.version = { increment: 1 };
    }

    const template = await prisma.certificateTemplate.update({
      where: { id: req.params.id as string },
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

router.patch('/templates/:id/activate', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const template = await prisma.certificateTemplate.findUnique({ where: { id: req.params.id as string } });
    if (!template) throw new NotFoundError('Template');
    
    // Deactivate all other templates of same type
    await prisma.certificateTemplate.updateMany({
      where: { type: template.type, id: { not: template.id } },
      data: { isActive: false }
    });

    const activated = await prisma.certificateTemplate.update({
      where: { id: template.id },
      data: { isActive: true }
    });

    await createAuditLog(req, {
      action: 'TEMPLATE_ACTIVATED',
      severity: 'INFO',
      resource: 'CertificateTemplate',
      resourceId: template.id,
    });

    res.json({ success: true, data: activated });
  } catch (err) { next(err); }
});

router.patch('/templates/:id/deactivate', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const deactivated = await prisma.certificateTemplate.update({
      where: { id: req.params.id as string },
      data: { isActive: false }
    });

    await createAuditLog(req, {
      action: 'TEMPLATE_DEACTIVATED',
      severity: 'INFO',
      resource: 'CertificateTemplate',
      resourceId: req.params.id as string,
    });

    res.json({ success: true, data: deactivated });
  } catch (err) { next(err); }
});

router.post('/templates/:id/duplicate', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const original = await prisma.certificateTemplate.findUnique({ where: { id: req.params.id as string } });
    if (!original) throw new NotFoundError('Template');

    const duplicate = await prisma.certificateTemplate.create({
      data: {
        name: `${original.name} (Copy)`,
        type: original.type,
        orientation: original.orientation,
        fileUrl: original.fileUrl,
        cloudinaryId: original.cloudinaryId,
        detectedFields: original.detectedFields ? JSON.parse(JSON.stringify(original.detectedFields)) : undefined,
        isActive: false, // Duplicates start inactive
        version: 1
      }
    });

    await createAuditLog(req, {
      action: 'TEMPLATE_UPDATED', // Treat as update or upload
      severity: 'INFO',
      resource: 'CertificateTemplate',
      resourceId: duplicate.id,
      newValue: { name: duplicate.name },
    });

    res.status(201).json({ success: true, data: duplicate });
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

const previewSchema = z.object({
  eventId: z.string(),
  templateId: z.string(),
  userIds: z.array(z.string()).min(1),
});

router.post('/preview', authenticate, requireRole('ADMIN'), validate(previewSchema), async (req, res, next) => {
  try {
    const { eventId, templateId, userIds } = req.body;
    
    // Always use the first eligible participant
    const previewData = await CertificateService.generatePreview(eventId, templateId, userIds[0]);

    res.json({ success: true, data: previewData });
  } catch (err) { next(err); }
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

// ==========================================
// ADMIN DASHBOARD & REPORTING
// ==========================================

router.get('/admin/all', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { eventId, search, page = '1', limit = '10' } = req.query;
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {};
    if (eventId) where.eventId = eventId;
    if (search) {
      where.OR = [
        { certificateNumber: { contains: search as string, mode: 'insensitive' } },
        { user: { firstName: { contains: search as string, mode: 'insensitive' } } },
        { user: { lastName: { contains: search as string, mode: 'insensitive' } } },
        { user: { email: { contains: search as string, mode: 'insensitive' } } },
        { user: { prn: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        include: { user: true, event: true, template: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNumber
      }),
      prisma.certificate.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        certificates,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber)
        }
      }
    });
  } catch (err) { next(err); }
});

// ==========================================
// EXPORT REPORT (Admin Only)
// ==========================================

router.get('/export/:eventId', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const eventId = req.params.eventId as string;
    
    const certificates = await prisma.certificate.findMany({
      where: { eventId },
      include: {
        user: true,
        template: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const csvRows = ['Name,PRN,Email,Type,Status,Certificate Number,URL'];
    
    for (const cert of certificates) {
      const name = `"${cert.user.firstName} ${cert.user.lastName}"`;
      const prn = cert.user.prn || 'N/A';
      const email = cert.user.email;
      const type = cert.template?.type || 'N/A';
      const status = cert.status;
      const certNum = cert.certificateNumber;
      const url = cert.pdfUrl;
      
      csvRows.push(`${name},${prn},${email},${type},${status},${certNum},${url}`);
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-generation-report-${eventId}.csv"`);
    res.send(csvRows.join('\n'));
  } catch (err) { next(err); }
});

export default router;
