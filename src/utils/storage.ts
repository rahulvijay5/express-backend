import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { r2Client, R2_BUCKET_NAME, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '../config/storage.config.js';

export class StorageService {
  private static generateKey(prefix: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${prefix}/${timestamp}-${random}`;
  }

  static async uploadFile(file: Express.Multer.File, prefix: string): Promise<string> {
    if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      throw new Error('Invalid file type');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds limit');
    }

    const key = this.generateKey(prefix);
    
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    return key;
  }

  static async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    return getSignedUrl(r2Client, command, { expiresIn });
  }

  static async deleteFile(key: string): Promise<void> {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
  }
} 