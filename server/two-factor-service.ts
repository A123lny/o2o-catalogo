import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { storage } from './storage';
import { InsertUserTwoFactorSecret, User } from '@shared/schema';

export interface TwoFactorSetupData {
  otpAuthUrl: string;
  qrCodeDataUrl: string;
  secret: string;
}

export class TwoFactorService {
  // Genera un nuovo segreto TOTP per un utente
  static async generateSecret(user: User): Promise<TwoFactorSetupData> {
    const secretResult = speakeasy.generateSecret({
      name: `O2O Mobility (${user.username})`,
      length: 20
    });

    const secret = secretResult.base32;
    const otpAuthUrl = secretResult.otauth_url || '';

    // Genera il QR code come data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    // Salva il segreto nel database (non ancora verificato)
    const data: InsertUserTwoFactorSecret = {
      userId: user.id,
      secret: secret
    };

    // Verifica se l'utente ha già un segreto
    const existingSecret = await storage.getUserTwoFactorSecret(user.id);
    
    // Se esiste, aggiorna; altrimenti, crea
    if (existingSecret) {
      await storage.updateUserTwoFactorSecret(user.id, { secret });
    } else {
      await storage.createUserTwoFactorSecret(data);
    }

    // Aggiorna lo stato 2FA dell'utente (non ancora verificato)
    await storage.updateUser(user.id, { 
      twoFactorEnabled: true,
      twoFactorVerified: false
    });

    return {
      otpAuthUrl,
      qrCodeDataUrl,
      secret
    };
  }

  // Verifica un codice TOTP fornito dall'utente durante la configurazione
  static async verifyTotpSetup(userId: number, token: string): Promise<boolean> {
    const twoFactorSecret = await storage.getUserTwoFactorSecret(userId);
    
    if (!twoFactorSecret || !twoFactorSecret.secret) {
      return false;
    }

    const verified = speakeasy.totp.verify({
      secret: twoFactorSecret.secret,
      encoding: 'base32',
      token,
      window: 1 // Consente una leggera tolleranza temporale (30 secondi prima/dopo)
    });

    if (verified) {
      // Marca l'utente come verificato per 2FA
      await storage.updateUser(userId, { twoFactorVerified: true });
    }

    return verified;
  }

  // Verifica un codice TOTP durante il login
  static async verifyTotp(userId: number, token: string): Promise<boolean> {
    const twoFactorSecret = await storage.getUserTwoFactorSecret(userId);
    
    if (!twoFactorSecret || !twoFactorSecret.secret) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: twoFactorSecret.secret,
      encoding: 'base32',
      token,
      window: 1
    });
  }

  // Disabilita 2FA per un utente
  static async disable2FA(userId: number): Promise<void> {
    await storage.updateUser(userId, { 
      twoFactorEnabled: false,
      twoFactorVerified: false
    });
    await storage.deleteUserTwoFactorSecret(userId);
  }
}