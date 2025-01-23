import multer from 'multer';
import { Request } from 'express';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '../config/storage.config.js';

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(new Error('Invalid file type'));
    return;
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

// Middleware for single file upload
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

// Middleware for multiple files upload
export const uploadMultiple = (fieldName: string, maxCount: number) => 
  upload.array(fieldName, maxCount); 