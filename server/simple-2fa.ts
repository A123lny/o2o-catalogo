import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

// Migliora la tipizzazione di speakeasy.generateSecret
interface GeneratedSecretWithUrl {
  base32: string;
  otpauth_url: string;
}

/**
 * Servizio semplificato per gestione 2FA
 * Utilizza un approccio minimalista per ridurre i potenziali errori
 */

// Genera un segreto TOTP
export function generateSecret(username: string): { base32: string, otpauth_url: string } {
  console.log("Generazione segreto per:", username);
  
  const secretObj = speakeasy.generateSecret({
    name: encodeURIComponent(`o2o Mobility:${username}`),
    issuer: encodeURIComponent('o2o Mobility'),
    length: 20
  });
  
  // Assicurati che otpauth_url esista
  if (!secretObj.otpauth_url) {
    // Crea manualmente l'URL otpauth se non disponibile
    secretObj.otpauth_url = `otpauth://totp/${encodeURIComponent('o2o Mobility')}:${encodeURIComponent(username)}?secret=${secretObj.base32}&issuer=${encodeURIComponent('o2o Mobility')}`;
  }
  
  return {
    base32: secretObj.base32,
    otpauth_url: secretObj.otpauth_url
  };
}

// Genera un QR code come immagine
export async function generateQRCode(otpauthUrl: string): Promise<string> {
  console.log("Generazione QR code per URL:", otpauthUrl);
  
  try {
    const dataUrl = await qrcode.toDataURL(otpauthUrl);
    return dataUrl;
  } catch (error) {
    console.error("Errore nella generazione QR code:", error);
    // In caso di errore ritorna una stringa vuota o un messaggio di errore
    return '';
  }
}

// Verifica un token TOTP
export function verifyToken(secret: string, token: string): boolean {
  try {
    // Pulisce eventuali spazi o caratteri non numerici
    const cleanToken = token.replace(/\s+/g, '').replace(/\D/g, '');
    
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: cleanToken,
      window: 1 // Tollera 1 step (±30 secondi)
    });
  } catch (error) {
    console.error("Errore nella verifica token:", error);
    return false;
  }
}

// Genera codici di backup sicuri
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  
  // Crea codici alfanumerici random
  for (let i = 0; i < count; i++) {
    // Genera un codice di 8 caratteri
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  
  return codes;
}

// Genera un token TOTP per testing
export function generateTestToken(secret: string): string {
  return speakeasy.totp({
    secret: secret,
    encoding: 'base32'
  });
}