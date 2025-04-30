import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
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
import { generateTOTPSecret, generateQRCode, verifyTOTP, generateBackupCodes } from "./totp";

// Configure multer for in-memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Middleware per la verifica dell'amministratore
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || req.user.role !== "admin") {
    return res.status(403).json({ message: "Accesso negato" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Le rotte per il 2FA saranno implementate più avanti

  // Public API routes
  
  // Get all vehicles with filters
  app.get("/api/vehicles", async (req, res) => {
    try {
      const filters = req.query;
      const vehicles = await storage.getVehicles(filters);
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Error fetching vehicles" });
    }
  });

  // Get featured vehicles
  app.get("/api/vehicles/featured", async (req, res) => {
    try {
      const featuredVehicles = await storage.getFeaturedVehicles();
      res.json(featuredVehicles);
    } catch (error) {
      res.status(500).json({ message: "Error fetching featured vehicles" });
    }
  });

  // Get vehicle by ID
  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(id);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ message: "Error fetching vehicle" });
    }
  });

  // Get related vehicles
  app.get("/api/vehicles/:id/related", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const relatedVehicles = await storage.getRelatedVehicles(id);
      res.json(relatedVehicles);
    } catch (error) {
      res.status(500).json({ message: "Error fetching related vehicles" });
    }
  });

  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories" });
    }
  });
  
  // Get active categories (con veicoli disponibili)
  app.get("/api/categories/active", async (req, res) => {
    try {
      const categories = await storage.getActiveCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching active categories" });
    }
  });

  // Get all brands
  app.get("/api/brands", async (req, res) => {
    try {
      const brands = await storage.getBrands();
      res.json(brands);
    } catch (error) {
      res.status(500).json({ message: "Error fetching brands" });
    }
  });
  
  // Get active brands (con veicoli disponibili)
  app.get("/api/brands/active", async (req, res) => {
    try {
      const brands = await storage.getActiveBrands();
      res.json(brands);
    } catch (error) {
      res.status(500).json({ message: "Error fetching active brands" });
    }
  });

  // Submit an information request
  app.post("/api/requests", async (req, res) => {
    try {
      const validatedData = insertRequestSchema.parse(req.body);
      const request = await storage.createRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Get rental options for a vehicle
  app.get("/api/vehicles/:id/rental-options", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rentalOptions = await storage.getRentalOptions(id);
      res.json(rentalOptions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching rental options" });
    }
  });
  
  // Get rental options for all vehicles (for filtering)
  app.get("/api/rental-options/all", async (req, res) => {
    try {
      // Ottieni tutte le opzioni di noleggio dal database
      const allOptions = await storage.getAllRentalOptions();
      res.json(allOptions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching rental options" });
    }
  });

  // Admin API routes

  // Dashboard stats
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching stats" });
    }
  });

  // CRUD operations for vehicles
  app.get("/api/admin/vehicles", isAdmin, async (req, res) => {
    try {
      const vehicles = await storage.getAdminVehicles();
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Error fetching vehicles" });
    }
  });

  app.post("/api/admin/vehicles", isAdmin, upload.single("mainImage"), async (req, res) => {
    try {
      const vehicleData = JSON.parse(req.body.data);
      const validatedData = insertVehicleSchema.parse(vehicleData);
      
      // Handle image upload here
      if (req.file) {
        validatedData.mainImage = `image_${Date.now()}.jpg`; // In real app, save to disk/S3
      }
      
      const vehicle = await storage.createVehicle(validatedData);
      res.status(201).json(vehicle);
    } catch (error) {
      res.status(400).json({ message: "Invalid vehicle data" });
    }
  });

  app.put("/api/admin/vehicles/:id", isAdmin, upload.single("mainImage"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vehicleData = JSON.parse(req.body.data);
      const validatedData = insertVehicleSchema.parse(vehicleData);
      
      // Handle image upload here
      if (req.file) {
        validatedData.mainImage = `image_${Date.now()}.jpg`; // In real app, save to disk/S3
      }
      
      const vehicle = await storage.updateVehicle(id, validatedData);
      res.json(vehicle);
    } catch (error) {
      res.status(400).json({ message: "Invalid vehicle data" });
    }
  });

  app.delete("/api/admin/vehicles/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteVehicle(id);
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
      const vehicle = await storage.getVehicle(id);
      
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
      
      // Aggiorna il veicolo
      const updatedVehicle = await storage.updateVehicle(id, { ...vehicle, badges });
      res.json(updatedVehicle);
    } catch (error) {
      res.status(500).json({ message: "Error updating vehicle status" });
    }
  });

  // Upload additional vehicle images
  app.post("/api/admin/vehicles/:id/images", isAdmin, upload.array("images", 10), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No images uploaded" });
      }
      
      const imageUrls = files.map((file, index) => `image_${id}_${Date.now()}_${index}.jpg`);
      await storage.addVehicleImages(id, imageUrls);
      
      res.status(201).json({ imageUrls });
    } catch (error) {
      res.status(500).json({ message: "Error uploading images" });
    }
  });

  // CRUD operations for brands
  app.get("/api/admin/brands", isAdmin, async (req, res) => {
    try {
      const brands = await storage.getBrands();
      res.json(brands);
    } catch (error) {
      res.status(500).json({ message: "Error fetching brands" });
    }
  });

  app.post("/api/admin/brands", isAdmin, upload.single("logo"), async (req, res) => {
    try {
      const brandData = JSON.parse(req.body.data);
      const validatedData = insertBrandSchema.parse(brandData);
      
      if (req.file) {
        validatedData.logo = `brand_${Date.now()}.jpg`;
      }
      
      const brand = await storage.createBrand(validatedData);
      res.status(201).json(brand);
    } catch (error) {
      res.status(400).json({ message: "Invalid brand data" });
    }
  });

  app.put("/api/admin/brands/:id", isAdmin, upload.single("logo"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const brandData = JSON.parse(req.body.data);
      const validatedData = insertBrandSchema.parse(brandData);
      
      if (req.file) {
        validatedData.logo = `brand_${Date.now()}.jpg`;
      }
      
      const brand = await storage.updateBrand(id, validatedData);
      res.json(brand);
    } catch (error) {
      res.status(400).json({ message: "Invalid brand data" });
    }
  });

  app.delete("/api/admin/brands/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBrand(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting brand" });
    }
  });

  // CRUD operations for categories
  app.get("/api/admin/categories", isAdmin, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories" });
    }
  });

  app.post("/api/admin/categories", isAdmin, upload.single("image"), async (req, res) => {
    try {
      const categoryData = JSON.parse(req.body.data);
      const validatedData = insertCategorySchema.parse(categoryData);
      
      if (req.file) {
        validatedData.image = `category_${Date.now()}.jpg`;
      }
      
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.put("/api/admin/categories/:id", isAdmin, upload.single("image"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = JSON.parse(req.body.data);
      const validatedData = insertCategorySchema.parse(categoryData);
      
      if (req.file) {
        validatedData.image = `category_${Date.now()}.jpg`;
      }
      
      const category = await storage.updateCategory(id, validatedData);
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.delete("/api/admin/categories/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting category" });
    }
  });

  // CRUD operations for rental options
  app.get("/api/admin/vehicles/:id/rental-options", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rentalOptions = await storage.getRentalOptions(id);
      res.json(rentalOptions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching rental options" });
    }
  });
  
  app.get("/api/admin/rental-options/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rentalOption = await storage.getRentalOption(id);
      
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
      
      const rentalOption = await storage.createRentalOption(validatedData);
      res.status(201).json(rentalOption);
    } catch (error) {
      res.status(400).json({ message: "Invalid rental option data" });
    }
  });

  app.put("/api/admin/rental-options/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertRentalOptionSchema.parse(req.body);
      
      const rentalOption = await storage.updateRentalOption(id, validatedData);
      res.json(rentalOption);
    } catch (error) {
      res.status(400).json({ message: "Invalid rental option data" });
    }
  });

  app.delete("/api/admin/rental-options/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRentalOption(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting rental option" });
    }
  });

  // Information requests management
  app.get("/api/admin/requests", isAdmin, async (req, res) => {
    try {
      const requests = await storage.getRequests();
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
      
      const request = await storage.updateRequestStatus(id, status);
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Error updating request" });
    }
  });

  app.delete("/api/admin/requests/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRequest(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting request" });
    }
  });

  // Gestione Promozioni
  
  // Ottieni le impostazioni delle promozioni
  app.get("/api/admin/promo/settings", isAdmin, async (req, res) => {
    try {
      const settings = await storage.getPromoSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching promo settings" });
    }
  });
  
  // Aggiorna le impostazioni delle promozioni
  app.put("/api/admin/promo/settings", isAdmin, async (req, res) => {
    try {
      const validatedData = insertPromoSettingsSchema.parse(req.body);
      const settings = await storage.updatePromoSettings(validatedData);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: "Invalid promo settings data" });
    }
  });
  
  // Ottieni i veicoli in promozione con il loro ordine
  app.get("/api/admin/promo/vehicles", isAdmin, async (req, res) => {
    try {
      const promoVehicles = await storage.getFeaturedPromoVehicles();
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
      
      const promoItem = await storage.addVehicleToPromo(
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
      await storage.removeVehicleFromPromo(vehicleId);
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
      
      const updatedPromos = await storage.updatePromoOrder(promos);
      res.json(updatedPromos);
    } catch (error) {
      res.status(500).json({ message: "Error updating promo order" });
    }
  });
  
  // ====== GESTIONE PROVINCE ======
  
  // Ottiene tutte le province
  app.get("/api/provinces", async (req, res) => {
    try {
      const provinces = await storage.getProvinces();
      res.json(provinces);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle province", error });
    }
  });
  
  // Ottiene solo le province attive
  app.get("/api/provinces/active", async (req, res) => {
    try {
      const provinces = await storage.getActiveProvinces();
      res.json(provinces);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle province attive", error });
    }
  });
  
  // API per la gestione admin delle province
  app.get("/api/admin/provinces", isAdmin, async (req, res) => {
    try {
      const provinces = await storage.getProvinces();
      res.json(provinces);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle province", error });
    }
  });
  
  app.post("/api/admin/provinces", isAdmin, async (req, res) => {
    try {
      const validatedData = insertProvinceSchema.parse(req.body);
      const province = await storage.createProvince(validatedData);
      
      // Registra l'attività
      await storage.createActivityLog({
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
      const province = await storage.updateProvince(id, req.body);
      
      // Registra l'attività
      await storage.createActivityLog({
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
      const province = await storage.getProvince(id);
      await storage.deleteProvince(id);
      
      // Registra l'attività
      if (province) {
        await storage.createActivityLog({
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
      await storage.updateProvincesStatus(ids, isActive);
      
      // Registra l'attività
      await storage.createActivityLog({
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
      const settings = await storage.getGeneralSettings();
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle impostazioni generali", error });
    }
  });
  
  app.patch("/api/admin/settings/general", isAdmin, async (req, res) => {
    try {
      const validatedData = insertGeneralSettingsSchema.parse(req.body);
      const settings = await storage.updateGeneralSettings(validatedData);
      
      // Registra l'attività
      await storage.createActivityLog({
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
      const settings = await storage.getSecuritySettings();
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle impostazioni di sicurezza", error });
    }
  });
  
  app.patch("/api/admin/settings/security", isAdmin, async (req, res) => {
    try {
      const validatedData = insertSecuritySettingsSchema.parse(req.body);
      const settings = await storage.updateSecuritySettings(validatedData);
      
      // Registra l'attività
      await storage.createActivityLog({
        userId: req.user!.id,
        action: "update",
        entityType: "security_settings",
        details: { 
          passwordExpiryDays: settings.passwordExpiryDays,
          enable2FA: settings.enable2FA,
          require2FA: settings.require2FA,
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
      const logs = await storage.getActivityLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero del registro attività", error });
    }
  });

  app.post("/api/admin/activity-logs", isAdmin, async (req, res) => {
    try {
      const log = await storage.createActivityLog({
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
      const logs = await storage.getActivityLogsByUser(userId, limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle attività dell'utente", error });
    }
  });

  // INIZIO IMPLEMENTAZIONE 2FA
  
  // Middleware per verificare se l'utente è autenticato
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Non autenticato" });
    }
    next();
  };

  // Stato 2FA (statistiche)
  app.get("/api/admin/two-factor/status", isAdmin, async (req, res) => {
    try {
      // Ottieni il numero totale di utenti
      const users = await storage.getUsers();
      
      // Contiamo quanti utenti hanno il 2FA attivato
      const enabledCount = users.filter(user => user.twoFactorEnabled).length;
      const verifiedCount = users.filter(user => user.twoFactorEnabled && user.twoFactorVerified).length;
      
      // Otteniamo la configurazione attuale
      const securitySettings = await storage.getSecuritySettings();
      
      res.json({
        totalUsers: users.length,
        enabledCount,
        verifiedCount,
        settings: {
          enable2FA: securitySettings?.enable2FA || false,
          require2FA: securitySettings?.require2FA || false
        }
      });
    } catch (error) {
      console.error("Errore nel recupero delle statistiche 2FA:", error);
      res.status(500).json({ message: "Errore nel recupero delle statistiche" });
    }
  });
  
  // Setup 2FA - Generazione codice QR iniziale
  app.post("/api/2fa/setup", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Utente non autenticato" });
      }
      
      console.log("[2FA] Setup iniziato");
      
      // Otteniamo il segreto esistente o ne creiamo uno nuovo
      let twoFactorSecret = await storage.getUserTwoFactorSecret(req.user.id);
      
      console.log("Generazione segreto per:", req.user.username);
      
      // Se l'utente non ha già un segreto (o stiamo rigenerando)
      if (!twoFactorSecret) {
        // Generazione del segreto
        const totpSecret = generateTOTPSecret(req.user.username);
        
        // Salvataggio nel database
        twoFactorSecret = await storage.createUserTwoFactorSecret({
          userId: req.user.id,
          secret: totpSecret.secret,
          uri: totpSecret.uri,
          backupCodes: JSON.stringify(generateBackupCodes()),
          verified: false
        });
        
        console.log("[2FA] Creato nuovo segreto");
      } else {
        // Se il segreto esiste già, lo resettiamo
        const totpSecret = generateTOTPSecret(req.user.username);
        
        await storage.updateUserTwoFactorSecret(req.user.id, {
          secret: totpSecret.secret,
          uri: totpSecret.uri,
          backupCodes: JSON.stringify(generateBackupCodes()),
          verified: false
        });
        
        console.log("[2FA] Aggiornato segreto esistente");
      }
      
      // Generiamo il QR code
      console.log("Generazione QR code per URL:", twoFactorSecret.uri);
      const qrCodeUrl = await generateQRCode(twoFactorSecret.uri);
      
      res.json({ 
        success: true,
        qrCodeUrl
      });
    } catch (error) {
      console.error("Errore durante il setup 2FA:", error);
      res.status(500).json({ 
        success: false, 
        message: "Errore durante il setup dell'autenticazione a due fattori" 
      });
    }
  });
  
  // Verifica setup 2FA - Conferma che il codice funziona
  app.post("/api/2fa/verify-setup", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Utente non autenticato" });
      }
      
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ 
          success: false, 
          message: "Token mancante" 
        });
      }
      
      // Otteniamo il segreto dal database
      const twoFactorSecret = await storage.getUserTwoFactorSecret(req.user.id);
      
      if (!twoFactorSecret) {
        return res.status(400).json({ 
          success: false, 
          message: "Setup 2FA non inizializzato" 
        });
      }
      
      // Verifichiamo il token
      const isValidToken = verifyTOTP(twoFactorSecret.secret, token);
      
      if (!isValidToken) {
        return res.status(400).json({ 
          success: false, 
          message: "Token non valido" 
        });
      }
      
      // Token valido, aggiorniamo lo stato
      await storage.updateUserTwoFactorSecret(req.user.id, {
        verified: true
      });
      
      // Attiviamo il 2FA per l'utente
      await storage.updateUser(req.user.id, {
        twoFactorEnabled: true,
        twoFactorVerified: true
      });
      
      // Restituiamo i codici di backup all'utente
      const backupCodes = JSON.parse(twoFactorSecret.backupCodes || '[]');
      
      // Registra nel log delle attività
      await storage.createActivityLog({
        userId: req.user.id,
        action: "2FA_ENABLED",
        entityType: "user",
        entityId: req.user.id,
        details: JSON.stringify({
          message: "Autenticazione a due fattori attivata"
        }),
        ipAddress: req.ip || "",
        userAgent: req.headers["user-agent"] || ""
      });
      
      res.json({ 
        success: true,
        message: "Autenticazione a due fattori attivata con successo",
        backupCodes
      });
    } catch (error) {
      console.error("Errore durante la verifica del token 2FA:", error);
      res.status(500).json({ 
        success: false, 
        message: "Errore durante l'elaborazione della richiesta" 
      });
    }
  });
  
  // Verifica token 2FA durante il login
  app.post("/api/2fa/verify", async (req, res) => {
    try {
      // Otteniamo l'utente dalla sessione (se è in modalità 2FA)
      const userId = req.session.twoFactorUserId;
      
      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          message: "Nessuna sessione 2FA in corso" 
        });
      }
      
      const { token, isBackupCode = false } = req.body;
      
      if (!token) {
        return res.status(400).json({ 
          success: false, 
          message: "Token mancante" 
        });
      }
      
      // Otteniamo l'utente e il suo segreto
      const user = await storage.getUser(userId);
      const twoFactorSecret = await storage.getUserTwoFactorSecret(userId);
      
      if (!user || !twoFactorSecret) {
        return res.status(400).json({ 
          success: false, 
          message: "Utente o configurazione 2FA non trovati" 
        });
      }
      
      let isValid = false;
      
      if (isBackupCode) {
        // Verifica del codice di backup
        const backupCodes = JSON.parse(twoFactorSecret.backupCodes || '[]');
        const normalizedToken = token.replace(/\s/g, '').toUpperCase();
        
        isValid = backupCodes.includes(normalizedToken);
        
        // Se il codice di backup è valido, lo rimuoviamo dalla lista
        if (isValid) {
          const updatedCodes = backupCodes.filter(code => code !== normalizedToken);
          await storage.updateUserTwoFactorSecret(userId, {
            backupCodes: JSON.stringify(updatedCodes)
          });
        }
      } else {
        // Verifica del codice TOTP
        isValid = verifyTOTP(twoFactorSecret.secret, token);
      }
      
      if (!isValid) {
        return res.status(400).json({ 
          success: false, 
          message: "Codice non valido" 
        });
      }
      
      // Codice valido, completiamo il login
      req.login(user, async (err) => {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: "Errore durante il login" 
          });
        }
        
        // Registra nel log delle attività
        await storage.createActivityLog({
          userId: user.id,
          action: "USER_LOGIN_2FA",
          entityType: "user",
          entityId: user.id,
          details: JSON.stringify({
            message: "Login con autenticazione a due fattori completato",
            method: isBackupCode ? "backup_code" : "totp"
          }),
          ipAddress: req.ip || "",
          userAgent: req.headers["user-agent"] || ""
        });
        
        // Rimuoviamo lo stato temporaneo della sessione
        delete req.session.twoFactorUserId;
        
        return res.json({ 
          success: true, 
          user 
        });
      });
    } catch (error) {
      console.error("Errore durante la verifica del token 2FA:", error);
      res.status(500).json({ 
        success: false, 
        message: "Errore durante l'elaborazione della richiesta" 
      });
    }
  });
  
  // Disabilita 2FA per l'utente corrente
  app.post("/api/two-factor/disable", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Utente non autenticato" });
      }
      
      // Disabilita 2FA per l'utente
      await storage.updateUser(req.user.id, {
        twoFactorEnabled: false,
        twoFactorVerified: false
      });
      
      // Rimuovi il segreto
      await storage.deleteUserTwoFactorSecret(req.user.id);
      
      // Registra nel log delle attività
      await storage.createActivityLog({
        userId: req.user.id,
        action: "2FA_DISABLED",
        entityType: "user",
        entityId: req.user.id,
        details: JSON.stringify({
          message: "Autenticazione a due fattori disabilitata"
        }),
        ipAddress: req.ip || "",
        userAgent: req.headers["user-agent"] || ""
      });
      
      res.json({ 
        success: true,
        message: "Autenticazione a due fattori disabilitata con successo"
      });
    } catch (error) {
      console.error("Errore durante la disabilitazione del 2FA:", error);
      res.status(500).json({ 
        success: false, 
        message: "Errore durante l'elaborazione della richiesta" 
      });
    }
  });
  
  // FINE IMPLEMENTAZIONE 2FA

  const httpServer = createServer(app);
  return httpServer;
}
