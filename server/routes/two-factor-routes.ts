import { Router, Request, Response, NextFunction } from "express";
import { generateTOTP, verifyTOTP } from "../two-factor-service";
import { storage } from "../storage";

// Middleware per verificare se l'utente è autenticato
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Non autorizzato" });
};

// Middleware per verificare se l'utente è un amministratore
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user?.role === "admin") {
    return next();
  }
  res.status(403).json({ error: "Accesso negato" });
};

export function setupTwoFactorRoutes(router: Router) {
  // Rotte pubbliche per il processo di autenticazione
  
  // Inizializza la configurazione 2FA per un utente
  router.post("/api/two-factor/setup", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Verifica se l'utente ha già il 2FA configurato
      const existingSecret = await storage.getUserTwoFactorSecret(userId);
      if (existingSecret && existingSecret.verified) {
        return res.status(400).json({ error: "L'autenticazione a due fattori è già configurata." });
      }
      
      // Genera un nuovo segreto TOTP
      const { secret, qrCodeUrl } = await generateTOTP(req.user!.username);
      
      // Salva o aggiorna il segreto nel database (non ancora verificato)
      if (existingSecret) {
        await storage.updateUserTwoFactorSecret(userId, { 
          secret, 
          verified: false,
          backupCodes: JSON.stringify([]) // Reset backup codes
        });
      } else {
        await storage.createUserTwoFactorSecret({
          userId,
          secret,
          verified: false,
          backupCodes: JSON.stringify([])
        });
      }
      
      // Aggiorna lo stato dell'utente
      await storage.updateUser(userId, { twoFactorEnabled: true, twoFactorVerified: false });
      
      res.json({ qrCodeUrl });
    } catch (error) {
      console.error("Errore durante il setup 2FA:", error);
      res.status(500).json({ error: "Errore durante la configurazione dell'autenticazione a due fattori." });
    }
  });
  
  // Verifica il token 2FA durante il setup
  router.post("/api/two-factor/verify-setup", isAuthenticated, async (req, res) => {
    try {
      const { token } = req.body;
      const userId = req.user!.id;
      
      if (!token) {
        return res.status(400).json({ error: "Token mancante." });
      }
      
      // Recupera il segreto dell'utente
      const secret = await storage.getUserTwoFactorSecret(userId);
      if (!secret) {
        return res.status(400).json({ error: "Segreto 2FA non trovato. Inizia nuovamente il setup." });
      }
      
      // Verifica il token
      const isValid = verifyTOTP(secret.secret, token);
      if (!isValid) {
        return res.status(400).json({ error: "Token non valido." });
      }
      
      // Aggiorna lo stato di verifica
      await storage.updateUserTwoFactorSecret(userId, { verified: true });
      
      // Genera codici di backup casuali
      const backupCodes = Array.from({ length: 8 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );
      
      // Salva i codici di backup
      await storage.updateUserTwoFactorSecret(userId, { backupCodes: JSON.stringify(backupCodes) });
      
      // Aggiorna lo stato dell'utente
      await storage.updateUser(userId, { twoFactorVerified: true });
      
      res.json({ success: true, backupCodes });
    } catch (error) {
      console.error("Errore durante la verifica del token:", error);
      res.status(500).json({ error: "Errore durante la verifica del token." });
    }
  });
  
  // Verifica il token 2FA durante il login
  router.post("/api/two-factor/verify", async (req, res) => {
    try {
      const { username, token } = req.body;
      
      if (!username || !token) {
        return res.status(400).json({ error: "Username e token sono richiesti." });
      }
      
      // Recupera l'utente e il relativo segreto
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(400).json({ error: "Utente non trovato." });
      }
      
      // Controlla se l'utente ha il 2FA abilitato
      if (!user.twoFactorEnabled || !user.twoFactorVerified) {
        return res.status(400).json({ error: "L'autenticazione a due fattori non è configurata per questo utente." });
      }
      
      const secret = await storage.getUserTwoFactorSecret(user.id);
      if (!secret) {
        return res.status(400).json({ error: "Errore: configurazione 2FA non trovata." });
      }
      
      // Verifica il token o i codici di backup
      const isValidToken = verifyTOTP(secret.secret, token);
      
      // Verifica se è un codice di backup
      let isBackupCode = false;
      let remainingBackupCodes: string[] = [];
      
      if (!isValidToken && secret.backupCodes) {
        const backupCodes = JSON.parse(secret.backupCodes);
        isBackupCode = backupCodes.includes(token);
        
        if (isBackupCode) {
          // Rimuove il codice di backup utilizzato
          remainingBackupCodes = backupCodes.filter((code: string) => code !== token);
          await storage.updateUserTwoFactorSecret(user.id, { 
            backupCodes: JSON.stringify(remainingBackupCodes) 
          });
        }
      }
      
      if (!isValidToken && !isBackupCode) {
        return res.status(400).json({ error: "Token o codice di backup non valido." });
      }
      
      // Loggare l'utente qui o restituire successo
      // Login è gestito separatamente nell'autenticazione
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        },
        isBackupCodeUsed: isBackupCode,
        remainingBackupCodes: isBackupCode ? remainingBackupCodes.length : undefined
      });
    } catch (error) {
      console.error("Errore durante la verifica 2FA:", error);
      res.status(500).json({ error: "Errore durante la verifica dell'autenticazione a due fattori." });
    }
  });
  
  // Disabilita 2FA per l'utente corrente
  router.post("/api/two-factor/disable", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Elimina il segreto 2FA
      await storage.deleteUserTwoFactorSecret(userId);
      
      // Aggiorna lo stato dell'utente
      await storage.updateUser(userId, { twoFactorEnabled: false, twoFactorVerified: null });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Errore durante la disabilitazione 2FA:", error);
      res.status(500).json({ error: "Errore durante la disabilitazione dell'autenticazione a due fattori." });
    }
  });
  
  // Rigenerazione dei codici di backup
  router.post("/api/two-factor/regenerate-backup", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Verifica se l'utente ha il 2FA configurato
      const secret = await storage.getUserTwoFactorSecret(userId);
      if (!secret || !secret.verified) {
        return res.status(400).json({ error: "L'autenticazione a due fattori non è completamente configurata." });
      }
      
      // Genera nuovi codici di backup
      const backupCodes = Array.from({ length: 8 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );
      
      // Salva i nuovi codici
      await storage.updateUserTwoFactorSecret(userId, { backupCodes: JSON.stringify(backupCodes) });
      
      // Aggiungi log di attività
      await storage.createActivityLog({
        userId,
        action: "update",
        entityType: "two_factor",
        entityId: userId,
        details: "Rigenerazione codici di backup 2FA",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || ""
      });
      
      res.json({ success: true, backupCodes });
    } catch (error) {
      console.error("Errore durante la rigenerazione dei codici di backup:", error);
      res.status(500).json({ error: "Errore durante la rigenerazione dei codici di backup." });
    }
  });
  
  // --- ROTTE AMMINISTRATIVE ---
  
  // Ottieni statistiche 2FA
  router.get("/api/admin/two-factor/status", isAdmin, async (req, res) => {
    try {
      // Recupera impostazioni di sicurezza per verificare se il 2FA è abilitato globalmente
      const securitySettings = await storage.getSecuritySettings();
      const globalEnabled = securitySettings?.enable2FA || false;
      
      // Recupera tutti gli utenti
      const users = await storage.getUsers();
      const totalUsers = users.length;
      
      // Conta gli utenti con 2FA abilitato e verificato
      const enabledCount = users.filter(user => user.twoFactorEnabled && user.twoFactorVerified).length;
      
      res.json({
        globalEnabled,
        totalUsers,
        enabledCount,
        percentageEnabled: totalUsers > 0 ? (enabledCount / totalUsers) * 100 : 0
      });
    } catch (error) {
      console.error("Errore durante il recupero delle statistiche 2FA:", error);
      res.status(500).json({ error: "Errore durante il recupero delle statistiche 2FA." });
    }
  });
  
  // Reset 2FA per tutti gli utenti (solo admin)
  router.post("/api/admin/two-factor/reset-all", isAdmin, async (req, res) => {
    try {
      // Recupera tutti gli utenti
      const users = await storage.getUsers();
      
      // Per ogni utente, elimina il segreto 2FA e reimposta lo stato
      for (const user of users) {
        await storage.deleteUserTwoFactorSecret(user.id);
        await storage.updateUser(user.id, { twoFactorEnabled: false, twoFactorVerified: null });
      }
      
      // Aggiungi log di attività
      await storage.createActivityLog({
        userId: req.user!.id,
        action: "reset",
        entityType: "two_factor",
        entityId: 0, // id generico per reset globale
        details: "Reset globale dell'autenticazione a due fattori",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || ""
      });
      
      res.json({ success: true, message: "L'autenticazione a due fattori è stata reimpostata per tutti gli utenti." });
    } catch (error) {
      console.error("Errore durante il reset 2FA per tutti gli utenti:", error);
      res.status(500).json({ error: "Errore durante il reset dell'autenticazione a due fattori." });
    }
  });
  
  // Reset 2FA per un utente specifico (solo admin)
  router.post("/api/admin/two-factor/reset/:userId", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "ID utente non valido." });
      }
      
      // Verifica che l'utente esista
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Utente non trovato." });
      }
      
      // Elimina il segreto 2FA
      await storage.deleteUserTwoFactorSecret(userId);
      
      // Aggiorna lo stato dell'utente
      await storage.updateUser(userId, { twoFactorEnabled: false, twoFactorVerified: null });
      
      // Aggiungi log di attività
      await storage.createActivityLog({
        userId: req.user!.id,
        action: "reset",
        entityType: "two_factor",
        entityId: userId,
        details: `Reset 2FA per l'utente ${user.username}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || ""
      });
      
      res.json({ success: true, message: "L'autenticazione a due fattori è stata reimpostata per l'utente." });
    } catch (error) {
      console.error("Errore durante il reset 2FA per l'utente:", error);
      res.status(500).json({ error: "Errore durante il reset dell'autenticazione a due fattori." });
    }
  });
}