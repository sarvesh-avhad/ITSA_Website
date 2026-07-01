import { prisma } from '@/lib/prisma';
import { NotFoundError, BadRequestError, ConflictError } from '@/lib/errors';
import { CertificateOrientation, CertificateType, NotificationTemplate, NotificationSourceModule } from '@prisma/client';
import { extractPlaceholders, generateCertificatePdf } from '@/utils/certificate-generator.utils';
import { placeholderRegistry, PlaceholderContext } from './placeholder.registry';
import { cloudinary } from '@/config/cloudinary';
import { nanoid } from 'nanoid';
import redisClient from '@/lib/redis';
import { NotificationService } from '../notifications/notifications.service';
import logger from '@/lib/logger';
import { env } from '@/config/env';

export class CertificateService {
  /**
   * Processes an uploaded PPTX template, parses fields, and stores it in the DB.
   */
  static async uploadTemplate(
    file: Express.Multer.File,
    data: { name: string; type: CertificateType; orientation: CertificateOrientation }
  ) {
    try {
      if (!file || !file.buffer) throw new BadRequestError('No file uploaded or missing buffer');

      console.log('Extracting placeholders from buffer...');
      const detectedFields = extractPlaceholders(file.buffer);
      console.log('Detected fields:', detectedFields);

      console.log('Uploading template to Cloudinary...');
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'itsa_certificates/templates',
            resource_type: 'raw',
            format: 'pptx'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(file.buffer);
      });

