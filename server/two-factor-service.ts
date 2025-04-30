import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

// Nome dell'applicazione
const APP_NAME = 'o2o Mobility';

/**
 * Genera un nuovo segreto TOTP e il relativo QR code.
 * @param username Nome utente per cui generare il segreto
 * @returns Il segreto generato e l'URL del QR code
 */
export async function generateTOTP(username: string): Promise<{ secret: string; qrCodeUrl: string }> {
  // Genera un nuovo segreto
  const secretObj = speakeasy.generateSecret({
    name: `${APP_NAME}:${username}`,
    issuer: APP_NAME,
    length: 20 // Lunghezza del segreto (20 byte è considerato sicuro)
  });

  // Ottieni il segreto in formato base32
  const secret = secretObj.base32;

  // Crea un URL otpauth per l'app autenticatore
  const otpauthUrl = speakeasy.otpauthURL({
    secret,
    label: `${APP_NAME}:${username}`,
    issuer: APP_NAME,
    encoding: 'base32'
  });

  // Genera il QR code come stringa di dati
  const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);

  return { secret, qrCodeUrl };
}

/**
 * Verifica un token TOTP.
 * @param secret Il segreto TOTP dell'utente
 * @param token Il token fornito dall'utente
 * @returns true se il token è valido, false altrimenti
 */
export function verifyTOTP(secret: string, token: string): boolean {
  try {
    // Verifica il token con una finestra temporale di ±1 unità (30 secondi per unità)
    // Questo permette di gestire piccole discrepanze nell'orologio del client
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: token.replace(/\s+/g, ''), // Rimuove tutti gli spazi
      window: 1
    });
  } catch (error) {
    console.error('Errore nella verifica del token TOTP:', error);
    return false;
  }
}

/**
 * Genera un token TOTP per test o debugging.
 * @param secret Il segreto TOTP dell'utente
 * @returns Il token TOTP generato
 */
export function generateTOTPToken(secret: string): string {
  return speakeasy.totp({
    secret,
    encoding: 'base32'
  });
}