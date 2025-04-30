import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";

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
      passwordExpired?: boolean; // Flag per indicare se la password è scaduta
      twoFactorEnabled?: boolean; // Flag per indicare se l'utente ha abilitato il 2FA
      twoFactorVerified?: boolean; // Flag per indicare se l'utente ha completato la configurazione 2FA
    }
  }
  
  // Estende l'interfaccia di session per twoFactorUserId
  namespace Express.Session {
    interface SessionData {
      twoFactorUserId?: number;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
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

  app.post("/api/login", async (req, res, next) => {
    passport.authenticate("local", async (err: Error, user: User, info: any) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ success: false, message: "Credenziali non valide" });
      }
      
      try {
        // Verifica se la password è scaduta in base alle impostazioni
        const securitySettings = await storage.getSecuritySettings();
        
        if (securitySettings && securitySettings.passwordExpiryDays && securitySettings.passwordExpiryDays > 0) {
          // Verifica se è disponibile l'ultima modifica della password
          const latestPasswordHistory = await storage.getLatestPasswordHistory(user.id);
          
          if (latestPasswordHistory) {
            const passwordChangedDate = new Date(latestPasswordHistory.createdAt);
            const today = new Date();
            
            // Calcola i giorni trascorsi dall'ultimo cambio password
            const daysSinceChange = Math.floor(
              (today.getTime() - passwordChangedDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            // Se sono passati più giorni del limite, imposta un flag di password scaduta
            if (daysSinceChange >= securitySettings.passwordExpiryDays) {
              user.passwordExpired = true;
            }
          } else {
            // Se non c'è storico, considera la data di creazione dell'utente
            const userCreatedDate = new Date(user.createdAt);
            const today = new Date();
            
            const daysSinceCreation = Math.floor(
              (today.getTime() - userCreatedDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            if (daysSinceCreation >= securitySettings.passwordExpiryDays) {
              user.passwordExpired = true;
            }
          }
        }
        
        // Verifica se l'autenticazione a due fattori è richiesta
        if (user.twoFactorEnabled && user.twoFactorVerified) {
          console.log(`2FA richiesto per l'utente ${user.username}`);
          
          // Salviamo l'ID utente nella sessione per il processo 2FA
          req.session.twoFactorUserId = user.id;
          
          // Non effettuiamo il login completo, ma indichiamo che è necessario il 2FA
          return res.json({
            success: true,
            requireTwoFactor: true,
            message: "Inserisci il codice di autenticazione a due fattori"
          });
        }
        
        // Verifica se il 2FA è obbligatorio in base alle impostazioni di sicurezza
        // ma l'utente non lo ha ancora configurato
        if (securitySettings?.require2FA && !user.twoFactorEnabled) {
          // Effettuiamo il login ma indichiamo che è necessario configurare il 2FA
          req.login(user, (loginErr) => {
            if (loginErr) {
              return next(loginErr);
            }
            
            return res.status(200).json({
              success: true,
              user,
              setupTwoFactor: true,
              message: "È necessario configurare l'autenticazione a due fattori"
            });
          });
          return;
        }
        
        // Login normale se non è richiesto il 2FA
        req.login(user, (loginErr) => {
          if (loginErr) {
            return next(loginErr);
          }
          
          // Registra il login nel log delle attività
          storage.createActivityLog({
            userId: user.id,
            action: "USER_LOGIN",
            entityType: "user",
            entityId: user.id,
            details: JSON.stringify({
              message: "Login effettuato con successo"
            }),
            ipAddress: req.ip || "",
            userAgent: req.headers["user-agent"] || ""
          }).catch(e => console.error("Errore registrazione log:", e));
          
          return res.status(200).json({
            success: true,
            user
          });
        });
      } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ 
          success: false, 
          message: "Errore durante il login" 
        });
      }
    })(req, res, next);
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
