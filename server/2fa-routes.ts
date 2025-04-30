import { Router, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { 
  generateSecret, 
  generateQRCode, 
  verifyToken, 
  generateBackupCodes 
} from "./simple-2fa";

/**
 * Middleware per verificare l'autenticazione
 */
function isAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Non autenticato" });
}

/**
 * Middleware per verificare i permessi amministrativi
 */
function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ error: "Accesso negato" });
}

/**
 * Configura tutte le rotte per il 2FA
 */
export function setup2FARoutes(router: Router) {
  
  /**
   * Inizia la configurazione del 2FA per l'utente corrente
   * POST /api/2fa/setup
   */
  router.post("/api/2fa/setup", isAuth, async (req, res) => {
    try {
      console.log("[2FA] Setup iniziato");
      const userId = req.user!.id;
      const username = req.user!.username;
      
      // Genera un nuovo segreto
      const secretObj = generateSecret(username);
      
      // Salva il segreto nel database
      const existingSecret = await storage.getUserTwoFactorSecret(userId);
      if (existingSecret) {
        await storage.updateUserTwoFactorSecret(userId, {
          secret: secretObj.base32,
          verified: false,
          backupCodes: JSON.stringify([])
        });
        console.log("[2FA] Aggiornato segreto esistente");
      } else {
        await storage.createUserTwoFactorSecret({
          userId,
          secret: secretObj.base32,
          verified: false,
          backupCodes: JSON.stringify([])
        });
        console.log("[2FA] Creato nuovo segreto");
      }
      
      // Aggiorna stato utente
      await storage.updateUser(userId, {
        twoFactorEnabled: true,
        twoFactorVerified: false
      });
      
      // Genera QR code
      const qrCode = await generateQRCode(secretObj.otpauth_url);
      if (!qrCode) {
        throw new Error("Errore nella generazione QR code");
      }
      
      // Ritorna il QR code al frontend
      res.json({ qrCodeUrl: qrCode });
      
    } catch (error) {
      console.error("[2FA] Errore setup:", error);
      res.status(500).json({ 
        error: "Impossibile configurare l'autenticazione a due fattori" 
      });
    }
  });
  
  /**
   * Verifica il token durante il setup
   * POST /api/2fa/verify-setup
   */
  router.post("/api/2fa/verify-setup", isAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "Token non fornito" });
      }
      
      // Recupera il segreto dell'utente
      const secretData = await storage.getUserTwoFactorSecret(userId);
      if (!secretData) {
        return res.status(400).json({ 
          error: "Devi prima iniziare la configurazione 2FA" 
        });
      }
      
      // Verifica il token
      const isValid = verifyToken(secretData.secret, token);
      if (!isValid) {
        return res.status(400).json({ error: "Token non valido" });
      }
      
      // Genera codici di backup
      const backupCodes = generateBackupCodes();
      
      // Aggiorna il segreto come verificato e salva i codici
      await storage.updateUserTwoFactorSecret(userId, {
        verified: true,
        backupCodes: JSON.stringify(backupCodes)
      });
      
      // Aggiorna lo stato dell'utente
      await storage.updateUser(userId, { twoFactorVerified: true });
      
      // Registra attività
      await storage.createActivityLog({
        userId,
        action: "verify",
        entityType: "two_factor",
        entityId: userId,
        details: "Completata configurazione 2FA",
        ipAddress: req.ip || "",
        userAgent: req.headers["user-agent"] || ""
      });
      
      // Ritorna i codici di backup
      res.json({ success: true, backupCodes });
      
    } catch (error) {
      console.error("[2FA] Errore verifica token:", error);
      res.status(500).json({ 
        error: "Errore durante la verifica del token" 
      });
    }
  });
  
  /**
   * Verifica il token durante il login
   * POST /api/2fa/verify
   */
  router.post("/api/2fa/verify", async (req, res) => {
    try {
      const { username, token } = req.body;
      
      if (!username || !token) {
        return res.status(400).json({ error: "Username e token sono richiesti" });
      }
      
      // Recupera l'utente
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(400).json({ error: "Utente non trovato" });
      }
      
      // Verifica se l'utente ha 2FA configurato
      if (!user.twoFactorEnabled || !user.twoFactorVerified) {
        return res.status(400).json({ 
          error: "2FA non configurato per questo utente" 
        });
      }
      
      // Recupera il segreto dell'utente
      const secretData = await storage.getUserTwoFactorSecret(user.id);
      if (!secretData) {
        return res.status(400).json({ error: "Configurazione 2FA non trovata" });
      }
      
      // Verifica il token
      const isValidToken = verifyToken(secretData.secret, token);
      
      // Variabili per backup code
      let isBackupCode = false;
      let remainingBackupCodes: string[] = [];
      
      // Se il token non è valido, controlla se è un codice di backup
      if (!isValidToken && secretData.backupCodes) {
        // Parse JSON dei codici di backup (stringa o array)
        const backupCodes = typeof secretData.backupCodes === 'string' 
          ? JSON.parse(secretData.backupCodes) 
          : (Array.isArray(secretData.backupCodes) ? secretData.backupCodes : []);
        
        // Verifica se il token è tra i codici di backup
        isBackupCode = backupCodes.includes(token);
        
        if (isBackupCode) {
          // Rimuovi il codice di backup usato
          remainingBackupCodes = backupCodes.filter((code: string) => code !== token);
          
          // Aggiorna i codici di backup
          await storage.updateUserTwoFactorSecret(user.id, {
            backupCodes: JSON.stringify(remainingBackupCodes)
          });
          
          // Registra attività
          await storage.createActivityLog({
            userId: user.id,
            action: "login",
            entityType: "two_factor",
            entityId: user.id,
            details: "Login con codice di backup",
            ipAddress: req.ip || "",
            userAgent: req.headers["user-agent"] || ""
          });
        }
      }
      
      // Se né il token né il codice di backup sono validi
      if (!isValidToken && !isBackupCode) {
        return res.status(400).json({ error: "Codice non valido" });
      }
      
      // Successo!
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
      console.error("[2FA] Errore verifica durante login:", error);
      res.status(500).json({ 
        error: "Errore durante la verifica 2FA" 
      });
    }
  });
  
  /**
   * Disabilita 2FA per l'utente corrente
   * POST /api/2fa/disable
   */
  router.post("/api/2fa/disable", isAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Elimina segreto
      await storage.deleteUserTwoFactorSecret(userId);
      
      // Aggiorna stato utente
      await storage.updateUser(userId, {
        twoFactorEnabled: false,
        twoFactorVerified: false
      });
      
      // Registra attività
      await storage.createActivityLog({
        userId,
        action: "disable",
        entityType: "two_factor",
        entityId: userId,
        details: "Disabilitazione 2FA",
        ipAddress: req.ip || "",
        userAgent: req.headers["user-agent"] || ""
      });
      
      res.json({ success: true });
      
    } catch (error) {
      console.error("[2FA] Errore disabilitazione:", error);
      res.status(500).json({ 
        error: "Errore durante la disabilitazione 2FA" 
      });
    }
  });
  
  /**
   * Rigenera codici di backup
   * POST /api/2fa/regenerate-backup
   */
  router.post("/api/2fa/regenerate-backup", isAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Verifica 2FA attivo
      const secret = await storage.getUserTwoFactorSecret(userId);
      if (!secret || !secret.verified) {
        return res.status(400).json({ 
          error: "2FA non completamente configurato" 
        });
      }
      
      // Genera nuovi codici
      const backupCodes = generateBackupCodes();
      
      // Salva i nuovi codici
      await storage.updateUserTwoFactorSecret(userId, {
        backupCodes: JSON.stringify(backupCodes)
      });
      
      // Registra attività
      await storage.createActivityLog({
        userId,
        action: "update",
        entityType: "two_factor",
        entityId: userId,
        details: "Rigenerazione codici backup",
        ipAddress: req.ip || "",
        userAgent: req.headers["user-agent"] || ""
      });
      
      res.json({ success: true, backupCodes });
      
    } catch (error) {
      console.error("[2FA] Errore rigenerazione backup:", error);
      res.status(500).json({ 
        error: "Errore durante la rigenerazione dei codici di backup" 
      });
    }
  });
  
  /**
   * Ottieni statistiche 2FA (admin)
   * GET /api/admin/2fa/stats
   */
  router.get("/api/admin/2fa/stats", isAdmin, async (req, res) => {
    try {
      // Recupera impostazioni di sicurezza
      const securitySettings = await storage.getSecuritySettings();
      
      // Recupera tutti gli utenti
      const users = await storage.getUsers();
      
      // Calcola statistiche
      const totalUsers = users.length;
      const enabledCount = users.filter(u => u.twoFactorEnabled && u.twoFactorVerified).length;
      const percentageEnabled = totalUsers > 0 ? Math.round((enabledCount / totalUsers) * 100) : 0;
      
      res.json({
        globalEnabled: securitySettings?.enable2FA || false,
        required: securitySettings?.require2FA || false,
        totalUsers,
        enabledCount,
        percentageEnabled
      });
      
    } catch (error) {
      console.error("[2FA Admin] Errore statistiche:", error);
      res.status(500).json({ 
        error: "Errore durante il recupero delle statistiche 2FA" 
      });
    }
  });
  
  /**
   * Reset 2FA per un utente specifico (admin)
   * POST /api/admin/2fa/reset/:userId
   */
  router.post("/api/admin/2fa/reset/:userId", isAdmin, async (req, res) => {
    try {
      const adminId = req.user!.id;
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "ID utente non valido" });
      }
      
      // Verifica utente
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Utente non trovato" });
      }
      
      // Elimina segreto
      await storage.deleteUserTwoFactorSecret(userId);
      
      // Aggiorna stato utente
      await storage.updateUser(userId, {
        twoFactorEnabled: false,
        twoFactorVerified: false
      });
      
      // Registra attività
      await storage.createActivityLog({
        userId: adminId,
        action: "reset",
        entityType: "two_factor",
        entityId: userId,
        details: `Reset 2FA per utente ${user.username}`,
        ipAddress: req.ip || "",
        userAgent: req.headers["user-agent"] || ""
      });
      
      res.json({ 
        success: true, 
        message: `2FA reimpostato per l'utente ${user.username}`
      });
      
    } catch (error) {
      console.error("[2FA Admin] Errore reset:", error);
      res.status(500).json({ 
        error: "Errore durante il reset del 2FA" 
      });
    }
  });
  
  /**
   * Reset 2FA per tutti gli utenti (admin)
   * POST /api/admin/2fa/reset-all
   */
  router.post("/api/admin/2fa/reset-all", isAdmin, async (req, res) => {
    try {
      const adminId = req.user!.id;
      
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
      
      // Registra attività
      await storage.createActivityLog({
        userId: adminId,
        action: "reset",
        entityType: "two_factor",
        entityId: 0,
        details: "Reset globale 2FA",
        ipAddress: req.ip || "",
        userAgent: req.headers["user-agent"] || ""
      });
      
      res.json({
        success: true,
        message: "2FA reimpostato per tutti gli utenti"
      });
      
    } catch (error) {
      console.error("[2FA Admin] Errore reset globale:", error);
      res.status(500).json({ 
        error: "Errore durante il reset globale del 2FA" 
      });
    }
  });
}