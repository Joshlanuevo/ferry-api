import { SodiumPlus, CryptographyKey } from 'sodium-plus';
import { Buffer } from 'buffer';
import dotenv from 'dotenv';

dotenv.config();

let sodiumInstance: SodiumPlus;

async function getSodium(): Promise<SodiumPlus> {
  if (!sodiumInstance) {
    sodiumInstance = await SodiumPlus.auto();
  }
  return sodiumInstance;
}

export async function getSecretKey(): Promise<CryptographyKey> {
  const sodium = await getSodium();

  const secretKeyHex = process.env.VITE_APP_SECRET_KEY;
  if (!secretKeyHex) {
    throw new Error('VITE_APP_SECRET_KEY environment variable is not set');
  }

  const keyBuffer = await sodium.sodium_hex2bin(secretKeyHex);

  // Construct CryptographyKey from buffer
  return new CryptographyKey(keyBuffer);
}

export async function decryptMessage(hash: string): Promise<string> {
  try {
    const sodium = await getSodium();
    const key = await getSecretKey();
    
    // Extract nonce and ciphertext
    const nonce = Buffer.from(hash.substring(0, 48), 'hex');
    const ciphertext = Buffer.from(hash.substring(48), 'hex');
    
    // Decrypt
    const decrypted = await sodium.crypto_secretbox_open(ciphertext, nonce, key);
    return decrypted.toString('utf-8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
}