import * as sodium from 'sodium-native';
import dotenv from 'dotenv';

dotenv.config();

export function getSecretKey(): string {
  return process.env.VUE_APP_SECRET_KEY || '';
}

export function unhash(encrypted: string, secret: string): string | null {
  if (!encrypted) return null;
  
  try {
    const key = Buffer.from(secret, 'hex');
    const nonce = Buffer.from(encrypted.substring(0, 48), 'hex');
    const ciphertext = Buffer.from(encrypted.substring(48), 'hex');
    
    const decrypted = Buffer.alloc(ciphertext.length - sodium.crypto_secretbox_MACBYTES);
    
    if (!sodium.crypto_secretbox_open_easy(decrypted, ciphertext, nonce, key)) {
      return encrypted;
    }
    
    return decrypted.toString();
  } catch (error) {
    console.error('Unhash error:', error);
    return encrypted;
  }
}

export function hash(message: string, secret: string): string {
  if (!message || typeof message !== 'string') return '';
  
  try {
    const key = Buffer.from(secret, 'hex');
    const nonce = Buffer.alloc(sodium.crypto_secretbox_NONCEBYTES);
    sodium.randombytes_buf(nonce);
    
    const ciphertext = Buffer.alloc(message.length + sodium.crypto_secretbox_MACBYTES);
    sodium.crypto_secretbox_easy(ciphertext, Buffer.from(message), nonce, key);
    
    return Buffer.from(nonce).toString('hex') + Buffer.from(ciphertext).toString('hex');
  } catch (error) {
    console.error('Hash error:', error);
    return message;
  }
}