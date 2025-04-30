/**
 * TOTP.ts
 * 
 * Implementazione minimalistica per la gestione dell'autenticazione TOTP (Time-based One-Time Password)
 * Utilizza le librerie standard speakeasy e qrcode
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

/**
 * Genera un nuovo segreto TOTP
 * @param username - Nome utente per il quale generare il segreto
 * @param issuer - Nome dell'emittente (solitamente il nome dell'app)
 * @returns Oggetto con il segreto e altre informazioni
 */
export function generateTOTPSecret(username: string, issuer: string = 'o2o Mobility'): { 
  secret: string, 
  uri: string 
} {
  // Generiamo un nuovo segreto con speakeasy
  const secretObj = speakeasy.generateSecret({
    name: encodeURIComponent(`${issuer}:${username}`),
    issuer: encodeURIComponent(issuer)
  });

  // Nel caso in cui otpauth_url non sia definito, lo creiamo manualmente
  const uri = secretObj.otpauth_url || 
    `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(username)}?secret=${secretObj.base32}&issuer=${encodeURIComponent(issuer)}`;

  // Ritorniamo solo i dati essenziali
  return {
    secret: secretObj.base32,
    uri: uri
  };
}

/**
 * Genera un QR code come data URL per il segreto TOTP
 * @param uri - URI TOTP da codificare nel QR
 * @returns Promise che si risolve con l'URL del QR code
 */
export async function generateQRCode(uri: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(uri, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error("Errore nella generazione del QR code:", error);
    throw error;
  }
}

/**
 * Verifica un token TOTP
 * @param secret - Segreto base32 dell'utente
 * @param token - Token da verificare
 * @returns true se il token è valido, false altrimenti
 */
export function verifyTOTP(secret: string, token: string): boolean {
  try {
    // Rimuoviamo spazi e caratteri non numerici
    const cleanToken = token.replace(/\s+/g, '').replace(/\D/g, '');
    
    // Verifichiamo il token con speakeasy
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: cleanToken,
      window: 1 // Accetta token generati ±30 secondi da ora
    });
  } catch (error) {
    console.error("Errore nella verifica del token TOTP:", error);
    return false;
  }
}

/**
 * Genera codici di backup casuali
 * @param count - Numero di codici da generare
 * @param length - Lunghezza di ciascun codice
 * @returns Array di codici di backup
 */
export function generateBackupCodes(count: number = 8, length: number = 8): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Genera un codice alfanumerico casuale
    let code = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    for (let j = 0; j < length; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Inseriamo un trattino a metà per migliorare la leggibilità
    const half = Math.floor(length / 2);
    code = code.substring(0, half) + '-' + code.substring(half);
    
    codes.push(code);
  }
  
  return codes;
}

/**
 * Genera un token TOTP valido per test
 * @param secret - Segreto base32
 * @returns Token TOTP valido
 */
export function generateTestToken(secret: string): string {
  return speakeasy.totp({
    secret: secret,
    encoding: 'base32'
  });
}