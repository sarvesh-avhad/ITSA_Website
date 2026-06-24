import { Router } from 'express';
import { authenticate, requirePermission } from '@/middleware/auth.middleware';
import { upload } from '@/config/cloudinary';
import { createAuditLog } from '@/middleware/audit.middleware';
import { PERMISSIONS } from '@itsa/shared';

const router = Router();

// Upload a single file
router.post('/', authenticate, requirePermission(PERMISSIONS.GALLERY_UPLOAD), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
    }

    const fileData = req.file as any;
    
    // fileData.path contains the URL to the uploaded image in Cloudinary
    // fileData.filename contains the public_id
    
    const result = {
      url: fileData.path,
      publicId: fileData.filename,
      sizeBytes: fileData.size,
      format: fileData.mimetype,
      originalName: fileData.originalname,
    };

    await createAuditLog(req, { action: 'UPLOAD', resource: 'File', resourceId: result.publicId });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Upload multiple files
router.post('/batch', authenticate, requirePermission(PERMISSIONS.GALLERY_UPLOAD), upload.array('files', 10), async (req, res, next) => {
  try {
    if (!req.files || (req.files as any[]).length === 0) {
      return res.status(400).json({ success: false, error: { message: 'No files uploaded' } });
    }

    const files = req.files as any[];
    
    const results = files.map((file) => ({
      url: file.path,
      publicId: file.filename,
      sizeBytes: file.size,
      format: file.mimetype,
      originalName: file.originalname,
    }));

    await createAuditLog(req, { action: 'UPLOAD', resource: 'FileBatch', resourceId: 'batch' });

    res.status(201).json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
});

export default router;
