import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.config';

export const CloudinaryImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: 'nest_uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  }),
});
