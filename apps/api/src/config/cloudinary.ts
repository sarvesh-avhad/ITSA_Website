import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { env } from './env';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'itsa_gallery', // The folder in Cloudinary where images will be stored
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4'], // Allowed formats
    // transformation: [{ width: 1000, height: 1000, crop: 'limit' }], // Optional automatic transformation
  } as any,
});

export const upload = multer({ storage: storage });
export { cloudinary };
