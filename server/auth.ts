import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as GitHubStrategy } from "passport-github2";
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
  validatePasswordComplexity,
  isPasswordPreviouslyUsed
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
      profileId?: string;     // ID del profilo sui social (es. Google ID, Facebook ID)
      provider?: string;      // Provider di autenticazione (es. google, facebook, github)
    }
  }
}

export async function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET || "auto_prestige_secret_key";
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  
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
          // Nasconde se l'utente esiste o meno per motivi di sicurezza
          return done(null, false, { message: "Username o password non validi" });
        }
        
        // Verifica se l'account è bloccato per tentativi falliti
        const securitySettings = await storage.getSecuritySettings();
        const lockoutRecord = await storage.getAccountLockout(user.id);
        
        if (lockoutRecord && lockoutRecord.lockedUntil) {
          const now = new Date();
          const lockoutUntil = new Date(lockoutRecord.lockedUntil);
          
          if (now < lockoutUntil) {
            // Se l'account è ancora bloccato
            const remainingMinutes = Math.ceil((lockoutUntil.getTime() - now.getTime()) / (60 * 1000));
            console.log(`Account locked for ${username} for ${remainingMinutes} more minutes`);
            return done(null, false, { 
              message: `Account bloccato per troppi tentativi di accesso falliti. Riprova tra ${remainingMinutes} minuti.` 
            });
          }
        }
        
        const passwordMatches = await comparePasswords(password, user.password);
        console.log(`Password match: ${passwordMatches}`);
        
        if (!passwordMatches) {
          // Aggiorna i tentativi falliti
          const newFailedAttempts = (lockoutRecord?.failedAttempts || 0) + 1;
          console.log(`Failed login attempt recorded. Attempts: ${newFailedAttempts}`);
          
          // Se il numero di tentativi falliti raggiunge il limite, blocca l'account
          if (securitySettings && securitySettings.failedLoginAttempts && 
              newFailedAttempts >= securitySettings.failedLoginAttempts) {
            // Blocca l'account
            const now = new Date();
            const lockedUntil = new Date(now);
            lockedUntil.setMinutes(now.getMinutes() + (securitySettings.lockoutDurationMinutes || 30));
            
            await storage.createOrUpdateAccountLockout(user.id, {
              failedAttempts: newFailedAttempts,
              lastFailedAttempt: now,
              lockedUntil: lockedUntil
            });
            
            return done(null, false, { 
              message: `Account bloccato per troppi tentativi di accesso falliti. Riprova tra ${securitySettings.lockoutDurationMinutes || 30} minuti.` 
            });
          } else {
            // Incrementa solo il contatore di tentativi falliti
            await storage.createOrUpdateAccountLockout(user.id, {
              failedAttempts: newFailedAttempts,
              lastFailedAttempt: new Date(),
              lockedUntil: null
            });
            
            const remainingAttempts = securitySettings && securitySettings.failedLoginAttempts 
              ? securitySettings.failedLoginAttempts - newFailedAttempts 
              : undefined;
            
            let errorMessage = "Username o password non validi";
            if (remainingAttempts !== undefined) {
              errorMessage += `. Tentativi rimanenti: ${remainingAttempts}`;
            }
            
            return done(null, false, { message: errorMessage });
          }
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
  
  // Funzione per resettare i tentativi falliti di login
  async function resetFailedLoginAttempts(userId: number) {
    try {
      await storage.createOrUpdateAccountLockout(userId, {
        failedAttempts: 0,
        lastFailedAttempt: new Date(),
        lockedUntil: null
      });
    } catch (error) {
      console.error('Errore nel reset dei tentativi falliti:', error);
    }
  }
  
  // Funzione per verificare se la password è scaduta
  async function isPasswordExpired(userId: number): Promise<boolean> {
    try {
      // Ottieni l'ultimo cambio password
      const lastPasswordChange = await storage.getLastPasswordChange(userId);
      if (!lastPasswordChange) return false;
      
      // Ottieni le impostazioni di sicurezza
      const securitySettings = await storage.getSecuritySettings();
      if (!securitySettings || !securitySettings.passwordExpiryDays) return false;
      
      const now = new Date();
      const lastChange = new Date(lastPasswordChange.changedAt);
      
      // Calcola la differenza in giorni
      const diffTime = Math.abs(now.getTime() - lastChange.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays >= securitySettings.passwordExpiryDays;
    } catch (error) {
      console.error('Errore nel controllo della scadenza password:', error);
      return false;
    }
  }
  
  // Configurazione delle strategie OAuth per i social login
  
  // Configurazione Google OAuth
  try {
    const googleConfig = await storage.getSocialLoginConfig('google');
    if (googleConfig && googleConfig.enabled && googleConfig.clientId && googleConfig.clientSecret) {
      passport.use(new GoogleStrategy({
        clientID: googleConfig.clientId,
        clientSecret: googleConfig.clientSecret,
        callbackURL: `${baseUrl}/auth/google/callback`,
        scope: ['profile', 'email']
      }, (accessToken, refreshToken, profile, done) => {
        // Ottieni dati dall'oggetto del profilo Google
        const profileId = profile.id;
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : '';
        const displayName = profile.displayName || '';
        
        // Usa la funzione helper per gestire l'autenticazione
        handleSocialAuth('google', profileId, email, displayName, done);
      }));
      
      // Definisci le rotte per l'autenticazione Google
      app.get('/auth/google', passport.authenticate('google', {
        scope: ['profile', 'email']
      }));
      
      app.get('/auth/google/callback', passport.authenticate('google', {
        failureRedirect: '/auth'
      }), (req, res) => {
        res.redirect('/');
      });
    }
  } catch (error) {
    console.error("Errore durante la configurazione di Google OAuth:", error);
  }
  
  // Configurazione Facebook OAuth
  try {
    const facebookConfig = await storage.getSocialLoginConfig('facebook');
    if (facebookConfig && facebookConfig.enabled && facebookConfig.clientId && facebookConfig.clientSecret) {
      passport.use(new FacebookStrategy({
        clientID: facebookConfig.clientId,
        clientSecret: facebookConfig.clientSecret,
        callbackURL: `${baseUrl}/auth/facebook/callback`,
        profileFields: ['id', 'emails', 'name', 'displayName']
      }, (accessToken, refreshToken, profile, done) => {
        // Ottieni dati dall'oggetto del profilo Facebook
        const profileId = profile.id;
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : '';
        const displayName = profile.displayName || '';
        
        // Usa la funzione helper per gestire l'autenticazione
        handleSocialAuth('facebook', profileId, email, displayName, done);
      }));
      
      // Definisci le rotte per l'autenticazione Facebook
      app.get('/auth/facebook', passport.authenticate('facebook', {
        scope: ['email']
      }));
      
      app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        failureRedirect: '/auth'
      }), (req, res) => {
        res.redirect('/');
      });
    }
  } catch (error) {
    console.error("Errore durante la configurazione di Facebook OAuth:", error);
  }
  
  // Configurazione GitHub OAuth
  try {
    const githubConfig = await storage.getSocialLoginConfig('github');
    if (githubConfig && githubConfig.enabled && githubConfig.clientId && githubConfig.clientSecret) {
      passport.use(new GitHubStrategy({
        clientID: githubConfig.clientId,
        clientSecret: githubConfig.clientSecret,
        callbackURL: `${baseUrl}/auth/github/callback`,
        scope: ['user:email']
      }, (accessToken, refreshToken, profile, done) => {
        // Ottieni dati dall'oggetto del profilo GitHub
        const profileId = profile.id;
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : '';
        const displayName = profile.displayName || profile.username || '';
        
        // Usa la funzione helper per gestire l'autenticazione
        handleSocialAuth('github', profileId, email, displayName, done);
      }));
      
      // Definisci le rotte per l'autenticazione GitHub
      app.get('/auth/github', passport.authenticate('github', {
        scope: ['user:email']
      }));
      
      app.get('/auth/github/callback', passport.authenticate('github', {
        failureRedirect: '/auth'
      }), (req, res) => {
        res.redirect('/');
      });
    }
  } catch (error) {
    console.error("Errore durante la configurazione di GitHub OAuth:", error);
  }
  
  // Funzione helper per gestire il processo di login/registrazione da OAuth
  async function handleSocialAuth(
    provider: string,
    profileId: string,
    email: string,
    displayName: string,
    done: any
  ) {
    try {
      // Prima, cerca un utente con questo profileId e provider
      let user = await storage.getUserByProfileId(profileId, provider);
      
      // Se non esiste, cerca per email se disponibile
      if (!user && email) {
        user = await storage.getUserByEmail(email);
      }
      
      // Se l'utente esiste già
      if (user) {
        // Se l'utente esiste ma non ha profileId/provider, aggiorniamo il suo profilo
        if (!user.profileId || !user.provider) {
          user = await storage.updateUserSocialProfile(user.id, {
            profileId,
            provider
          });
        }
        return done(null, user);
      }
      
      // Se l'utente non esiste, lo creiamo
      // Generiamo un username unico basato sul nome visualizzato o email
      let username = displayName ? displayName.replace(/\s+/g, '_').toLowerCase() : '';
      if (!username && email) {
        username = email.split('@')[0];
      }
      
      // Aggiungiamo un numero casuale per evitare duplicati
      username = `${username}_${Date.now().toString().slice(-4)}`;
      
      // Generiamo una password casuale sicura (l'utente non la userà direttamente)
      const randomPassword = Math.random().toString(36).slice(-10) + 
                            Math.random().toString(36).toUpperCase().slice(-2) + 
                            '!2@';
      
      // Creiamo il nuovo utente
      const newUser = await storage.createUser({
        username,
        email: email || '',
        password: await hashPassword(randomPassword),
        fullName: displayName || username,
        role: 'user',
        profileId,
        provider
      });
      
      // Registra l'attività
      await storage.createActivityLog({
        userId: newUser.id,
        action: 'register',
        entityType: 'auth',
        details: `Registrazione tramite ${provider}`,
        ipAddress: '',
        userAgent: ''
      });
      
      return done(null, newUser);
    } catch (error) {
      console.error(`Error in ${provider} authentication:`, error);
      return done(error);
    }
  }

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
      let passwordIsExpired = passwordExpired === true;
      if (!passwordIsExpired) {
        passwordIsExpired = await isPasswordExpired(user.id);
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
        if (passwordIsExpired) {
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
      const updatedUser = await storage.updateUserPassword(userId, newPasswordHash);
      if (!updatedUser) {
        return res.status(500).json({ message: "Errore nell'aggiornamento della password" });
      }
      
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
