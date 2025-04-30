import { Express, Request, Response } from 'express';
import { TwoFactorService } from '../two-factor-service';
import { z } from 'zod';
import { storage } from '../storage';

// Schema di validazione per la verifica del codice
const verifyTotpSchema = z.object({
  token: z.string().min(6).max(6)
});

// Schema di validazione quando l'utente fornisce un codice durante il login
const loginTotpSchema = z.object({
  username: z.string(),
  token: z.string().min(6).max(6)
});

export function registerTwoFactorRoutes(app: Express): void {
  // Middleware per verificare che l'utente sia autenticato
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Non autorizzato' });
    }
    next();
  };

  // Endpoint per generare un nuovo segreto TOTP e QR code
  app.post('/api/2fa/setup', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const setupData = await TwoFactorService.generateSecret(user);
      
      res.status(200).json(setupData);
    } catch (error) {
      console.error('Errore nella configurazione 2FA:', error);
      res.status(500).json({ message: 'Errore durante la configurazione 2FA' });
    }
  });

  // Endpoint per verificare il codice TOTP durante la configurazione
  app.post('/api/2fa/verify', requireAuth, async (req, res) => {
    try {
      const { token } = verifyTotpSchema.parse(req.body);
      const user = req.user!;
      
      const verified = await TwoFactorService.verifyTotpSetup(user.id, token);
      
      if (verified) {
        // Registra l'attività
        await storage.createActivityLog({
          userId: user.id,
          action: 'Abilitazione 2FA',
          entityType: 'user',
          entityId: user.id,
          details: { method: 'TOTP' },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
        
        // Aggiorna la sessione
        if (req.session) {
          req.session.twoFactorAuthenticated = true;
        }
        
        res.status(200).json({ 
          success: true,
          message: 'Autenticazione a due fattori configurata con successo'
        });
      } else {
        res.status(400).json({ 
          success: false,
          message: 'Codice di verifica non valido' 
        });
      }
    } catch (error) {
      console.error('Errore nella verifica 2FA:', error);
      res.status(400).json({ 
        success: false,
        message: 'Richiesta non valida' 
      });
    }
  });

  // Endpoint per disabilitare 2FA
  app.post('/api/2fa/disable', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      
      await TwoFactorService.disable2FA(user.id);
      
      // Registra l'attività
      await storage.createActivityLog({
        userId: user.id,
        action: 'Disabilitazione 2FA',
        entityType: 'user',
        entityId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      // Aggiorna la sessione
      if (req.session) {
        req.session.twoFactorAuthenticated = false;
      }
      
      res.status(200).json({ 
        success: true, 
        message: 'Autenticazione a due fattori disabilitata con successo' 
      });
    } catch (error) {
      console.error('Errore nella disabilitazione 2FA:', error);
      res.status(500).json({ 
        success: false,
        message: 'Errore durante la disabilitazione 2FA' 
      });
    }
  });

  // Endpoint per verificare il codice TOTP durante il login
  app.post('/api/2fa/login', async (req, res) => {
    try {
      const { username, token } = loginTotpSchema.parse(req.body);
      
      // Trova l'utente
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(400).json({ 
          success: false,
          message: 'Utente non trovato' 
        });
      }
      
      const verified = await TwoFactorService.verifyTotp(user.id, token);
      
      if (verified) {
        // Autenticazione riuscita, completa il login (passport.authenticate gestisce questo)
        if (req.session) {
          req.session.twoFactorAuthenticated = true;
        }

        // Completa il login tramite req.login (passport)
        req.login(user, (err) => {
          if (err) {
            return res.status(500).json({ 
              success: false,
              message: 'Errore durante il login' 
            });
          }
          
          // Registra l'attività di login con 2FA
          storage.createActivityLog({
            userId: user.id,
            action: 'Login con 2FA',
            entityType: 'user',
            entityId: user.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          }).catch(console.error);
          
          return res.status(200).json({
            success: true,
            user,
            message: 'Login completato con successo'
          });
        });
      } else {
        res.status(400).json({ 
          success: false,
          message: 'Codice di verifica non valido' 
        });
      }
    } catch (error) {
      console.error('Errore nel login 2FA:', error);
      res.status(400).json({ 
        success: false,
        message: 'Richiesta non valida' 
      });
    }
  });

  // Endpoint per verificare lo stato 2FA dell'utente
  app.get('/api/2fa/status', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      
      res.status(200).json({
        enabled: user.twoFactorEnabled,
        verified: user.twoFactorVerified
      });
    } catch (error) {
      console.error('Errore nel recupero dello stato 2FA:', error);
      res.status(500).json({ message: 'Errore durante il recupero dello stato 2FA' });
    }
  });
}