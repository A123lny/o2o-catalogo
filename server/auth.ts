import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { verifyToken, verifyBackupCode } from "./2fa-utils";
import {
  comparePasswords,
  hashPassword,
  handleFailedLoginAttempt,
  resetFailedLoginAttempts,
  isPasswordExpired,
  validatePasswordComplexity
} from "./security-utils";

import type * as SchemaTypes from '@shared/schema';

declare global {
  namespace Express {
    // Use type instead of interface extension to avoid errors
    interface User {
      id: number;
      username: string;
      password: string;
      email: string;
      fullName: string;
      role: string;
      createdAt: Date;
    }
  }
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET || "auto_prestige_secret_key";
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Authentication attempt for username: ${username}`);
        
        // Verifica se l'account è bloccato per tentativi falliti
        const lockoutResult = await handleFailedLoginAttempt(username);
        if (lockoutResult.lockedOut) {
          console.log(`Account locked for ${username}: ${lockoutResult.message}`);
          return done(null, false, { message: lockoutResult.message });
        }
        
        const user = await storage.getUserByUsername(username);
        console.log(`User found: ${!!user}`);
        
        if (!user) {
          console.log('No user found with that username');
          return done(null, false, { message: "Username o password non validi" });
        }
        
        const passwordMatches = await comparePasswords(password, user.password);
        console.log(`Password match: ${passwordMatches}`);
        
        if (!passwordMatches) {
          // Aggiorna i tentativi falliti
          await handleFailedLoginAttempt(username);
          return done(null, false, { message: "Username o password non validi" });
        } else {
          // Reset dei tentativi falliti dopo login con successo
          await resetFailedLoginAttempts(user.id);
          
          // Controlla se la password è scaduta
          const isExpired = await isPasswordExpired(user.id);
          if (isExpired) {
            // In caso di password scaduta, permetti comunque l'accesso ma imposta un flag
            user.passwordExpired = true;
          }
          
          return done(null, user);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", async (err, user, info) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        // Se l'autenticazione è fallita, restituisci il messaggio di errore
        const errorMessage = info?.message || "Autenticazione fallita";
        return res.status(401).json({ message: errorMessage });
      }
      
      try {
        // Controlla se 2FA è attivo globalmente dalle impostazioni di sicurezza
        const securitySettings = await storage.getSecuritySettings();
        const is2FAEnabled = securitySettings?.enable2FA || false;
        const is2FAActive = securitySettings?.twoFaActive || false;
        
        // Il 2FA è richiesto solo se è sia abilitato che attivo a livello globale
        const is2FARequired = is2FAEnabled && is2FAActive;
        
        // Controlla se la password è scaduta e se dobbiamo forzare il cambio
        // Nota: la verifica principale è già fatta in LocalStrategy, ma qui controlliamo
        // solo se dobbiamo forzare il cambio
        const passwordExpired = user.passwordExpired === true;
        
        if (is2FARequired) {
          // Controlla se l'utente ha già configurato il 2FA
          const twoFactorAuth = await storage.getUserTwoFactorAuth(user.id);
          
          if (twoFactorAuth) {
            if (twoFactorAuth.isVerified) {
              // Se 2FA è configurato e verificato, richiedi il codice 2FA
              return res.status(200).json({ 
                requiresTwoFactor: true,
                userId: user.id,
                username: user.username,
                passwordExpired // Aggiungi l'informazione sulla scadenza password
              });
            } else {
              // Se 2FA è iniziato ma non è stato verificato, richiedi di completare la configurazione
              return res.status(200).json({ 
                requiresTwoFactorSetup: true,
                userId: user.id,
                username: user.username,
                passwordExpired
              });
            }
          } else {
            // Se 2FA è richiesto ma l'utente non ha iniziato la configurazione, mostra la pagina di setup
            return res.status(200).json({ 
              requiresTwoFactorSetup: true,
              userId: user.id,
              username: user.username,
              passwordExpired
            });
          }
        }
        
        // Se 2FA non è richiesto o disattivato globalmente, procedi con il login normalmente
        req.login(user, (loginErr) => {
          if (loginErr) {
            return next(loginErr);
          }
          
          // Registra l'attività di login
          storage.createActivityLog({
            userId: user.id,
            action: "login",
            entityType: "auth",
            details: "Login effettuato con successo",
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          }).catch(console.error);
          
          // Se la password è scaduta, informiamo il client
          if (passwordExpired) {
            return res.status(200).json({
              ...user,
              passwordExpired: true
            });
          }
          
          return res.status(200).json(user);
        });
      } catch (error) {
        console.error("Error during login process:", error);
        return next(error);
      }
    })(req, res, next);
  });
  
  // Autenticazione con 2FA
  app.post("/api/login/2fa", async (req, res, next) => {
    const { userId, token, isBackupCode, passwordExpired } = req.body;
    
    if (!userId || (!token && !isBackupCode)) {
      return res.status(400).json({ message: "Parametri mancanti" });
    }
    
    try {
      // Verifica il token 2FA o il codice di backup
      let verified = false;
      
      if (isBackupCode) {
        verified = await verifyBackupCode(userId, token);
      } else {
        verified = await verifyToken(userId, token);
      }
      
      if (!verified) {
        return res.status(401).json({ message: "Codice di verifica non valido" });
      }
      
      // Trova l'utente nel database
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "Utente non trovato" });
      }
      
      // Verifica nuovamente la scadenza della password nel caso in cui il frontend non abbia passato l'informazione
      let isPasswordExpired = passwordExpired === true;
      if (!isPasswordExpired) {
        isPasswordExpired = await isPasswordExpired(user.id);
      }
      
      // Effettua il login
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        
        // Registra l'attività
        storage.createActivityLog({
          userId: user.id,
          action: "login",
          entityType: "auth",
          details: "Login con autenticazione a due fattori",
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }).catch(console.error);
        
        // Se la password è scaduta, informiamo il client
        if (isPasswordExpired) {
          return res.status(200).json({
            ...user,
            passwordExpired: true
          });
        }
        
        return res.status(200).json(user);
      });
    } catch (error) {
      console.error("Error during 2FA verification:", error);
      return next(error);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  
  // Endpoint per il cambio password
  app.post("/api/user/change-password", async (req, res, next) => {
    const { userId, currentPassword, newPassword } = req.body;
    
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ message: "Parametri mancanti" });
    }
    
    try {
      // Verifica che l'utente esista
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Utente non trovato" });
      }
      
      // Verifica che l'utente sia autorizzato a cambiare questa password
      // L'utente deve essere loggato come l'utente stesso o come amministratore
      if (!req.isAuthenticated() || (req.user.id !== userId && req.user.role !== 'admin')) {
        return res.status(403).json({ message: "Non autorizzato" });
      }
      
      // Verifica la password attuale
      const passwordCorrect = await comparePasswords(currentPassword, user.password);
      if (!passwordCorrect) {
        return res.status(400).json({ message: "Password attuale non corretta" });
      }
      
      // Valida la complessità della nuova password
      const { isValid, errors } = await validatePasswordComplexity(newPassword);
      if (!isValid) {
        return res.status(400).json({ 
          message: "La password non soddisfa i requisiti di complessità", 
          errors 
        });
      }
      
      // Verifica che la nuova password non sia stata già usata in precedenza
      const passwordReused = await isPasswordPreviouslyUsed(userId, newPassword);
      if (passwordReused) {
        return res.status(400).json({ message: "Non è possibile riutilizzare una password recente" });
      }
      
      // Genera hash della nuova password
      const newPasswordHash = await hashPassword(newPassword);
      
      // Aggiorna la password dell'utente nel database
      // Nota: questa funzione non esiste attualmente, quindi dobbiamo implementarla
      // o utilizzare un altro metodo per aggiornare la password
      // await storage.updateUserPassword(userId, newPasswordHash);
      
      // Ottieni le impostazioni di sicurezza per la cronologia password
      const securitySettings = await storage.getSecuritySettings();
      
      // Aggiungi la nuova password alla cronologia
      await storage.addPasswordToHistory(userId, newPasswordHash);
      
      // Pulisci la cronologia delle password se necessario
      if (securitySettings && securitySettings.passwordHistoryCount) {
        await storage.cleanupPasswordHistory(userId, securitySettings.passwordHistoryCount);
      }
      
      // Registra l'attività
      await storage.createActivityLog({
        userId,
        action: "password_change",
        entityType: "user",
        entityId: userId,
        details: "Password modificata con successo",
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      // Restituisci l'utente senza il flag di password scaduta
      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error changing password:", error);
      next(error);
    }
  });

  // Middleware to check if user is admin
  app.use("/api/admin/*", (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user && req.user.role !== "admin") return res.sendStatus(403);
    next();
  });
}
