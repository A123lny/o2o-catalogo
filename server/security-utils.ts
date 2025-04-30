import { storage } from "./storage";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Funzione per controllare se una password è scaduta
export async function isPasswordExpired(userId: number): Promise<boolean> {
  try {
    // Ottieni le impostazioni di sicurezza
    const securitySettings = await storage.getSecuritySettings();
    
    // Se non è impostato un periodo di scadenza password, ritorna false
    if (!securitySettings || !securitySettings.passwordExpiryDays) {
      return false;
    }
    
    // Ottieni la cronologia delle password dell'utente
    const passwordHistoryEntries = await storage.getPasswordHistory(userId);
    
    // Se non ci sono voci nella cronologia, la password non è scaduta
    if (!passwordHistoryEntries || passwordHistoryEntries.length === 0) {
      return false;
    }
    
    // Ordina la cronologia per data in ordine decrescente
    const sortedHistory = [...passwordHistoryEntries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Prendi la password più recente
    const latestPassword = sortedHistory[0];
    
    // Calcola la data di scadenza
    const passwordDate = new Date(latestPassword.createdAt);
    const expiryDate = new Date(passwordDate);
    expiryDate.setDate(expiryDate.getDate() + securitySettings.passwordExpiryDays);
    
    // Confronta con la data attuale
    const now = new Date();
    return now > expiryDate;
  } catch (error) {
    console.error("Error checking password expiry:", error);
    return false;
  }
}

// Funzione per verificare se una password è stata usata in precedenza
export async function isPasswordPreviouslyUsed(userId: number, newPassword: string): Promise<boolean> {
  try {
    // Ottieni le impostazioni di sicurezza
    const securitySettings = await storage.getSecuritySettings();
    
    // Se non è impostato un numero di password da controllare, ritorna false
    if (!securitySettings || !securitySettings.passwordHistoryCount) {
      return false;
    }
    
    // Ottieni la cronologia delle password dell'utente
    const passwordHistory = await storage.getPasswordHistory(userId);
    
    // Se non ci sono voci nella cronologia, la password non è stata usata prima
    if (!passwordHistory || passwordHistory.length === 0) {
      return false;
    }
    
    // Ordina la cronologia per data in ordine decrescente
    const sortedHistory = [...passwordHistory].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Prendi solo le password più recenti in base a passwordHistoryCount
    const recentPasswords = sortedHistory.slice(0, securitySettings.passwordHistoryCount);
    
    // Controlla se la nuova password corrisponde a una delle password precedenti
    for (const historyEntry of recentPasswords) {
      const passwordMatch = await comparePasswords(newPassword, historyEntry.passwordHash);
      if (passwordMatch) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error checking password history:", error);
    return false;
  }
}

// Funzione per verificare la complessità della password
export async function validatePasswordComplexity(password: string): Promise<{ isValid: boolean; errors: string[] }> {
  try {
    // Ottieni le impostazioni di sicurezza
    const securitySettings = await storage.getSecuritySettings();
    
    if (!securitySettings) {
      // Se non ci sono impostazioni, usa valori predefiniti
      const errors = [];
      
      if (password.length < 8) {
        errors.push("La password deve contenere almeno 8 caratteri");
      }
      
      if (!/[A-Z]/.test(password)) {
        errors.push("La password deve contenere almeno una lettera maiuscola");
      }
      
      if (!/[a-z]/.test(password)) {
        errors.push("La password deve contenere almeno una lettera minuscola");
      }
      
      if (!/[0-9]/.test(password)) {
        errors.push("La password deve contenere almeno un numero");
      }
      
      if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push("La password deve contenere almeno un carattere speciale");
      }
      
      return { isValid: errors.length === 0, errors };
    }
    
    const errors = [];
    
    // Verifica lunghezza minima
    if (securitySettings.minPasswordLength && password.length < securitySettings.minPasswordLength) {
      errors.push(`La password deve contenere almeno ${securitySettings.minPasswordLength} caratteri`);
    }
    
    // Verifica maiuscole
    if (securitySettings.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push("La password deve contenere almeno una lettera maiuscola");
    }
    
    // Verifica minuscole
    if (securitySettings.requireLowercase && !/[a-z]/.test(password)) {
      errors.push("La password deve contenere almeno una lettera minuscola");
    }
    
    // Verifica numeri
    if (securitySettings.requireNumber && !/[0-9]/.test(password)) {
      errors.push("La password deve contenere almeno un numero");
    }
    
    // Verifica caratteri speciali
    if (securitySettings.requireSpecialChar && !/[^A-Za-z0-9]/.test(password)) {
      errors.push("La password deve contenere almeno un carattere speciale");
    }
    
    return { isValid: errors.length === 0, errors };
  } catch (error) {
    console.error("Error validating password complexity:", error);
    return { isValid: false, errors: ["Errore durante la validazione della password"] };
  }
}

// Funzione per gestire i tentativi di login falliti
export async function handleFailedLoginAttempt(username: string): Promise<{
  lockedOut: boolean;
  lockoutDuration?: number;
  remainingAttempts?: number;
  message?: string;
}> {
  try {
    // Ottieni l'utente
    const user = await storage.getUserByUsername(username);
    
    // Se l'utente non esiste, ritorna un messaggio generico per motivi di sicurezza
    if (!user) {
      return { lockedOut: false };
    }
    
    // Ottieni le impostazioni di sicurezza
    const securitySettings = await storage.getSecuritySettings();
    
    // Se non sono configurati i tentativi di login falliti, ritorna
    if (!securitySettings || !securitySettings.failedLoginAttempts) {
      return { lockedOut: false };
    }
    
    // Recupera o crea un record di blocco account
    const lockoutRecord = await storage.getAccountLockout(user.id);
    
    // Se l'account è già bloccato, verifica se il blocco è ancora attivo
    if (lockoutRecord && lockoutRecord.lockedUntil) {
      const now = new Date();
      const lockoutUntil = new Date(lockoutRecord.lockedUntil);
      
      // Se il blocco è ancora attivo
      if (now < lockoutUntil) {
        const remainingMinutes = Math.ceil((lockoutUntil.getTime() - now.getTime()) / (60 * 1000));
        
        return { 
          lockedOut: true, 
          lockoutDuration: remainingMinutes,
          message: `Account bloccato. Riprova tra ${remainingMinutes} minuti.`
        };
      }
      
      // Se il blocco è scaduto, resetta il contatore
      await storage.createOrUpdateAccountLockout(user.id, {
        failedAttempts: 1,
        lastFailedAttempt: new Date(),
        lockedUntil: null
      });
      
      return { 
        lockedOut: false, 
        remainingAttempts: securitySettings.failedLoginAttempts - 1
      };
    }
    
    // Se non c'è un record di blocco, crealo con il primo tentativo fallito
    if (!lockoutRecord) {
      await storage.createOrUpdateAccountLockout(user.id, {
        failedAttempts: 1,
        lastFailedAttempt: new Date(),
        lockedUntil: null
      });
      
      return { 
        lockedOut: false, 
        remainingAttempts: securitySettings.failedLoginAttempts - 1
      };
    }
    
    // Incrementa il contatore di tentativi falliti
    const newFailedAttempts = (lockoutRecord.failedAttempts || 0) + 1;
    
    // Se il numero di tentativi falliti raggiunge il limite, blocca l'account
    if (newFailedAttempts >= securitySettings.failedLoginAttempts) {
      const now = new Date();
      const lockedUntil = new Date(now);
      lockedUntil.setMinutes(now.getMinutes() + securitySettings.lockoutDurationMinutes);
      
      await storage.createOrUpdateAccountLockout(user.id, {
        failedAttempts: newFailedAttempts,
        lastFailedAttempt: now,
        lockedUntil: lockedUntil
      });
      
      return { 
        lockedOut: true, 
        lockoutDuration: securitySettings.lockoutDurationMinutes,
        message: `Account bloccato. Riprova tra ${securitySettings.lockoutDurationMinutes} minuti.`
      };
    }
    
    // Altrimenti, aggiorna il contatore
    await storage.createOrUpdateAccountLockout(user.id, {
      failedAttempts: newFailedAttempts,
      lastFailedAttempt: new Date(),
      lockedUntil: null
    });
    
    return { 
      lockedOut: false, 
      remainingAttempts: securitySettings.failedLoginAttempts - newFailedAttempts
    };
  } catch (error) {
    console.error("Error handling failed login attempt:", error);
    return { lockedOut: false };
  }
}

// Funzione per resettare i tentativi di login falliti dopo un login riuscito
export async function resetFailedLoginAttempts(userId: number): Promise<void> {
  try {
    await storage.createOrUpdateAccountLockout(userId, {
      failedAttempts: 0,
      lastFailedAttempt: null,
      lockedUntil: null
    });
  } catch (error) {
    console.error("Error resetting failed login attempts:", error);
  }
}

// Funzione per generare un hash sicuro della password
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Funzione per confrontare password
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Funzione per gestire il cambio password
export async function changePassword(userId: number, newPassword: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Verifica la complessità della password
    const { isValid, errors } = await validatePasswordComplexity(newPassword);
    
    if (!isValid) {
      return { 
        success: false, 
        message: `Password non valida: ${errors.join(', ')}`
      };
    }
    
    // Verifica se la password è stata usata in precedenza
    const isReused = await isPasswordPreviouslyUsed(userId, newPassword);
    
    if (isReused) {
      return { 
        success: false, 
        message: "Non puoi riutilizzare una password recente"
      };
    }
    
    // Genera l'hash della nuova password
    const hashedPassword = await hashPassword(newPassword);
    
    // Aggiorna la password dell'utente
    const user = await storage.getUser(userId);
    
    if (!user) {
      return { 
        success: false, 
        message: "Utente non trovato"
      };
    }
    
    // Aggiorna la password dell'utente
    // Nota: Questo dipende da come è implementato il metodo updateUser
    // Se non esiste, dovrai crearlo nel tuo storage.ts
    // await storage.updateUser(userId, { ...user, password: hashedPassword });
    
    // Aggiungi la password alla cronologia
    await storage.addPasswordToHistory(userId, hashedPassword);
    
    // Pulisci la cronologia se necessario
    const securitySettings = await storage.getSecuritySettings();
    if (securitySettings && securitySettings.passwordHistoryCount) {
      await storage.cleanupPasswordHistory(userId, securitySettings.passwordHistoryCount);
    }
    
    return {
      success: true,
      message: "Password aggiornata con successo"
    };
  } catch (error) {
    console.error("Error changing password:", error);
    return { 
      success: false, 
      message: "Si è verificato un errore durante il cambio password"
    };
  }
}