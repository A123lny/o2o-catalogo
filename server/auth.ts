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
        const user = await storage.getUserByUsername(username);
        console.log(`User found: ${!!user}`);
        
        if (!user) {
          console.log('No user found with that username');
          return done(null, false);
        }
        
        const passwordMatches = await comparePasswords(password, user.password);
        console.log(`Password match: ${passwordMatches}`);
        
        if (!passwordMatches) {
          return done(null, false);
        } else {
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
        return res.status(401).send("Authentication failed");
      }
      
      try {
        // Controlla se 2FA è attivo globalmente dalle impostazioni di sicurezza
        const securitySettings = await storage.getSecuritySettings();
        const is2FAEnabled = securitySettings?.enable2FA || false;
        const is2FAActive = securitySettings?.twoFaActive || false;
        
        // Il 2FA è richiesto solo se è sia abilitato che attivo a livello globale
        const is2FARequired = is2FAEnabled && is2FAActive;
        
        if (is2FARequired) {
          // Controlla se l'utente ha già configurato il 2FA
          const twoFactorAuth = await storage.getUserTwoFactorAuth(user.id);
          
          if (twoFactorAuth) {
            if (twoFactorAuth.isVerified) {
              // Se 2FA è configurato e verificato, richiedi il codice 2FA
              return res.status(200).json({ 
                requiresTwoFactor: true,
                userId: user.id,
                username: user.username
              });
            } else {
              // Se 2FA è iniziato ma non è stato verificato, richiedi di completare la configurazione
              return res.status(200).json({ 
                requiresTwoFactorSetup: true,
                userId: user.id,
                username: user.username
              });
            }
          } else {
            // Se 2FA è richiesto ma l'utente non ha iniziato la configurazione, mostra la pagina di setup
            return res.status(200).json({ 
              requiresTwoFactorSetup: true,
              userId: user.id,
              username: user.username
            });
          }
        }
        
        // Se 2FA non è richiesto o disattivato globalmente, procedi con il login normalmente
        req.login(user, (loginErr) => {
          if (loginErr) {
            return next(loginErr);
          }
          
          return res.status(200).send(user);
        });
      } catch (error) {
        console.error("Error checking 2FA status:", error);
        return next(error);
      }
    })(req, res, next);
  });
  
  // Autenticazione con 2FA
  app.post("/api/login/2fa", async (req, res, next) => {
    const { userId, token, isBackupCode } = req.body;
    
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
          ipAddress: req.ip
        }).catch(console.error);
        
        return res.status(200).send(user);
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

  // Middleware to check if user is admin
  app.use("/api/admin/*", (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user && req.user.role !== "admin") return res.sendStatus(403);
    next();
  });
}
