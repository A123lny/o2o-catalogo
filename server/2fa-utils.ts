import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import { storage } from './storage';

// Genera un nuovo secret per 2FA
export async function generateSecret(userId: number, username: string) {
  // Genera il secret
  const secret = speakeasy.generateSecret({
    name: `o2o Mobility (${username})`,
    issuer: 'o2o Mobility'
  });

  // Genera i codici di backup
  const backupCodes = Array(8).fill(0).map(() => generateBackupCode());
  
  // Genera il QR code
  const qrCode = await generateQRCode(secret.otpauth_url || '');

  // Salva nel database
  await storage.createTwoFactorAuth({
    userId,
    secret: secret.base32,
    isVerified: false,
    backupCodes
  });

  return {
    secret: secret.base32,
    qrCode,
    backupCodes
  };
}

// Verifica un token TOTP
export async function verifyToken(userId: number, token: string) {
  const twoFactor = await storage.getUserTwoFactorAuth(userId);
  
  if (!twoFactor || !twoFactor.secret) {
    return false;
  }

  const verified = speakeasy.totp.verify({
    secret: twoFactor.secret,
    encoding: 'base32',
    token,
    window: 2 // Permette una tolleranza di +/- 2 step (60 secondi)
  });

  // Se verificato e non era già verificato, aggiorna lo stato
  if (verified && !twoFactor.isVerified) {
    await storage.updateTwoFactorAuth(userId, {
      isVerified: true
    });
  }

  return verified;
}

// Verifica un codice di backup
export async function verifyBackupCode(userId: number, code: string) {
  return storage.useBackupCode(userId, code);
}

// Disabilita 2FA per un utente
export async function disable2FA(userId: number) {
  await storage.deleteTwoFactorAuth(userId);
  return true;
}

// Genera un QR code da un URL
async function generateQRCode(otpauthUrl: string): Promise<string> {
  try {
    // Prima prova a generare un SVG per compatibilità migliore
    try {
      return await QRCode.toString(otpauthUrl, { type: 'svg' });
    } catch (svgError) {
      console.warn('SVG generation failed, falling back to data URL:', svgError);
      // Fallback a URL dei dati se SVG fallisce
      return await QRCode.toDataURL(otpauthUrl);
    }
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

// Genera un codice di backup casuale
function generateBackupCode(): string {
  return randomBytes(4).toString('hex');
}