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
  try {
    console.log("Generazione nuovo segreto TOTP semplificata per:", username);
    
    // Genera un nuovo segreto con speakeasy
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `${APP_NAME}:${username}`,
      issuer: APP_NAME
    }).base32;

    console.log("Secret generato con successo, lunghezza:", secret.length);
    
    // Crea l'URL otpauth per l'app di autenticazione
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(APP_NAME)}:${encodeURIComponent(username)}?secret=${secret}&issuer=${encodeURIComponent(APP_NAME)}&algorithm=SHA1&digits=6&period=30`;
    
    console.log("TOTP URL generato:", otpauthUrl);
    
    // Genera il QR code direttamente dalla stringa otpauth
    try {
      // Utilizza opzioni minime per la generazione del QR code
      const qrOptions = {
        errorCorrectionLevel: 'M' as const,
        type: 'image/png' as const,
        margin: 1,
        scale: 4
      };
      
      const qrCodeUrl = await qrcode.toDataURL(otpauthUrl, qrOptions);
      console.log("QR code generato con successo, lunghezza URL:", qrCodeUrl.length);
      
      return { secret, qrCodeUrl };
    } catch (qrError) {
      console.error("Errore nella generazione del QR code:", qrError);
      
      // Fallback: ritorna solo il segreto senza QR code
      return { 
        secret, 
        qrCodeUrl: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=` // Immagine vuota 1x1
      };
    }
  } catch (error) {
    console.error("Errore generale nella generazione TOTP:", error);
    throw new Error("Impossibile generare il codice QR per l'autenticazione a due fattori");
  }
}

/**
 * Verifica un token TOTP.
 * @param secret Il segreto TOTP dell'utente
 * @param token Il token fornito dall'utente
 * @returns true se il token è valido, false altrimenti
 */
export function verifyTOTP(secret: string, token: string): boolean {
  try {
    // Pulisci il token da spazi o caratteri non numerici
    const cleanToken = token.replace(/\s+/g, '').replace(/\D/g, '');
    
    // Verifica il token con una finestra temporale di ±1 unità (30 secondi)
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: cleanToken,
      window: 1
    });
  } catch (error) {
    console.error('Errore nella verifica del token TOTP:', error);
    return false;
  }
}

/**
 * Genera codici di backup casuali.
 * @param count Numero di codici da generare
 * @returns Array di codici di backup
 */
export function generateBackupCodes(count: number = 8): string[] {
  return Array.from({ length: count }, () => 
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );
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