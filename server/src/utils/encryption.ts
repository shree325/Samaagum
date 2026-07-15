import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// We require a 32-byte key for AES-256
function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || '';
  if (!secret) {
    throw new Error('ENCRYPTION_KEY environment variable is missing.');
  }
  // Pad or truncate to 32 bytes
  const buffer = Buffer.alloc(32);
  buffer.write(secret, 0, 'utf8');
  return buffer;
}

export function encrypt(plaintext: string): string {
  if (!plaintext) return '';
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  
  const authTag = cipher.getAuthTag().toString('base64');
  const ivBase64 = iv.toString('base64');
  
  // Format: iv:authTag:ciphertext
  return `${ivBase64}:${authTag}:${ciphertext}`;
}

export function decrypt(encoded: string): string {
  if (!encoded) return '';
  const parts = encoded.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format.');
  }
  
  const [ivBase64, authTagBase64, ciphertext] = parts;
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const key = getKey();
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
  plaintext += decipher.final('utf8');
  
  return plaintext;
}
