import crypto from 'crypto';

// Use a secure encryption key from environment variables
// In production, this should be a strong, unique secret stored securely
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'default-encryption-key-change-in-production';

// Use a unique salt per application instance, from environment or randomly generated at startup
const ENCRYPTION_SALT = process.env.ENCRYPTION_SALT || crypto.randomBytes(16).toString('hex');

// Derive a 32-byte key from the secret (AES-256 requires 32 bytes)
const getKey = (): Buffer => {
  return crypto.scryptSync(ENCRYPTION_KEY, ENCRYPTION_SALT, 32);
};

const IV_LENGTH = 16; // AES block size

/**
 * Encrypts sensitive data using AES-256-CBC
 * @param text - The plaintext to encrypt
 * @returns The encrypted string in format: iv:encryptedData (both in hex)
 */
export const encrypt = (text: string): string => {
  if (!text) return '';
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return iv:encryptedData format
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypts data that was encrypted with the encrypt function
 * @param encryptedText - The encrypted string in format: iv:encryptedData
 * @returns The decrypted plaintext
 */
export const decrypt = (encryptedText: string): string => {
  if (!encryptedText) return '';
  
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted text format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedData = parts[1];
  const key = getKey();
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

/**
 * Creates a secure hash of a value (one-way, for verification purposes)
 * @param value - The value to hash
 * @returns The hash string
 */
export const hash = (value: string): string => {
  return crypto.createHash('sha256').update(value).digest('hex');
};

/**
 * Masks sensitive data for display (shows only last 4 characters)
 * @param value - The sensitive value to mask
 * @returns The masked string
 */
export const maskSensitiveData = (value: string): string => {
  if (!value || value.length < 8) return '****';
  return `${'*'.repeat(value.length - 4)}${value.slice(-4)}`;
};
