import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { 
  generateTOTP, 
  verifyTOTP, 
  generateBackupCodes 
} from "../new-two-factor-service";

// Middleware per verificare l'autenticazione
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Autenticazione richiesta" });
};

// Middleware per verificare se l'utente è un amministratore
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user?.role === "admin") {
    return next();
  }
  res.status(403).json({ error: "Accesso negato" });
};

export function setupTwoFactorRoutes(router: Router) {
  
  // SETUP INIZIALE 2FA - Genera QR code
  router.post("/api/two-factor/setup", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const username = req.user!.username;
      
      console.log(`[2FA] Inizializzazione setup per utente ID ${userId} (${username})`);
      
      // Verifica se l'utente ha già completato la configurazione 2FA
      const existingSecret = await storage.getUserTwoFactorSecret(userId);
      if (existingSecret && existingSecret.verified) {
        return res.status(400).json({ 
          error: "L'autenticazione a due fattori è già configurata per questo account" 
        });
      }
      
      // Genera nuovo segreto TOTP e QR code
      const { secret, qrCodeUrl } = await generateTOTP(username);
      console.log(`[2FA] Segreto generato per ${username}, lunghezza: ${secret.length}`);
      
      // Salva o aggiorna il segreto nel database
      if (existingSecret) {
        await storage.updateUserTwoFactorSecret(userId, {
          secret,
          verified: false,
          backupCodes: JSON.stringify([]) // Reset backup codes
        });
        console.log(`[2FA] Aggiornato segreto esistente per ID ${userId}`);
      } else {
        await storage.createUserTwoFactorSecret({
          userId,
          secret,
          verified: false,
          backupCodes: JSON.stringify([])
        });
        console.log(`[2FA] Creato nuovo segreto per ID ${userId}`);
      }
      
      // Aggiorna lo stato dell'utente (2FA abilitato ma non ancora verificato)
      await storage.updateUser(userId, {
        twoFactorEnabled: true,
        twoFactorVerified: false
      });
      
      // Log attività
      await storage.createActivityLog({
        userId,
        action: "setup",
        entityType: "two_factor",
        entityId: userId,
        details: "Inizializzazione setup 2FA",
        ipAddress: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown"
      });
      
      // Ritorna il QR code URL al frontend
      res.json({ qrCodeUrl });
      
    } catch (error) {
      console.error("[2FA] Errore nel setup:", error);
      res.status(500).json({ 
        error: "Impossibile completare la configurazione dell'autenticazione a due fattori" 
      });
    }
  });
  
  // VERIFICA TOKEN DURANTE SETUP
  router.post("/api/two-factor/verify-setup", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { token } = req.body;
      
      console.log(`[2FA] Verifica token durante setup per ID ${userId}, token: ${token}`);
      
      if (!token) {
        return res.status(400).json({ error: "Token mancante" });
      }
      
      // Recupera il segreto dell'utente
      const secret = await storage.getUserTwoFactorSecret(userId);
      if (!secret) {
        return res.status(400).json({ 
          error: "Configurazione 2FA non trovata. Inizia nuovamente il setup." 
        });
      }
      
      // Verifica il token
      const isValid = verifyTOTP(secret.secret, token);
      console.log(`[2FA] Verifica token risultato: ${isValid ? 'valido' : 'non valido'}`);
      
      if (!isValid) {
        return res.status(400).json({ error: "Codice non valido. Riprova." });
      }
      
      // Se valido: aggiorna stato di verifica, genera codici di backup
      const backupCodes: string[] = generateBackupCodes(8);
      
      // Aggiorna il segreto come verificato e salva i codici di backup
      await storage.updateUserTwoFactorSecret(userId, {
        verified: true,
        backupCodes: JSON.stringify(backupCodes)
      });
      
      // Aggiorna lo stato dell'utente
      await storage.updateUser(userId, { twoFactorVerified: true });
      
      // Log attività
      await storage.createActivityLog({
        userId,
        action: "verify",
        entityType: "two_factor",
        entityId: userId,
        details: "Completata verifica 2FA",
        ipAddress: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown"
      });
      
      // Ritorna i codici di backup
      res.json({ success: true, backupCodes });
      
    } catch (error) {
      console.error("[2FA] Errore nella verifica token:", error);
      res.status(500).json({ 
        error: "Errore durante la verifica del token" 
      });
    }
  });
  
  // VERIFICA TOKEN DURANTE LOGIN
  router.post("/api/two-factor/verify", async (req, res) => {
    try {
      const { username, token } = req.body;
      
      console.log(`[2FA] Verifica token durante login per username: ${username}`);
      
      if (!username || !token) {
        return res.status(400).json({ error: "Username e token sono richiesti" });
      }
      
      // Recupera utente
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(400).json({ error: "Utente non trovato" });
      }
      
      // Verifica se l'utente ha 2FA abilitato e verificato
      if (!user.twoFactorEnabled || !user.twoFactorVerified) {
        return res.status(400).json({ 
          error: "L'autenticazione a due fattori non è configurata per questo utente" 
        });
      }
      
      // Recupera il segreto
      const secretData = await storage.getUserTwoFactorSecret(user.id);
      if (!secretData) {
        return res.status(400).json({ 
          error: "Configurazione 2FA non trovata. Contatta l'amministratore." 
        });
      }
      
      // Verifica il token
      const isValidToken = verifyTOTP(secretData.secret, token);
      
      // Se il token non è valido, controlla i codici di backup
      let isBackupCode = false;
      let remainingBackupCodes: string[] = [];
      
      if (!isValidToken && secretData.backupCodes) {
        // Parse backup codes
        const backupCodes = typeof secretData.backupCodes === 'string' ? 
          JSON.parse(secretData.backupCodes) : 
          (Array.isArray(secretData.backupCodes) ? secretData.backupCodes : []);
          
        // Verifica se il token è un codice di backup
        isBackupCode = backupCodes.includes(token);
        
        if (isBackupCode) {
          // Rimuove il codice di backup utilizzato
          remainingBackupCodes = backupCodes.filter(code => code !== token);
          await storage.updateUserTwoFactorSecret(user.id, {
            backupCodes: JSON.stringify(remainingBackupCodes)
          });
          
          // Log utilizzo codice backup
          await storage.createActivityLog({
            userId: user.id,
            action: "login",
            entityType: "two_factor",
            entityId: user.id,
            details: "Login con codice di backup",
            ipAddress: req.ip || "unknown",
            userAgent: req.headers["user-agent"] || "unknown"
          });
        }
      }
      
      // Se né il token né il codice di backup sono validi
      if (!isValidToken && !isBackupCode) {
        return res.status(400).json({ error: "Codice non valido. Riprova." });
      }
      
      // Successo - l'utente ha verificato correttamente l'identità
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
      console.error("[2FA] Errore nella verifica durante login:", error);
      res.status(500).json({ 
        error: "Errore durante la verifica dell'autenticazione a due fattori" 
      });
    }
  });
  
  // DISABILITA 2FA
  router.post("/api/two-factor/disable", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      console.log(`[2FA] Disabilitazione per utente ID ${userId}`);
      
      // Elimina il segreto 2FA
      await storage.deleteUserTwoFactorSecret(userId);
      
      // Aggiorna lo stato dell'utente
      await storage.updateUser(userId, {
        twoFactorEnabled: false,
        twoFactorVerified: false
      });
      
      // Log attività
      await storage.createActivityLog({
        userId,
        action: "disable",
        entityType: "two_factor",
        entityId: userId,
        details: "Disabilitazione 2FA",
        ipAddress: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown"
      });
      
      res.json({ success: true });
      
    } catch (error) {
      console.error("[2FA] Errore nella disabilitazione:", error);
      res.status(500).json({ 
        error: "Errore durante la disabilitazione dell'autenticazione a due fattori" 
      });
    }
  });
  
  // RIGENERA CODICI BACKUP
  router.post("/api/two-factor/regenerate-backup", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      console.log(`[2FA] Rigenerazione codici backup per utente ID ${userId}`);
      
      // Verifica se l'utente ha 2FA configurato
      const secret = await storage.getUserTwoFactorSecret(userId);
      if (!secret || !secret.verified) {
        return res.status(400).json({ 
          error: "L'autenticazione a due fattori non è completamente configurata" 
        });
      }
      
      // Genera nuovi codici di backup
      const backupCodes = generateBackupCodes(8);
      
      // Salva nuovi codici
      await storage.updateUserTwoFactorSecret(userId, {
        backupCodes: JSON.stringify(backupCodes)
      });
      
      // Log attività
      await storage.createActivityLog({
        userId,
        action: "update",
        entityType: "two_factor",
        entityId: userId,
        details: "Rigenerazione codici backup 2FA",
        ipAddress: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown"
      });
      
      res.json({ success: true, backupCodes });
      
    } catch (error) {
      console.error("[2FA] Errore nella rigenerazione codici backup:", error);
      res.status(500).json({ 
        error: "Errore durante la rigenerazione dei codici di backup" 
      });
    }
  });
  
  // ---- ROTTE AMMINISTRATIVE ----
  
  // STATISTICHE 2FA
  router.get("/api/admin/two-factor/status", isAdmin, async (req, res) => {
    try {
      // Statistiche globali 2FA
      const securitySettings = await storage.getSecuritySettings();
      const users = await storage.getUsers();
      
      const totalUsers = users.length;
      const enabledCount = users.filter(u => u.twoFactorEnabled && u.twoFactorVerified).length;
      
      res.json({
        globalEnabled: securitySettings?.enable2FA || false,
        totalUsers,
        enabledCount,
        percentageEnabled: totalUsers > 0 ? Math.round((enabledCount / totalUsers) * 100) : 0
      });
      
    } catch (error) {
      console.error("[2FA Admin] Errore nel recupero statistiche:", error);
      res.status(500).json({ 
        error: "Errore durante il recupero delle statistiche 2FA" 
      });
    }
  });
  
  // RESET 2FA PER TUTTI
  router.post("/api/admin/two-factor/reset-all", isAdmin, async (req, res) => {
    try {
      const adminId = req.user!.id;
      
      console.log(`[2FA Admin] Reset globale iniziato da amministratore ID ${adminId}`);
      
      // Recupera tutti gli utenti
      const users = await storage.getUsers();
      
      // Reset per ogni utente
      for (const user of users) {
        await storage.deleteUserTwoFactorSecret(user.id);
        await storage.updateUser(user.id, {
          twoFactorEnabled: false,
          twoFactorVerified: false
        });
      }
      
      // Log attività
      await storage.createActivityLog({
        userId: adminId,
        action: "reset",
        entityType: "two_factor",
        entityId: 0,
        details: "Reset globale 2FA per tutti gli utenti",
        ipAddress: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown"
      });
      
      res.json({
        success: true,
        message: "L'autenticazione a due fattori è stata reimpostata per tutti gli utenti"
      });
      
    } catch (error) {
      console.error("[2FA Admin] Errore nel reset globale:", error);
      res.status(500).json({ 
        error: "Errore durante il reset globale dell'autenticazione a due fattori" 
      });
    }
  });
  
  // RESET 2FA PER SINGOLO UTENTE
  router.post("/api/admin/two-factor/reset/:userId", isAdmin, async (req, res) => {
    try {
      const adminId = req.user!.id;
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "ID utente non valido" });
      }
      
      // Verifica esistenza utente
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Utente non trovato" });
      }
      
      console.log(`[2FA Admin] Reset per utente ID ${userId} (${user.username}) da amministratore ID ${adminId}`);
      
      // Reset 2FA
      await storage.deleteUserTwoFactorSecret(userId);
      await storage.updateUser(userId, {
        twoFactorEnabled: false,
        twoFactorVerified: false
      });
      
      // Log attività
      await storage.createActivityLog({
        userId: adminId,
        action: "reset",
        entityType: "two_factor",
        entityId: userId,
        details: `Reset 2FA per l'utente ${user.username}`,
        ipAddress: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown"
      });
      
      res.json({
        success: true,
        message: `L'autenticazione a due fattori è stata reimpostata per l'utente ${user.username}`
      });
      
    } catch (error) {
      console.error("[2FA Admin] Errore nel reset singolo utente:", error);
      res.status(500).json({ 
        error: "Errore durante il reset dell'autenticazione a due fattori" 
      });
    }
  });
}