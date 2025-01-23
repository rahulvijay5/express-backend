import crypto from 'crypto';

export class EncryptionService {
  private static algorithm = 'aes-256-gcm';
  private static keyLength = 32;
  private static ivLength = 16;
  private static saltLength = 64;
  private static tagLength = 16;

  private static generateKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, 100000, this.keyLength, 'sha512');
  }

  static encrypt(data: Buffer): { 
    encryptedData: Buffer; 
    encryptionKey: string;
  } {
    const salt = crypto.randomBytes(this.saltLength);
    const iv = crypto.randomBytes(this.ivLength);
    const password = crypto.randomBytes(32).toString('hex');
    const key = this.generateKey(password, salt);
    
    const cipher = crypto.createCipheriv(this.algorithm, key, iv, {
      authTagLength: this.tagLength
    });
    
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Combine all components for storage
    const encryptedData = Buffer.concat([
      salt,
      iv,
      tag,
      encrypted
    ]);

    return {
      encryptedData,
      encryptionKey: password
    };
  }

  static decrypt(encryptedData: Buffer, password: string): Buffer {
    const salt = encryptedData.subarray(0, this.saltLength);
    const iv = encryptedData.subarray(this.saltLength, this.saltLength + this.ivLength);
    const tag = encryptedData.subarray(this.saltLength + this.ivLength, this.saltLength + this.ivLength + this.tagLength);
    const encrypted = encryptedData.subarray(this.saltLength + this.ivLength + this.tagLength);
    
    const key = this.generateKey(password, salt);
    
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv, {
      authTagLength: this.tagLength
    });
    
    decipher.setAuthTag(tag);
    
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }
} 