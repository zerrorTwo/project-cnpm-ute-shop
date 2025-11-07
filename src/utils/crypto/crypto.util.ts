import * as crypto from 'crypto';

// Use SHA256 to generate a 32-byte key
const ENCRYPTION_KEY = crypto.createHash('sha256').update('gumi-wns-meal-order-key').digest();
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    // Combine IV and encrypted data and convert to base64
    return Buffer.concat([iv, encrypted]).toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
}

export function decrypt(text: string): string {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(text, 'base64');
    
    // Extract IV and encrypted data
    const iv = buffer.slice(0, IV_LENGTH);
    const encrypted = buffer.slice(IV_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Decryption failed');
  }
}