      return await prisma.certificateTemplate.create({
        data: {
          name: data.name,
          type: data.type,
          orientation: data.orientation,
          fileUrl: uploadResult.secure_url,
          cloudinaryId: uploadResult.public_id,
          detectedFields: JSON.stringify(detectedFields),
          version: 1,
          isActive: true,
        },
      });
    } catch (error: any) {
      console.error('CertificateService.uploadTemplate error:', error);
      throw error;
    }
  }

  /**
   * Initiates a background job to generate certificates.
   */
  static async triggerGenerationJob(
    eventId: string,
    templateId: string,
    userIds: string[],
    duplicateAction: 'SKIP' | 'REGENERATE' | 'OVERWRITE'
  ) {
    const template = await prisma.certificateTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new NotFoundError('Template');
    if (!template.isActive) throw new BadRequestError('Template is not active');

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundError('Event');

    const users = await prisma.user.findMany({ 
      where: { id: { in: userIds } },
      include: {
        registrations: { where: { eventId } }
      }
    });

    const jobId = `cert-job-${nanoid(10)}`;
    const total = users.length;
    
    // Initialize progress in Redis
    await redisClient.setex(`job:${jobId}:total`, 3600, total.toString());
    await redisClient.setex(`job:${jobId}:current`, 3600, '0');
    await redisClient.setex(`job:${jobId}:status`, 3600, 'PROCESSING');

    // Fire and forget the background process
    this.processGenerationJob(jobId, template, event, users, duplicateAction).catch(err => {
      logger.error(`Generation Job Failed: ${err.message}`);
      redisClient.setex(`job:${jobId}:status`, 3600, 'FAILED');
    });

    return { jobId, total };
  }

  private static async processGenerationJob(
    jobId: string,
    template: any,
    event: any,
    users: any[],
    duplicateAction: string
  ) {
    let processed = 0;
    
    // Fetch template buffer once for the batch
    const response = await fetch(template.fileUrl);
    const templateBuffer = Buffer.from(await response.arrayBuffer());
    const detectedFields = JSON.parse(template.detectedFields as string);
    const issueDate = new Date();
    const eventYear = new Date(event.startDate).getFullYear();

    for (const user of users) {
      try {
        const registration = user.registrations[0] || null;

        // Check for duplicates
        const existing = await prisma.certificate.findFirst({
          where: { userId: user.id, eventId: event.id, templateId: template.id }
        });

        if (existing) {
          if (duplicateAction === 'SKIP') {
            processed++;
            await redisClient.incr(`job:${jobId}:current`);
            continue;
          }
          if (duplicateAction === 'REGENERATE') {
             // We will create a new version and revoke the old one
             await prisma.certificate.update({
               where: { id: existing.id },
               data: { status: 'REVOKED' }
             });
          }
        }

        logger.info(`Generating certificate for user ${user.id}...`);

        const certNumber = `ITSA-${eventYear}-CERT-${nanoid(6).toUpperCase()}`;
        const verifyToken = nanoid(16);
        const verifyUrl = `${env.CORS_ORIGIN}/verify/certificate/${verifyToken}`;

        const context: PlaceholderContext = {
          user,
          event,
          registration,
          certificateNumber: certNumber,
          issueDate
        };

        const resolvedData = placeholderRegistry.resolveAll(detectedFields, context);

        logger.info(`Starting PDF generation for ${user.id}...`);
        const pdfBuffer = await generateCertificatePdf(templateBuffer, resolvedData, verifyUrl);
        logger.info(`PDF generated successfully for ${user.id} (${pdfBuffer.length} bytes)`);

        logger.info(`Uploading PDF to Cloudinary for ${user.id}...`);
        const uploadResult = await new Promise<any>((resolve, reject) => {
           const stream = cloudinary.uploader.upload_stream(
             { folder: 'itsa_certificates/generated', resource_type: 'image', format: 'pdf' },
             (error, result) => {
               if (error) {
                 logger.error(`Cloudinary upload failed: ${error.message}`);
                 reject(error);
               }
               else resolve(result);
             }
           );
           stream.on('error', (err) => reject(err));
           stream.end(pdfBuffer);
        });
        logger.info(`Uploaded to Cloudinary: ${uploadResult.secure_url}`);

        // Save to DB
        let newCert;
        if (existing && duplicateAction === 'OVERWRITE') {
           newCert = await prisma.certificate.update({
             where: { id: existing.id },
             data: {
               version: existing.version + 1,
               pdfUrl: uploadResult.secure_url,
               cloudinaryPublicId: uploadResult.public_id,
               generatedData: resolvedData,
               updatedAt: new Date(),
               // Note: token and certNumber remain same for true overwrite
             }
           });
        } else {
           newCert = await prisma.certificate.create({
             data: {
               certificateNumber: certNumber,
               verificationToken: verifyToken,
               userId: user.id,
               eventId: event.id,
               registrationId: registration?.id,
               templateId: template.id,
               version: 1,
               generatedData: resolvedData,
               pdfUrl: uploadResult.secure_url,
               cloudinaryPublicId: uploadResult.public_id,
               status: 'GENERATED'
             }
           });
        }

        // Notify user
        await NotificationService.send({
          userId: user.id,
          templateKey: NotificationTemplate.CERTIFICATE_READY,
          sourceModule: NotificationSourceModule.CERTIFICATES,
          metadata: { eventTitle: event.title, certificateId: newCert.certificateNumber, pdfUrl: newCert.pdfUrl }
        });

      } catch (err: any) {
        logger.error(`Error generating cert for user ${user.id}: ${err.message}`);
      }

      processed++;
      await redisClient.incr(`job:${jobId}:current`);
    }

    await redisClient.setex(`job:${jobId}:status`, 3600, 'COMPLETED');
  }

  static async getJobProgress(jobId: string) {
    const total = await redisClient.get(`job:${jobId}:total`);
    const current = await redisClient.get(`job:${jobId}:current`);
    const status = await redisClient.get(`job:${jobId}:status`);

    if (!total) throw new NotFoundError('Job');

    return {
      jobId,
      total: parseInt(total, 10),
      current: parseInt(current || '0', 10),
      status: status || 'UNKNOWN'
    };
  }

  static async revokeCertificate(id: string) {
    return await prisma.certificate.update({
      where: { id },
      data: { status: 'REVOKED' }
    });
  }
}
