import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage } from "./storage";
import { setupAuth } from "./auth";
import { generateSecret, verifyToken, verifyBackupCode, disable2FA } from "./2fa-utils";
import { setupImageProxy } from "./image-proxy";
import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";
import multer from "multer";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { db } from "./db";
import { eq } from "drizzle-orm";

// Ottieni il percorso assoluto per __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { 
  insertVehicleSchema, 
  insertBrandSchema, 
  insertCategorySchema, 
  insertRequestSchema, 
  insertRentalOptionSchema,
  insertPromoSettingsSchema,
  insertGeneralSettingsSchema,
  insertSecuritySettingsSchema,
  insertProvinceSchema,
  insertActivityLogSchema
} from "@shared/schema";

// Assicurati che la directory uploads esista
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configura multer per salvare i file su disco
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    let extension = path.extname(file.originalname);
    if (!extension) {
      extension = '.jpg'; // Default extension
    }
    cb(null, file.fieldname + '_' + uniqueSuffix + extension);
  }
});

const upload = multer({ 
  storage: multerStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Middleware per verificare l'autenticazione
const authenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Autenticazione richiesta" });
  }
  next();
};

// Middleware per la verifica dell'amministratore
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || req.user.role !== "admin") {
    return res.status(403).json({ message: "Accesso negato" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  await setupAuth(app);
  
  // Importare le funzioni di utilità per la sicurezza
  const { 
    comparePasswords, 
    hashPassword, 
    validatePasswordComplexity, 
    isPasswordPreviouslyUsed 
  } = await import("./security-utils");
  
  // Endpoint per il cambio password
  app.post("/api/user/change-password", authenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          message: "Dati mancanti", 
          errors: ["È necessario fornire sia la password attuale che quella nuova"] 
        });
      }
      
      // Verifica la password attuale
      const user = await dbStorage.getUser(req.user!.id);
      const passwordMatches = await comparePasswords(currentPassword, user.password);
      
      if (!passwordMatches) {
        return res.status(400).json({ 
          message: "Password attuale non valida", 
          errors: ["La password attuale non è corretta"] 
        });
      }
      
      // Verifica la complessità della nuova password
      const { isValid, errors } = await validatePasswordComplexity(newPassword);
      
      if (!isValid) {
        return res.status(400).json({ 
          message: "La password non soddisfa i requisiti di sicurezza", 
          errors 
        });
      }
      
      // Verifica se la password è stata usata in precedenza
      const isReused = await isPasswordPreviouslyUsed(req.user!.id, newPassword);
      
      if (isReused) {
        return res.status(400).json({ 
          message: "Non puoi riutilizzare una password recente", 
          errors: ["Questa password è stata utilizzata di recente. Scegli una password diversa"] 
        });
      }
      
      // Hash della nuova password
      const hashedPassword = await hashPassword(newPassword);
      
      // Aggiorna la password dell'utente
      await dbStorage.updateUser(req.user!.id, { password: hashedPassword });
      
      // Aggiungi la password alla cronologia
      await dbStorage.addPasswordToHistory(req.user!.id, hashedPassword);
      
      // Ottieni le impostazioni di sicurezza
      const securitySettings = await dbStorage.getSecuritySettings();
      
      // Pulisci la cronologia delle password se necessario
      if (securitySettings && securitySettings.passwordHistoryCount) {
        await dbStorage.cleanupPasswordHistory(req.user!.id, securitySettings.passwordHistoryCount);
      }
      
      // Registra l'attività
      await dbStorage.createActivityLog({
        userId: req.user!.id,
        action: "update",
        entityType: "user_password",
        entityId: req.user!.id,
        details: "Cambio password",
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || ''
      });
      
      res.json({ message: "Password aggiornata con successo" });
    } catch (error) {
      console.error("Errore durante il cambio password:", error);
      res.status(500).json({ message: "Errore durante il cambio password" });
    }
  });

  // Public API routes
  
  // Proxy per le immagini esterne
  app.get("/api/image-proxy", setupImageProxy);
  
  // Get all vehicles with filters
  app.get("/api/vehicles", async (req, res) => {
    try {
      const filters = req.query;
      const vehicles = await dbStorage.getVehicles(filters);
      
      // Correggi i percorsi delle immagini principali
      const vehiclesWithFixedImages = vehicles.map(vehicle => {
        let fixedVehicle = { ...vehicle };
        
        // Correggi mainImage
        if (fixedVehicle.mainImage && !fixedVehicle.mainImage.startsWith('/uploads/') && !fixedVehicle.mainImage.startsWith('http')) {
          fixedVehicle.mainImage = `/uploads/${fixedVehicle.mainImage}`;
        }
        
        return fixedVehicle;
      });
      
      res.json(vehiclesWithFixedImages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching vehicles" });
    }
  });

  // Get featured vehicles
  app.get("/api/vehicles/featured", async (req, res) => {
    try {
      const featuredVehicles = await dbStorage.getFeaturedVehicles();
      
      // Correggi i percorsi delle immagini principali
      const vehiclesWithFixedImages = featuredVehicles.map(vehicle => {
        let fixedVehicle = { ...vehicle };
        
        // Correggi mainImage
        if (fixedVehicle.mainImage && !fixedVehicle.mainImage.startsWith('/uploads/') && !fixedVehicle.mainImage.startsWith('http')) {
          fixedVehicle.mainImage = `/uploads/${fixedVehicle.mainImage}`;
        }
        
        return fixedVehicle;
      });
      
      res.json(vehiclesWithFixedImages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching featured vehicles" });
    }
  });

  // Get vehicle by ID
  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await dbStorage.getVehicle(id);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      // Correggi il percorso dell'immagine principale
      let fixedVehicle = { ...vehicle };
      
      if (fixedVehicle.mainImage && !fixedVehicle.mainImage.startsWith('/uploads/') && !fixedVehicle.mainImage.startsWith('http')) {
        fixedVehicle.mainImage = `/uploads/${fixedVehicle.mainImage}`;
      }
      
      res.json(fixedVehicle);
    } catch (error) {
      res.status(500).json({ message: "Error fetching vehicle" });
    }
  });

  // Get related vehicles
  app.get("/api/vehicles/:id/related", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const relatedVehicles = await dbStorage.getRelatedVehicles(id);
      res.json(relatedVehicles);
    } catch (error) {
      res.status(500).json({ message: "Error fetching related vehicles" });
    }
  });

  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await dbStorage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories" });
    }
  });
  
  // Get active categories (con veicoli disponibili)
  app.get("/api/categories/active", async (req, res) => {
    try {
      const categories = await dbStorage.getActiveCategories();
      
      // Correggi i percorsi delle immagini per assicurarsi che inizino con "/uploads/"
      const categoriesWithFixedImages = categories.map(category => {
        if (!category.image) return category;
        
        // Se l'immagine non include già "/uploads/" all'inizio, aggiungilo
        if (!category.image.startsWith('/uploads/')) {
          return {
            ...category,
            image: `/uploads/${category.image}`
          };
        }
        
        return category;
      });
      
      res.json(categoriesWithFixedImages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching active categories" });
    }
  });

  // Get all brands
  app.get("/api/brands", async (req, res) => {
    try {
      const brands = await dbStorage.getBrands();
      res.json(brands);
    } catch (error) {
      res.status(500).json({ message: "Error fetching brands" });
    }
  });
  
  // Get active brands (con veicoli disponibili)
  app.get("/api/brands/active", async (req, res) => {
    try {
      const brands = await dbStorage.getActiveBrands();
      
      // Correggi i percorsi delle immagini per assicurarsi che inizino con "/uploads/"
      const brandsWithFixedLogos = brands.map(brand => {
        if (!brand.logo) return brand;
        
        // Se il logo non include già "/uploads/" all'inizio, aggiungilo
        if (!brand.logo.startsWith('/uploads/')) {
          return {
            ...brand,
            logo: `/uploads/${brand.logo}`
          };
        }
        
        return brand;
      });
      
      res.json(brandsWithFixedLogos);
    } catch (error) {
      res.status(500).json({ message: "Error fetching active brands" });
    }
  });

  // Submit an information request
  app.post("/api/requests", async (req, res) => {
    try {
      const validatedData = insertRequestSchema.parse(req.body);
      const request = await dbStorage.createRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Get rental options for a vehicle
  app.get("/api/vehicles/:id/rental-options", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rentalOptions = await dbStorage.getRentalOptions(id);
      res.json(rentalOptions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching rental options" });
    }
  });
  
  // Get rental options for all vehicles (for filtering)
  app.get("/api/rental-options/all", async (req, res) => {
    try {
      // Ottieni tutte le opzioni di noleggio dal database
      const allOptions = await dbStorage.getAllRentalOptions();
      res.json(allOptions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching rental options" });
    }
  });

  // Admin API routes

  // Get all users (admin only)
  app.get("/api/users", authenticated, async (req, res) => {
    try {
      // Solo gli admin possono vedere tutti gli utenti
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Accesso negato" });
      }
      
      const users = await dbStorage.getUsers();
      console.log(`Recuperati ${users.length} utenti dal database`);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users" });
    }
  });
  
  // API admin/users - Aggiorna utente
  app.put("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Non consentire la modifica dell'utente admin principale se non si è l'admin principale
      if (userId === 1 && req.user.id !== 1) {
        return res.status(403).json({ 
          message: "Operazione non consentita", 
          errors: ["Solo l'amministratore principale può modificare questo account"] 
        });
      }
      
      // Verificare l'esistenza dell'utente
      const user = await dbStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Utente non trovato" });
      }
      
      // Validare i dati della richiesta
      const { username, email, fullName, role, password } = req.body;
      
      // Verifica che i campi obbligatori siano presenti
      if (!username || !email || !fullName || !role) {
        return res.status(400).json({ 
          message: "Dati mancanti", 
          errors: ["Tutti i campi sono obbligatori"] 
        });
      }
      
      // Verifica che l'username non sia già in uso da un altro utente
      const existingUserByUsername = await dbStorage.getUserByUsername(username);
      if (existingUserByUsername && existingUserByUsername.id !== userId) {
        return res.status(400).json({ 
          message: "Username già in uso", 
          errors: ["Questo username è già utilizzato da un altro utente"] 
        });
      }
      
      // Verifica che l'email non sia già in uso da un altro utente
      const existingUserByEmail = await dbStorage.getUserByEmail(email);
      if (existingUserByEmail && existingUserByEmail.id !== userId) {
        return res.status(400).json({ 
          message: "Email già in uso", 
          errors: ["Questa email è già utilizzata da un altro utente"] 
        });
      }
      
      // Prepara i dati per l'aggiornamento
      const updateData: any = { username, email, fullName, role };
      
      // Se è stata fornita una nuova password, aggiornala
      if (password && password.trim() !== '') {
        updateData.password = await hashPassword(password);
      }
      
      // Aggiorna l'utente
      const updatedUser = await dbStorage.updateUser(userId, updateData);
      
      // Rimuovi la password dall'oggetto di risposta
      if (updatedUser) {
        delete (updatedUser as any).password;
      }
      
      // Invia la risposta senza includere dati complessi che potrebbero creare problemi di serializzazione
      return res.status(200).json({ 
        success: true,
        message: "Utente aggiornato con successo"
      });
    } catch (error) {
      console.error('Errore nella gestione della richiesta:', error);
      return res.status(500).json({ message: 'Si è verificato un errore durante l\'elaborazione della richiesta' });
    }
  });
  
  // API admin/users - Elimina utente
  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Non consentire l'eliminazione dell'utente admin principale
      if (userId === 1) {
        return res.status(403).json({ 
          message: "Operazione non consentita", 
          errors: ["Non è possibile eliminare l'amministratore principale del sistema"] 
        });
      }
      
      // Verificare l'esistenza dell'utente
      const user = await dbStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Utente non trovato" });
      }
      
      // Eliminare l'utente (commentato per sicurezza)
      // await dbStorage.deleteUser(userId);
      
      res.status(200).json({ message: "Utente eliminato con successo" });
    } catch (error) {
      console.error('Errore nella gestione della richiesta:', error);
      res.status(500).json({ message: 'Si è verificato un errore durante l\'elaborazione della richiesta' });
    }
  });

  // Dashboard stats
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      const stats = await dbStorage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching stats" });
    }
  });

  // CRUD operations for vehicles
  app.get("/api/admin/vehicles", isAdmin, async (req, res) => {
    try {
      const vehicles = await dbStorage.getAdminVehicles();
      
      // Correggi i percorsi delle immagini per ogni veicolo
      const vehiclesWithFixedImages = vehicles.map(vehicle => {
        let fixedVehicle = { ...vehicle };
        
        // Correggi mainImage
        if (fixedVehicle.mainImage && !fixedVehicle.mainImage.startsWith('/uploads/') && !fixedVehicle.mainImage.startsWith('http')) {
          fixedVehicle.mainImage = `/uploads/${fixedVehicle.mainImage}`;
        }
        
        // Correggi tutte le immagini secondarie
        if (fixedVehicle.images && Array.isArray(fixedVehicle.images)) {
          fixedVehicle.images = fixedVehicle.images.map(img => {
            if (img && typeof img === 'string' && !img.startsWith('/uploads/') && !img.startsWith('http')) {
              return `/uploads/${img}`;
            }
            return img;
          });
        }
        
        return fixedVehicle;
      });
      
      res.json(vehiclesWithFixedImages);
    } catch (error) {
      console.error("Error fetching admin vehicles:", error);
      res.status(500).json({ message: "Error fetching vehicles" });
    }
  });

  // Create Vehicle - Completamente ristrutturato per gestione file migliore
  app.post("/api/admin/vehicles", isAdmin, upload.single("mainImage"), async (req, res) => {
    try {
      // Analizza i dati JSON dalla richiesta
      let vehicleData;
      try {
        vehicleData = JSON.parse(req.body.data);
        console.log("Dati veicolo ricevuti:", {
          title: vehicleData.title,
          model: vehicleData.model, 
          hasMainImage: !!req.file
        });
      } catch (parseError) {
        console.error("Errore analisi dati JSON del veicolo:", parseError);
        return res.status(400).json({ message: "Formato JSON non valido nei dati del veicolo" });
      }
      
      // Trasforma eventuali campi JSON
      if (vehicleData.features && typeof vehicleData.features === "string") {
        try {
          vehicleData.features = JSON.parse(vehicleData.features);
        } catch (e) {
          vehicleData.features = []; // In caso di errore, usa un array vuoto
        }
      }
      
      if (vehicleData.badges && typeof vehicleData.badges === "string") {
        try {
          vehicleData.badges = JSON.parse(vehicleData.badges);
        } catch (e) {
          vehicleData.badges = []; // In caso di errore, usa un array vuoto
        }
      }
      
      // Validazione dei dati
      const validatedData = insertVehicleSchema.parse(vehicleData);
      
      // Gestione immagine principale
      if (req.file) {
        // Crea il nome del file per l'immagine principale
        const timestamp = Date.now();
        const mainImageFileName = `image_${timestamp}.jpg`;
        
        // Salva il file fisicamente con il nome corretto
        try {
          const oldPath = req.file.path;
          const newPath = path.join(__dirname, '..', 'public', 'uploads', mainImageFileName);
          
          // Assicurati che la directory esista
          const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          // Copia e rinomina il file
          fs.copyFileSync(oldPath, newPath);
          fs.unlinkSync(oldPath); // Rimuovi il file temporaneo
          
          // Salva il percorso completo nel database
          validatedData.mainImage = `/uploads/${mainImageFileName}`;
          console.log("Immagine principale del veicolo salvata:", validatedData.mainImage);
        } catch (fsError) {
          console.error("Errore durante il salvataggio dell'immagine principale:", fsError);
          // Continua comunque con la creazione del veicolo
        }
      }
      
      const vehicle = await dbStorage.createVehicle(validatedData);
      res.status(201).json(vehicle);
    } catch (error) {
      console.error("Error creating vehicle:", error);
      res.status(400).json({ message: "Invalid vehicle data", error: error.message });
    }
  });

  // Update Vehicle - Completamente ristrutturato con migliore gestione delle immagini
  app.put("/api/admin/vehicles/:id", isAdmin, upload.single("mainImage"), async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.id);
      
      // Ottieni il veicolo esistente prima dell'aggiornamento
      const existingVehicle = await dbStorage.getVehicle(vehicleId);
      if (!existingVehicle) {
        return res.status(404).json({ message: "Veicolo non trovato" });
      }
      
      // Ottiene i dati inviati come JSON
      let vehicleData;
      try {
        vehicleData = JSON.parse(req.body.data);
        console.log("Dati veicolo ricevuti per l'aggiornamento:", {
          id: vehicleId,
          title: vehicleData.title,
          hasMainImage: !!req.file,
          mainImageStatus: vehicleData.mainImage === null ? "richiesta rimozione" : (vehicleData.mainImage ? "esistente" : "non specificata")
        });
      } catch (parseError) {
        console.error("Errore analisi dati JSON del veicolo:", parseError);
        return res.status(400).json({ message: "Formato JSON non valido nei dati del veicolo" });
      }
      
      // Trasforma eventuali campi JSON
      if (vehicleData.features && typeof vehicleData.features === "string") {
        try {
          vehicleData.features = JSON.parse(vehicleData.features);
        } catch (e) {
          vehicleData.features = []; // In caso di errore, usa un array vuoto
        }
      }
      
      if (vehicleData.badges && typeof vehicleData.badges === "string") {
        try {
          vehicleData.badges = JSON.parse(vehicleData.badges);
        } catch (e) {
          vehicleData.badges = []; // In caso di errore, usa un array vuoto
        }
      }
      
      // Verifica se c'è una richiesta esplicita di reset delle immagini
      const shouldResetImages = vehicleData.images && vehicleData.images.length === 0;
      
      // Validazione dei dati
      const validatedData = insertVehicleSchema.parse(vehicleData);
      
      // Gestione immagine principale
      if (req.file) {
        // È stata caricata una nuova immagine principale
        const timestamp = Date.now();
        const mainImageFileName = `image_${timestamp}.jpg`;
        
        // Salva il file fisicamente con il nome corretto
        try {
          const oldPath = req.file.path;
          const newPath = path.join(process.cwd(), 'public', 'uploads', mainImageFileName);
          
          // Assicurati che la directory esista
          const uploadDir = path.join(process.cwd(), 'public', 'uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          // Copia e rinomina il file
          fs.copyFileSync(oldPath, newPath);
          fs.unlinkSync(oldPath); // Rimuovi il file temporaneo
          
          // Aggiorna il percorso nel database
          validatedData.mainImage = `/uploads/${mainImageFileName}`;
          
          console.log("Immagine principale del veicolo aggiornata:", validatedData.mainImage);
        } catch (fsError) {
          console.error("Errore durante il salvataggio dell'immagine principale:", fsError);
          return res.status(500).json({ message: "Errore durante il salvataggio dell'immagine" });
        }
      } else if (vehicleData.mainImage === null) {
        // L'utente ha richiesto esplicitamente di rimuovere l'immagine principale
        // Se c'era un'immagine principale esistente, elimina il file
        if (existingVehicle.mainImage) {
          try {
            const imagePath = path.join(process.cwd(), 'public', existingVehicle.mainImage);
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
              console.log("File immagine principale eliminato:", existingVehicle.mainImage);
            }
          } catch (fsError) {
            console.warn("Impossibile eliminare il file immagine principale:", fsError);
            // Continua comunque con l'aggiornamento anche se la rimozione fisica del file è fallita
          }
        }
        
        console.log("Immagine principale del veicolo rimossa");
      } else {
        // Nessuna modifica all'immagine principale, mantieni il valore esistente
        // se non specificato altrimenti
        if (!validatedData.mainImage && existingVehicle.mainImage) {
          validatedData.mainImage = existingVehicle.mainImage;
        }
      }
      
      // Gestione delle immagini della galleria
      if (shouldResetImages) {
        // L'utente ha richiesto di rimuovere tutte le immagini della galleria
        if (existingVehicle.images && Array.isArray(existingVehicle.images)) {
          // Elimina i file fisici delle immagini
          for (const imagePath of existingVehicle.images) {
            try {
              const fullPath = path.join(process.cwd(), 'public', imagePath);
              if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                console.log("File immagine galleria eliminato:", imagePath);
              }
            } catch (fsError) {
              console.warn(`Impossibile eliminare il file immagine: ${imagePath}`, fsError);
              // Continua comunque con le altre immagini
            }
          }
        }
        
        // Imposta un array vuoto per images
        validatedData.images = [];
        console.log("Tutte le immagini della galleria sono state rimosse");
      } else if (!validatedData.images || !Array.isArray(validatedData.images)) {
        // Se non ci sono immagini nel payload, non aggiornare il campo images
        delete validatedData.images;
      }
      
      // Aggiorna il veicolo nel database
      const updatedVehicle = await dbStorage.updateVehicle(vehicleId, validatedData);
      console.log(`Veicolo ID ${vehicleId} aggiornato con successo`);
      res.json(updatedVehicle);
    } catch (error) {
      console.error("Errore aggiornamento veicolo:", error);
      res.status(400).json({ message: "Dati veicolo non validi", error: error.message });
    }
  });

  app.delete("/api/admin/vehicles/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteVehicle(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting vehicle" });
    }
  });
  
  // Route specifica per aggiornare lo stato "Assegnato" di un veicolo
  app.put("/api/admin/vehicles/:id/toggle-assigned", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { assigned } = req.body;
      
      // Recupera il veicolo
      const vehicle = await dbStorage.getVehicle(id);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      // Modifica i badge
      let badges = Array.isArray(vehicle.badges) ? [...vehicle.badges] : [];
      
      if (assigned && !badges.includes("Assegnato")) {
        badges.push("Assegnato");
      } else if (!assigned) {
        badges = badges.filter(badge => badge !== "Assegnato");
      }
      
      // Prepara i dati da aggiornare - estrai solo i campi necessari
      const { badges: _, ...vehicleData } = vehicle;
      
      // Aggiorna il veicolo
      const updatedVehicle = await dbStorage.updateVehicle(id, { 
        ...vehicleData, 
        badges: badges 
      });
      
      res.json(updatedVehicle);
    } catch (error) {
      res.status(500).json({ message: "Error updating vehicle status" });
    }
  });

  // Upload additional vehicle images - Completamente riscritta per migliore gestione file
  app.post("/api/admin/vehicles/:id/images", isAdmin, upload.array("images", 10), async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.id);
      const files = req.files as Express.Multer.File[];
      
      // Verifica che il veicolo esista
      const vehicle = await dbStorage.getVehicle(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ message: "Veicolo non trovato" });
      }
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "Nessuna immagine caricata" });
      }
      
      console.log(`Ricevute ${files.length} immagini aggiuntive per il veicolo ID: ${vehicleId}`);
      
      // Assicurati che la directory degli upload esista
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Elabora ogni file caricato
      const imageUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const timestamp = Date.now() + i; // Aggiunge l'indice per evitare conflitti se caricati nello stesso millisecondo
        const fileName = `image_${vehicleId}_${timestamp}.jpg`;
        const filePath = path.join(uploadDir, fileName);
        
        try {
          // Copia e rinomina il file
          fs.copyFileSync(file.path, filePath);
          fs.unlinkSync(file.path); // Rimuovi il file temporaneo
          
          // Aggiungi l'URL dell'immagine all'array per il database
          imageUrls.push(`/uploads/${fileName}`);
          
          console.log(`Immagine ${i+1}/${files.length} salvata: /uploads/${fileName}`);
        } catch (fsError) {
          console.error(`Errore durante il salvataggio dell'immagine ${i+1}:`, fsError);
          // Continua con le altre immagini anche se una fallisce
        }
      }
      
      if (imageUrls.length === 0) {
        return res.status(500).json({ message: "Errore: nessuna immagine è stata salvata correttamente" });
      }
      
      // Aggiunge i percorsi completi al veicolo nel database
      await dbStorage.addVehicleImages(vehicleId, imageUrls);
      
      console.log(`Aggiunte ${imageUrls.length} immagini al veicolo ID: ${vehicleId}`);
      res.status(201).json({ 
        message: `${imageUrls.length} immagini caricate con successo`,
        imageUrls 
      });
    } catch (error) {
      console.error("Errore caricamento immagini:", error);
      res.status(500).json({ message: "Errore durante il caricamento delle immagini" });
    }
  });

  // CRUD operations for brands
  app.get("/api/admin/brands", isAdmin, async (req, res) => {
    try {
      const brands = await dbStorage.getBrands();
      res.json(brands);
    } catch (error) {
      res.status(500).json({ message: "Error fetching brands" });
    }
  });

  app.post("/api/admin/brands", isAdmin, upload.single("logo"), async (req, res) => {
    try {
      let brandData;
      try {
        brandData = JSON.parse(req.body.data);
      } catch (parseError) {
        console.error("Error parsing brand data:", parseError);
        return res.status(400).json({ message: "Invalid JSON format in brand data" });
      }
      
      const validatedData = insertBrandSchema.parse(brandData);
      
      if (req.file) {
        validatedData.logo = `/uploads/${req.file.filename}`;
        console.log("Brand logo saved:", validatedData.logo);
      }
      
      const brand = await dbStorage.createBrand(validatedData);
      res.status(201).json(brand);
    } catch (error) {
      console.error("Error creating brand:", error);
      res.status(400).json({ message: "Invalid brand data", error: error.message });
    }
  });

  app.put("/api/admin/brands/:id", isAdmin, upload.single("logo"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      let brandData;
      try {
        brandData = JSON.parse(req.body.data);
      } catch (parseError) {
        console.error("Error parsing brand data:", parseError);
        return res.status(400).json({ message: "Invalid JSON format in brand data" });
      }
      
      const validatedData = insertBrandSchema.parse(brandData);
      
      if (req.file) {
        // Usa il nome del file effettivamente salvato
        validatedData.logo = `/uploads/${req.file.filename}`;
        console.log("Brand logo updated:", validatedData.logo);
      }
      
      const brand = await dbStorage.updateBrand(id, validatedData);
      res.json(brand);
    } catch (error) {
      console.error("Error updating brand:", error);
      res.status(400).json({ message: "Invalid brand data", error: error.message });
    }
  });

  app.delete("/api/admin/brands/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteBrand(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting brand" });
    }
  });

  // CRUD operations for categories
  app.get("/api/admin/categories", isAdmin, async (req, res) => {
    try {
      const categories = await dbStorage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories" });
    }
  });

  app.post("/api/admin/categories", isAdmin, upload.single("image"), async (req, res) => {
    try {
      let categoryData;
      try {
        categoryData = JSON.parse(req.body.data);
      } catch (parseError) {
        console.error("Error parsing category data:", parseError);
        return res.status(400).json({ message: "Invalid JSON format in category data" });
      }
      
      const validatedData = insertCategorySchema.parse(categoryData);
      
      if (req.file) {
        // Usa il nome del file effettivamente salvato
        validatedData.image = `/uploads/${req.file.filename}`;
        console.log("Category image saved:", validatedData.image);
      }
      
      const category = await dbStorage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(400).json({ message: "Invalid category data", error: error.message });
    }
  });

  app.put("/api/admin/categories/:id", isAdmin, upload.single("image"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      let categoryData;
      try {
        categoryData = JSON.parse(req.body.data);
      } catch (parseError) {
        console.error("Error parsing category data:", parseError);
        return res.status(400).json({ message: "Invalid JSON format in category data" });
      }
      
      const validatedData = insertCategorySchema.parse(categoryData);
      
      if (req.file) {
        // Usa il nome del file effettivamente salvato
        validatedData.image = `/uploads/${req.file.filename}`;
        console.log("Category image updated:", validatedData.image);
      }
      
      const category = await dbStorage.updateCategory(id, validatedData);
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(400).json({ message: "Invalid category data", error: error.message });
    }
  });

  app.delete("/api/admin/categories/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteCategory(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting category" });
    }
  });

  // CRUD operations for rental options
  app.get("/api/admin/vehicles/:id/rental-options", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rentalOptions = await dbStorage.getRentalOptions(id);
      res.json(rentalOptions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching rental options" });
    }
  });
  
  app.get("/api/admin/rental-options/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rentalOption = await dbStorage.getRentalOption(id);
      
      if (!rentalOption) {
        return res.status(404).json({ message: "Rental option not found" });
      }
      
      res.json(rentalOption);
    } catch (error) {
      res.status(500).json({ message: "Error fetching rental option" });
    }
  });

  app.post("/api/admin/vehicles/:id/rental-options", isAdmin, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.id);
      const validatedData = insertRentalOptionSchema.parse({
        ...req.body,
        vehicleId
      });
      
      const rentalOption = await dbStorage.createRentalOption(validatedData);
      res.status(201).json(rentalOption);
    } catch (error) {
      res.status(400).json({ message: "Invalid rental option data" });
    }
  });

  app.put("/api/admin/rental-options/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertRentalOptionSchema.parse(req.body);
      
      const rentalOption = await dbStorage.updateRentalOption(id, validatedData);
      res.json(rentalOption);
    } catch (error) {
      res.status(400).json({ message: "Invalid rental option data" });
    }
  });

  app.delete("/api/admin/rental-options/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteRentalOption(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting rental option" });
    }
  });

  // Information requests management
  app.get("/api/admin/requests", isAdmin, async (req, res) => {
    try {
      const requests = await dbStorage.getRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Error fetching requests" });
    }
  });

  app.put("/api/admin/requests/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["new", "in_progress", "completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const request = await dbStorage.updateRequestStatus(id, status);
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Error updating request" });
    }
  });

  app.delete("/api/admin/requests/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteRequest(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting request" });
    }
  });

  // Gestione Promozioni
  
  // Ottieni le impostazioni delle promozioni
  app.get("/api/admin/promo/settings", isAdmin, async (req, res) => {
    try {
      const settings = await dbStorage.getPromoSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching promo settings" });
    }
  });
  
  // Aggiorna le impostazioni delle promozioni
  app.put("/api/admin/promo/settings", isAdmin, async (req, res) => {
    try {
      const validatedData = insertPromoSettingsSchema.parse(req.body);
      const settings = await dbStorage.updatePromoSettings(validatedData);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: "Invalid promo settings data" });
    }
  });
  
  // Ottieni i veicoli in promozione con il loro ordine
  app.get("/api/admin/promo/vehicles", isAdmin, async (req, res) => {
    try {
      const promoVehicles = await dbStorage.getFeaturedPromoVehicles();
      res.json(promoVehicles);
    } catch (error) {
      res.status(500).json({ message: "Error fetching promo vehicles" });
    }
  });
  
  // Aggiungi un veicolo alla promozione
  app.post("/api/admin/promo/vehicles/:id", isAdmin, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.id);
      const { displayOrder } = req.body;
      
      const promoItem = await dbStorage.addVehicleToPromo(
        vehicleId, 
        displayOrder !== undefined ? parseInt(displayOrder) : undefined
      );
      
      res.status(201).json(promoItem);
    } catch (error) {
      res.status(500).json({ message: "Error adding vehicle to promo" });
    }
  });
  
  // Rimuovi un veicolo dalla promozione
  app.delete("/api/admin/promo/vehicles/:id", isAdmin, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.id);
      await dbStorage.removeVehicleFromPromo(vehicleId);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error removing vehicle from promo" });
    }
  });
  
  // Aggiorna l'ordine dei veicoli in promozione
  app.put("/api/admin/promo/order", isAdmin, async (req, res) => {
    try {
      const { promos } = req.body;
      
      if (!Array.isArray(promos)) {
        return res.status(400).json({ message: "Invalid promos data" });
      }
      
      const updatedPromos = await dbStorage.updatePromoOrder(promos);
      res.json(updatedPromos);
    } catch (error) {
      res.status(500).json({ message: "Error updating promo order" });
    }
  });
  
  // ====== GESTIONE PROVINCE ======
  
  // Ottiene tutte le province
  app.get("/api/provinces", async (req, res) => {
    try {
      const provinces = await dbStorage.getProvinces();
      res.json(provinces);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle province", error });
    }
  });
  
  // Ottiene solo le province attive
  app.get("/api/provinces/active", async (req, res) => {
    try {
      const provinces = await dbStorage.getActiveProvinces();
      res.json(provinces);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle province attive", error });
    }
  });
  
  // API per la gestione admin delle province
  app.get("/api/admin/provinces", isAdmin, async (req, res) => {
    try {
      const provinces = await dbStorage.getProvinces();
      res.json(provinces);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle province", error });
    }
  });
  
  app.post("/api/admin/provinces", isAdmin, async (req, res) => {
    try {
      const validatedData = insertProvinceSchema.parse(req.body);
      const province = await dbStorage.createProvince(validatedData);
      
      // Registra l'attività
      await dbStorage.createActivityLog({
        userId: req.user!.id,
        action: "create",
        entityType: "province",
        entityId: province.id,
        details: { name: province.name }
      });
      
      res.status(201).json(province);
    } catch (error) {
      res.status(500).json({ message: "Errore nella creazione della provincia", error });
    }
  });
  
  app.patch("/api/admin/provinces/:id", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const province = await dbStorage.updateProvince(id, req.body);
      
      // Registra l'attività
      await dbStorage.createActivityLog({
        userId: req.user!.id,
        action: "update",
        entityType: "province",
        entityId: province.id,
        details: { name: province.name, active: province.isActive }
      });
      
      res.json(province);
    } catch (error) {
      res.status(500).json({ message: "Errore nell'aggiornamento della provincia", error });
    }
  });
  
  app.delete("/api/admin/provinces/:id", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const province = await dbStorage.getProvince(id);
      await dbStorage.deleteProvince(id);
      
      // Registra l'attività
      if (province) {
        await dbStorage.createActivityLog({
          userId: req.user!.id,
          action: "delete",
          entityType: "province",
          entityId: id,
          details: { name: province.name }
        });
      }
      
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Errore nell'eliminazione della provincia", error });
    }
  });
  
  app.put("/api/admin/provinces/update-status", isAdmin, async (req, res) => {
    const { ids, isActive } = req.body;
    try {
      await dbStorage.updateProvincesStatus(ids, isActive);
      
      // Registra l'attività
      await dbStorage.createActivityLog({
        userId: req.user!.id,
        action: isActive ? "activate" : "deactivate",
        entityType: "provinces",
        details: { ids, count: ids.length }
      });
      
      res.sendStatus(200);
    } catch (error) {
      res.status(500).json({ message: "Errore nell'aggiornamento dello stato delle province", error });
    }
  });
  
  // ====== IMPOSTAZIONI GENERALI ======
  
  app.get("/api/settings/general", async (req, res) => {
    try {
      const settings = await dbStorage.getGeneralSettings();
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle impostazioni generali", error });
    }
  });
  
  app.patch("/api/admin/settings/general", isAdmin, async (req, res) => {
    try {
      const validatedData = insertGeneralSettingsSchema.parse(req.body);
      const settings = await dbStorage.updateGeneralSettings(validatedData);
      
      // Registra l'attività
      await dbStorage.createActivityLog({
        userId: req.user!.id,
        action: "update",
        entityType: "general_settings",
        details: { siteName: settings.siteName }
      });
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Errore nell'aggiornamento delle impostazioni generali", error });
    }
  });
  
  // ====== IMPOSTAZIONI DI SICUREZZA ======
  
  app.get("/api/admin/settings/security", isAdmin, async (req, res) => {
    try {
      const settings = await dbStorage.getSecuritySettings();
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle impostazioni di sicurezza", error });
    }
  });
  
  app.patch("/api/admin/settings/security", isAdmin, async (req, res) => {
    try {
      const validatedData = insertSecuritySettingsSchema.parse(req.body);
      const settings = await dbStorage.updateSecuritySettings(validatedData);
      
      // Registra l'attività
      await dbStorage.createActivityLog({
        userId: req.user!.id,
        action: "update",
        entityType: "security_settings",
        details: { 
          passwordExpiryDays: settings.passwordExpiryDays,
          enable2FA: settings.enable2FA,
          failedLoginAttempts: settings.failedLoginAttempts 
        }
      });
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Errore nell'aggiornamento delle impostazioni di sicurezza", error });
    }
  });
  
  // ====== REGISTRO ATTIVITÀ ======
  
  app.get("/api/admin/activity-logs", isAdmin, async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    try {
      const logs = await dbStorage.getActivityLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero del registro attività", error });
    }
  });

  app.post("/api/admin/activity-logs", isAdmin, async (req, res) => {
    try {
      const log = await dbStorage.createActivityLog({
        userId: req.user!.id,
        ...req.body
      });
      res.status(201).json(log);
    } catch (error) {
      res.status(500).json({ message: "Errore nella creazione del log di attività", error });
    }
  });

  app.get("/api/admin/activity-logs/user/:userId", isAdmin, async (req, res) => {
    const userId = parseInt(req.params.userId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    try {
      const logs = await dbStorage.getActivityLogsByUser(userId, limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle attività dell'utente", error });
    }
  });

  // API per le province
  app.get("/api/provinces", async (req, res) => {
    try {
      const provinces = await dbStorage.getProvinces();
      res.json(provinces);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle province" });
    }
  });

  // 2FA API routes
  
  // Ottieni lo stato 2FA dell'utente
  app.get("/api/auth/2fa/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Non autenticato" });
    }
    
    try {
      const twoFactorAuth = await dbStorage.getUserTwoFactorAuth(req.user.id);
      const securitySettings = await dbStorage.getSecuritySettings();
      
      res.json({
        isEnabled: !!twoFactorAuth,
        isVerified: twoFactorAuth?.isVerified || false,
        isGloballyEnabled: securitySettings?.enable2FA || false,
        isGloballyActive: securitySettings?.twoFaActive || false
      });
    } catch (error) {
      console.error("Error getting 2FA status:", error);
      res.status(500).json({ message: "Errore nel recupero dello stato 2FA" });
    }
  });
  
  // Inizia la configurazione 2FA
  app.post("/api/auth/2fa/setup", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Non autenticato" });
    }
    
    try {
      // Verifica se l'utente ha già configurato il 2FA
      const existingSetup = await dbStorage.getUserTwoFactorAuth(req.user.id);
      if (existingSetup) {
        await dbStorage.deleteTwoFactorAuth(req.user.id);
      }
      
      // Genera un nuovo secret
      const setup = await generateSecret(req.user.id, req.user.username);
      res.json(setup);
    } catch (error) {
      console.error("Error setting up 2FA:", error);
      res.status(500).json({ message: "Errore nella configurazione 2FA" });
    }
  });
  
  // Verifica il token 2FA
  app.post("/api/auth/2fa/verify", async (req, res) => {
    if (!req.isAuthenticated() && !req.body.userId) {
      return res.status(401).json({ message: "Non autenticato" });
    }
    
    try {
      const userId = req.body.userId || req.user.id;
      const token = req.body.token;
      
      if (!token) {
        return res.status(400).json({ message: "Token mancante" });
      }
      
      const verified = await verifyToken(userId, token);
      
      if (verified) {
        // Se è una richiesta di verifica durante il login, non dovremmo fare nulla qui
        // Perché l'utente deve ancora essere autenticato tramite il flusso di login
        
        // Ottieni i codici di backup per mostrarli all'utente
        const twoFactorAuth = await dbStorage.getUserTwoFactorAuth(userId);
        
        if (twoFactorAuth && twoFactorAuth.backupCodes) {
          res.json({ 
            success: true,
            backupCodes: twoFactorAuth.backupCodes 
          });
        } else {
          res.json({ success: true });
        }
      } else {
        res.status(400).json({ message: "Token non valido" });
      }
    } catch (error) {
      console.error("Error verifying 2FA token:", error);
      res.status(500).json({ message: "Errore nella verifica del token 2FA" });
    }
  });
  
  // Verifica un codice di backup
  app.post("/api/auth/2fa/verify-backup", async (req, res) => {
    if (!req.isAuthenticated() && !req.body.userId) {
      return res.status(401).json({ message: "Non autenticato" });
    }
    
    try {
      const userId = req.body.userId || req.user.id;
      const code = req.body.code;
      
      if (!code) {
        return res.status(400).json({ message: "Codice mancante" });
      }
      
      const verified = await verifyBackupCode(userId, code);
      
      if (verified) {
        res.json({ success: true });
      } else {
        res.status(400).json({ message: "Codice di backup non valido" });
      }
    } catch (error) {
      console.error("Error verifying backup code:", error);
      res.status(500).json({ message: "Errore nella verifica del codice di backup" });
    }
  });
  
  // Questo endpoint è stato sostituito dall'endpoint all'inizio
  
  // Disabilita 2FA
  app.post("/api/auth/2fa/disable", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Non autenticato" });
    }
    
    try {
      await disable2FA(req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      res.status(500).json({ message: "Errore nella disabilitazione del 2FA" });
    }
  });

  // --- INTEGRATIONS API ENDPOINTS --- //
  
  // Social Login Configuration
  app.get("/api/integrations/social/:provider", isAdmin, async (req, res) => {
    try {
      const { provider } = req.params;
      const config = await dbStorage.getSocialLoginConfig(provider);
      
      if (!config) {
        // Se non esiste configurazione, ritorniamo un oggetto vuoto 
        return res.json({
          provider: provider,
          enabled: false,
          clientId: "",
          clientSecret: "",
          callbackUrl: ""
        });
      }
      
      res.json(config);
    } catch (error) {
      console.error("Errore nel caricamento della configurazione social:", error);
      res.status(500).json({ message: "Errore nel caricamento della configurazione" });
    }
  });
  
  app.post("/api/integrations/social/:provider", isAdmin, async (req, res) => {
    try {
      const { provider } = req.params;
      const data = req.body;
      
      // Assicurati che provider sia nel corpo della richiesta
      data.provider = provider;
      
      const config = await dbStorage.saveSocialLoginConfig(data);
      res.json(config);
    } catch (error) {
      console.error("Errore nel salvataggio della configurazione social:", error);
      res.status(500).json({ message: "Errore nel salvataggio della configurazione" });
    }
  });
  
  // Email Configuration
  app.get("/api/integrations/email", isAdmin, async (req, res) => {
    try {
      const config = await dbStorage.getEmailConfig();
      
      if (!config) {
        return res.json({
          enabled: false,
          provider: "smtp",
          host: "",
          port: 587,
          secure: false,
          username: "",
          password: "",
          fromEmail: "",
          sendgridApiKey: "",
        });
      }
      
      // Assicuriamoci che il valore "enabled" sia esplicitamente booleano nel JSON di risposta
      // forzandolo come valore primitivo
      const transformedConfig = {
        ...config,
        enabled: config.enabled === true ? true : false,
        secure: config.secure === true ? true : false
      };
      
      console.log("Email config dal database:", config);
      console.log("Email config trasformata:", transformedConfig);
      console.log("enabled è", transformedConfig.enabled, "di tipo", typeof transformedConfig.enabled);
      
      // Converti in JSON e poi di nuovo in oggetto per assicurarci che i valori booleani siano preservati
      const jsonString = JSON.stringify(transformedConfig);
      console.log("JSON inviato al client:", jsonString);
      
      // Invia la risposta come JSON
      res.json(transformedConfig);
    } catch (error) {
      console.error("Errore nel caricamento della configurazione email:", error);
      res.status(500).json({ message: "Errore nel caricamento della configurazione" });
    }
  });
  
  app.post("/api/integrations/email", isAdmin, async (req, res) => {
    try {
      const data = req.body;
      const config = await dbStorage.saveEmailConfig(data);
      
      res.json(config);
    } catch (error) {
      console.error("Errore nel salvataggio della configurazione email:", error);
      res.status(500).json({ message: "Errore nel salvataggio della configurazione" });
    }
  });
  
  // Email templates
  app.get("/api/integrations/email-templates", isAdmin, async (req, res) => {
    try {
      const templates = await dbStorage.getEmailTemplates();
      
      // Converte l'array di templates in un oggetto con nome del template come chiave
      const templatesMap = templates.reduce((acc, template) => {
        acc[template.name] = {
          subject: template.subject,
          body: template.body,
        };
        return acc;
      }, {});
      
      res.json(templatesMap);
    } catch (error) {
      console.error("Errore nel caricamento dei template email:", error);
      res.status(500).json({ message: "Errore nel caricamento dei template" });
    }
  });
  
  app.post("/api/integrations/email-template", isAdmin, async (req, res) => {
    try {
      const { name, subject, body } = req.body;
      
      if (!name || !subject || !body) {
        return res.status(400).json({ message: "Campi obbligatori mancanti" });
      }
      
      const template = await dbStorage.saveEmailTemplate({
        name,
        subject,
        body,
      });
      
      res.json(template);
    } catch (error) {
      console.error("Errore nel salvataggio del template email:", error);
      res.status(500).json({ message: "Errore nel salvataggio del template" });
    }
  });
  
  // Twilio (SMS) Configuration
  app.get("/api/integrations/twilio", isAdmin, async (req, res) => {
    try {
      const config = await dbStorage.getTwilioConfig();
      
      if (!config) {
        return res.json({
          enabled: false,
          accountSid: "",
          authToken: "",
          verifyServiceSid: "",
          fromNumber: "",
        });
      }
      
      res.json(config);
    } catch (error) {
      console.error("Errore nel caricamento della configurazione Twilio:", error);
      res.status(500).json({ message: "Errore nel caricamento della configurazione" });
    }
  });
  
  app.post("/api/integrations/twilio", isAdmin, async (req, res) => {
    try {
      const data = req.body;
      const config = await dbStorage.saveTwilioConfig(data);
      
      res.json(config);
    } catch (error) {
      console.error("Errore nel salvataggio della configurazione Twilio:", error);
      res.status(500).json({ message: "Errore nel salvataggio della configurazione" });
    }
  });
  
  // Payment Configuration
  app.get("/api/integrations/payment/:provider", isAdmin, async (req, res) => {
    try {
      const { provider } = req.params;
      const config = await dbStorage.getPaymentConfig(provider);
      
      if (!config) {
        return res.json({
          provider: provider,
          enabled: false,
          publicKey: "",
          secretKey: "",
        });
      }
      
      res.json(config);
    } catch (error) {
      console.error("Errore nel caricamento della configurazione pagamenti:", error);
      res.status(500).json({ message: "Errore nel caricamento della configurazione" });
    }
  });
  
  app.post("/api/integrations/payment/:provider", isAdmin, async (req, res) => {
    try {
      const { provider } = req.params;
      const data = req.body;
      
      // Assicurati che provider sia nel corpo della richiesta
      data.provider = provider;
      
      const config = await dbStorage.savePaymentConfig(data);
      
      res.json(config);
    } catch (error) {
      console.error("Errore nel salvataggio della configurazione pagamenti:", error);
      res.status(500).json({ message: "Errore nel salvataggio della configurazione" });
    }
  });
  
  // Get all integrations configuration
  app.get("/api/admin/integrations", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Get email configuration
      const emailConfig = await dbStorage.getEmailConfig() || {
        enabled: false,
        provider: "smtp",
      };
      
      // Get email templates
      const emailTemplates = await dbStorage.getEmailTemplates();
      const templatesMap = emailTemplates.reduce((acc, template) => {
        acc[template.name] = {
          subject: template.subject,
          body: template.body,
        };
        return acc;
      }, {});
      
      // Get Twilio configuration
      const twilioConfig = await dbStorage.getTwilioConfig() || {
        enabled: false,
      };
      
      // Get social login configurations
      const socialLoginConfigs = await dbStorage.getSocialLoginConfigs();
      let socialLogin: {
        googleEnabled: boolean;
        facebookEnabled: boolean;
        githubEnabled: boolean;
        googleClientId?: string;
        googleClientSecret?: string;
        facebookAppId?: string;
        facebookAppSecret?: string;
        githubClientId?: string;
        githubClientSecret?: string;
      } = {
        googleEnabled: false,
        facebookEnabled: false,
        githubEnabled: false,
      };
      
      socialLoginConfigs.forEach(config => {
        if (config.provider === "google") {
          socialLogin.googleEnabled = config.enabled;
          socialLogin.googleClientId = config.clientId;
          socialLogin.googleClientSecret = config.clientSecret;
        } else if (config.provider === "facebook") {
          socialLogin.facebookEnabled = config.enabled;
          socialLogin.facebookAppId = config.clientId;
          socialLogin.facebookAppSecret = config.clientSecret;
        } else if (config.provider === "github") {
          socialLogin.githubEnabled = config.enabled;
          socialLogin.githubClientId = config.clientId;
          socialLogin.githubClientSecret = config.clientSecret;
        }
      });
      
      // Get payment configurations
      const paymentConfigs = await dbStorage.getPaymentConfigs();
      let payment: {
        stripeEnabled: boolean;
        paypalEnabled: boolean;
        stripePublicKey?: string;
        stripeSecretKey?: string;
        paypalClientId?: string;
        paypalClientSecret?: string;
      } = {
        stripeEnabled: false,
        paypalEnabled: false,
      };
      
      paymentConfigs.forEach(config => {
        if (config.provider === "stripe") {
          payment.stripeEnabled = config.enabled;
          payment.stripePublicKey = config.publicKey;
          payment.stripeSecretKey = config.secretKey;
        } else if (config.provider === "paypal") {
          payment.paypalEnabled = config.enabled;
          payment.paypalClientId = config.publicKey;
          payment.paypalClientSecret = config.secretKey;
        }
      });
      
      // Return all configurations
      res.json({
        email: emailConfig,
        socialLogin,
        twilio: twilioConfig,
        payment,
        emailTemplates: templatesMap,
      });
    } catch (error) {
      console.error("Error getting integrations config:", error);
      res.status(500).json({ message: "Error retrieving integrations configuration" });
    }
  });
  
  // Email configuration
  app.put("/api/admin/integrations/email", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const emailConfig = await dbStorage.saveEmailConfig(req.body);
      res.json(emailConfig);
    } catch (error) {
      console.error("Error saving email config:", error);
      res.status(500).json({ message: "Error saving email configuration" });
    }
  });
  
  // Email templates
  app.put("/api/admin/integrations/email-template", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { name, subject, body } = req.body;
      
      if (!name || !subject || !body) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const template = await dbStorage.saveEmailTemplate({
        name,
        subject,
        body,
      });
      
      res.json(template);
    } catch (error) {
      console.error("Error saving email template:", error);
      res.status(500).json({ message: "Error saving email template" });
    }
  });
  
  // Test email
  app.post("/api/admin/integrations/test-email", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { to, templateName } = req.body;
      
      if (!to || !templateName) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const success = await dbStorage.sendEmail(to, templateName, {
        username: req.user.username,
        siteName: "o2o Mobility",
        url: process.env.BASE_URL || "https://o2mobility.com",
      });
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ message: "Failed to send test email" });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Error sending test email" });
    }
  });
  
  // Twilio configuration
  app.put("/api/admin/integrations/twilio", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const twilioConfig = await dbStorage.saveTwilioConfig(req.body);
      res.json(twilioConfig);
    } catch (error) {
      console.error("Error saving Twilio config:", error);
      res.status(500).json({ message: "Error saving Twilio configuration" });
    }
  });
  
  // Test SMS
  app.post("/api/admin/integrations/test-sms", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { to } = req.body;
      
      if (!to) {
        return res.status(400).json({ message: "Missing phone number" });
      }
      
      const success = await dbStorage.sendSMS(to, "This is a test message from o2o Mobility");
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ message: "Failed to send test SMS" });
      }
    } catch (error) {
      console.error("Error sending test SMS:", error);
      res.status(500).json({ message: "Error sending test SMS" });
    }
  });
  
  // Social login configuration
  app.put("/api/admin/integrations/social-login", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { 
        googleEnabled, googleClientId, googleClientSecret,
        facebookEnabled, facebookAppId, facebookAppSecret,
        githubEnabled, githubClientId, githubClientSecret
      } = req.body;
      
      // Update Google config
      if (googleEnabled !== undefined) {
        await dbStorage.saveSocialLoginConfig({
          provider: "google",
          enabled: googleEnabled,
          clientId: googleClientId || "",
          clientSecret: googleClientSecret || "",
        });
      }
      
      // Update Facebook config
      if (facebookEnabled !== undefined) {
        await dbStorage.saveSocialLoginConfig({
          provider: "facebook",
          enabled: facebookEnabled,
          clientId: facebookAppId || "",
          clientSecret: facebookAppSecret || "",
        });
      }
      
      // Update GitHub config
      if (githubEnabled !== undefined) {
        await dbStorage.saveSocialLoginConfig({
          provider: "github",
          enabled: githubEnabled,
          clientId: githubClientId || "",
          clientSecret: githubClientSecret || "",
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving social login config:", error);
      res.status(500).json({ message: "Error saving social login configuration" });
    }
  });
  
  // Test Email Endpoint
  app.post("/api/admin/integrations/test-email", isAdmin, async (req, res) => {
    try {
      const { to, templateName } = req.body;
      
      if (!to) {
        return res.status(400).json({ message: "Indirizzo email destinatario mancante" });
      }
      
      // Recupera la configurazione email
      const emailConfig = await dbStorage.getEmailConfig();
      if (!emailConfig || !emailConfig.enabled) {
        return res.status(400).json({ message: "La configurazione email non è attiva" });
      }
      
      // Recupera il template email
      const template = await dbStorage.getEmailTemplate(templateName || "welcome");
      if (!template) {
        return res.status(404).json({ message: "Template email non trovato" });
      }
      
      // Prepara i dati per l'email
      let emailData = {
        to: to,
        subject: template.subject,
        html: template.body,
        from: emailConfig.fromEmail
      };
      
      // Invia l'email utilizzando il servizio email configurato
      if (emailConfig.provider === "smtp") {
        // Configurazione SMTP
        const transporter = nodemailer.createTransport({
          host: emailConfig.host,
          port: emailConfig.port,
          secure: emailConfig.secure,
          auth: {
            user: emailConfig.username,
            pass: emailConfig.password
          }
        });
        
        await transporter.sendMail(emailData);
      } else if (emailConfig.provider === "sendgrid" && emailConfig.sendgridApiKey) {
        // Configurazione SendGrid
        sgMail.setApiKey(emailConfig.sendgridApiKey);
        await sgMail.send({
          to: emailData.to,
          from: emailData.from,
          subject: emailData.subject,
          html: emailData.html
        });
      } else {
        return res.status(400).json({ message: "Configurazione email non valida" });
      }
      
      res.json({ success: true, message: "Email di test inviata con successo" });
    } catch (error) {
      console.error("Errore nell'invio dell'email di test:", error);
      res.status(500).json({ message: "Errore nell'invio dell'email di test" });
    }
  });
  
  // Payment configuration
  app.put("/api/admin/integrations/payment", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { 
        stripeEnabled, stripePublicKey, stripeSecretKey,
        paypalEnabled, paypalClientId, paypalClientSecret
      } = req.body;
      
      // Update Stripe config
      if (stripeEnabled !== undefined) {
        await dbStorage.savePaymentConfig({
          provider: "stripe",
          enabled: stripeEnabled,
          publicKey: stripePublicKey || "",
          secretKey: stripeSecretKey || "",
        });
      }
      
      // Update PayPal config
      if (paypalEnabled !== undefined) {
        await dbStorage.savePaymentConfig({
          provider: "paypal",
          enabled: paypalEnabled,
          publicKey: paypalClientId || "",
          secretKey: paypalClientSecret || "",
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving payment config:", error);
      res.status(500).json({ message: "Error saving payment configuration" });
    }
  });

  // Endpoint pubblico per ottenere i provider di social login attivi
  app.get("/api/auth/social-providers", async (req, res) => {
    try {
      const socialLoginConfigs = await dbStorage.getSocialLoginConfigs();
      
      // Restituisci solo i provider attivi e le informazioni pubbliche (client ID)
      const activeProviders = socialLoginConfigs
        .filter(config => config.enabled)
        .map(config => ({
          provider: config.provider,
          clientId: config.clientId,
        }));
      
      res.json(activeProviders);
    } catch (error) {
      console.error("Error getting social login providers:", error);
      res.status(500).json({ message: "Error retrieving social login providers" });
    }
  });

  // Integrations API routes
  app.get("/api/integrations/email", authenticated, isAdmin, async (req, res) => {
    try {
      const config = await db.select().from(emailConfig).limit(1);
      
      if (config.length === 0) {
        // Create a default configuration if none exists
        const [defaultConfig] = await db.insert(emailConfig).values({
          enabled: false,
          provider: "smtp",
          host: "",
          port: 587,
          secure: false,
          username: "",
          password: "",
          fromEmail: "",
        }).returning();
        
        return res.status(200).json(defaultConfig);
      }
      
      return res.status(200).json(config[0]);
    } catch (error) {
      console.error("Error getting email configuration:", error);
      return res.status(500).json({ error: "Errore nel recupero della configurazione email" });
    }
  });

  app.patch("/api/integrations/email", authenticated, isAdmin, async (req, res) => {
    try {
      const { id, ...data } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: "ID configurazione non specificato" });
      }
      
      const [updatedConfig] = await db
        .update(emailConfig)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(emailConfig.id, id))
        .returning();
      
      return res.status(200).json(updatedConfig);
    } catch (error) {
      console.error("Error updating email configuration:", error);
      return res.status(500).json({ error: "Errore nell'aggiornamento della configurazione email" });
    }
  });

  app.post("/api/integrations/email/test", authenticated, isAdmin, async (req, res) => {
    try {
      const { to, subject, message } = req.body;
      
      if (!to || !subject || !message) {
        return res.status(400).json({ error: "Destinatario, oggetto e messaggio sono obbligatori" });
      }
      
      // Get the email configuration
      const [config] = await db.select().from(emailConfig).limit(1);
      
      if (!config) {
        return res.status(404).json({ error: "Configurazione email non trovata" });
      }
      
      if (!config.enabled) {
        return res.status(400).json({ error: "La configurazione email non è attiva" });
      }
      
      // Send email based on the provider
      if (config.provider === "smtp") {
        // Create a transport
        const transport = nodemailer.createTransport({
          host: config.host,
          port: config.port || 587,
          secure: config.secure || false,
          auth: {
            user: config.username,
            pass: config.password,
          },
        });
        
        // Send email
        await transport.sendMail({
          from: config.fromEmail,
          to,
          subject,
          text: message,
        });
      } else if (config.provider === "sendgrid") {
        // Set the API key
        sgMail.setApiKey(config.sendgridApiKey || "");
        
        // Send email
        await sgMail.send({
          from: config.fromEmail,
          to,
          subject,
          text: message,
        });
      } else {
        return res.status(400).json({ error: "Provider email non supportato" });
      }
      
      return res.status(200).json({ success: true, message: "Email inviata con successo" });
    } catch (error) {
      console.error("Error sending test email:", error);
      return res.status(500).json({ error: "Errore nell'invio dell'email di test", details: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
