import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { generateSecret, verifyToken, verifyBackupCode, disable2FA } from "./2fa-utils";
import { setupImageProxy } from "./image-proxy";
import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";
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

// Configure multer for in-memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
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
      const user = await storage.getUser(req.user!.id);
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
      await storage.updateUser(req.user!.id, { password: hashedPassword });
      
      // Aggiungi la password alla cronologia
      await storage.addPasswordToHistory(req.user!.id, hashedPassword);
      
      // Ottieni le impostazioni di sicurezza
      const securitySettings = await storage.getSecuritySettings();
      
      // Pulisci la cronologia delle password se necessario
      if (securitySettings && securitySettings.passwordHistoryCount) {
        await storage.cleanupPasswordHistory(req.user!.id, securitySettings.passwordHistoryCount);
      }
      
      // Registra l'attività
      await storage.createActivityLog({
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
      let vehicleData;
      try {
        vehicleData = JSON.parse(req.body.data);
      } catch (parseError) {
        console.error("Error parsing vehicle data:", parseError);
        return res.status(400).json({ message: "Invalid JSON format in vehicle data" });
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
      
      const validatedData = insertVehicleSchema.parse(vehicleData);
      
      // Handle image upload here
      if (req.file) {
        validatedData.mainImage = `image_${Date.now()}.jpg`; // In real app, save to disk/S3
      }
      
      const vehicle = await storage.createVehicle(validatedData);
      res.status(201).json(vehicle);
    } catch (error) {
      console.error("Error creating vehicle:", error);
      res.status(400).json({ message: "Invalid vehicle data", error: error.message });
    }
  });

  app.put("/api/admin/vehicles/:id", isAdmin, upload.single("mainImage"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      let vehicleData;
      try {
        vehicleData = JSON.parse(req.body.data);
      } catch (parseError) {
        console.error("Error parsing vehicle data:", parseError);
        return res.status(400).json({ message: "Invalid JSON format in vehicle data" });
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
      
      const validatedData = insertVehicleSchema.parse(vehicleData);
      
      // Handle image upload here
      if (req.file) {
        validatedData.mainImage = `image_${Date.now()}.jpg`; // In real app, save to disk/S3
      }
      
      const vehicle = await storage.updateVehicle(id, validatedData);
      res.json(vehicle);
    } catch (error) {
      console.error("Error updating vehicle:", error);
      res.status(400).json({ message: "Invalid vehicle data", error: error.message });
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
      
      // Prepara i dati da aggiornare - estrai solo i campi necessari
      const { badges: _, ...vehicleData } = vehicle;
      
      // Aggiorna il veicolo
      const updatedVehicle = await storage.updateVehicle(id, { 
        ...vehicleData, 
        badges: badges 
      });
      
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
      let brandData;
      try {
        brandData = JSON.parse(req.body.data);
      } catch (parseError) {
        console.error("Error parsing brand data:", parseError);
        return res.status(400).json({ message: "Invalid JSON format in brand data" });
      }
      
      const validatedData = insertBrandSchema.parse(brandData);
      
      if (req.file) {
        validatedData.logo = `brand_${Date.now()}.jpg`;
      }
      
      const brand = await storage.createBrand(validatedData);
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
        validatedData.logo = `brand_${Date.now()}.jpg`;
      }
      
      const brand = await storage.updateBrand(id, validatedData);
      res.json(brand);
    } catch (error) {
      console.error("Error updating brand:", error);
      res.status(400).json({ message: "Invalid brand data", error: error.message });
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
      let categoryData;
      try {
        categoryData = JSON.parse(req.body.data);
      } catch (parseError) {
        console.error("Error parsing category data:", parseError);
        return res.status(400).json({ message: "Invalid JSON format in category data" });
      }
      
      const validatedData = insertCategorySchema.parse(categoryData);
      
      if (req.file) {
        validatedData.image = `category_${Date.now()}.jpg`;
      }
      
      const category = await storage.createCategory(validatedData);
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
        validatedData.image = `category_${Date.now()}.jpg`;
      }
      
      const category = await storage.updateCategory(id, validatedData);
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(400).json({ message: "Invalid category data", error: error.message });
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

  // API per le province
  app.get("/api/provinces", async (req, res) => {
    try {
      const provinces = await storage.getProvinces();
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
      const twoFactorAuth = await storage.getUserTwoFactorAuth(req.user.id);
      const securitySettings = await storage.getSecuritySettings();
      
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
      const existingSetup = await storage.getUserTwoFactorAuth(req.user.id);
      if (existingSetup) {
        await storage.deleteTwoFactorAuth(req.user.id);
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
        const twoFactorAuth = await storage.getUserTwoFactorAuth(userId);
        
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
      const config = await storage.getSocialLoginConfig(provider);
      
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
      
      const config = await storage.saveSocialLoginConfig(data);
      res.json(config);
    } catch (error) {
      console.error("Errore nel salvataggio della configurazione social:", error);
      res.status(500).json({ message: "Errore nel salvataggio della configurazione" });
    }
  });
  
  // Email Configuration
  app.get("/api/integrations/email", isAdmin, async (req, res) => {
    try {
      const config = await storage.getEmailConfig();
      
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
      
      res.json(config);
    } catch (error) {
      console.error("Errore nel caricamento della configurazione email:", error);
      res.status(500).json({ message: "Errore nel caricamento della configurazione" });
    }
  });
  
  app.post("/api/integrations/email", isAdmin, async (req, res) => {
    try {
      const data = req.body;
      const config = await storage.saveEmailConfig(data);
      
      res.json(config);
    } catch (error) {
      console.error("Errore nel salvataggio della configurazione email:", error);
      res.status(500).json({ message: "Errore nel salvataggio della configurazione" });
    }
  });
  
  // Email templates
  app.get("/api/integrations/email-templates", isAdmin, async (req, res) => {
    try {
      const templates = await storage.getEmailTemplates();
      
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
      
      const template = await storage.saveEmailTemplate({
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
      const config = await storage.getTwilioConfig();
      
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
      const config = await storage.saveTwilioConfig(data);
      
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
      const config = await storage.getPaymentConfig(provider);
      
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
      
      const config = await storage.savePaymentConfig(data);
      
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
      const emailConfig = await storage.getEmailConfig() || {
        enabled: false,
        provider: "smtp",
      };
      
      // Get email templates
      const emailTemplates = await storage.getEmailTemplates();
      const templatesMap = emailTemplates.reduce((acc, template) => {
        acc[template.name] = {
          subject: template.subject,
          body: template.body,
        };
        return acc;
      }, {});
      
      // Get Twilio configuration
      const twilioConfig = await storage.getTwilioConfig() || {
        enabled: false,
      };
      
      // Get social login configurations
      const socialLoginConfigs = await storage.getSocialLoginConfigs();
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
      const paymentConfigs = await storage.getPaymentConfigs();
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
      const emailConfig = await storage.saveEmailConfig(req.body);
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
      
      const template = await storage.saveEmailTemplate({
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
      
      const success = await storage.sendEmail(to, templateName, {
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
      const twilioConfig = await storage.saveTwilioConfig(req.body);
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
      
      const success = await storage.sendSMS(to, "This is a test message from o2o Mobility");
      
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
        await storage.saveSocialLoginConfig({
          provider: "google",
          enabled: googleEnabled,
          clientId: googleClientId || "",
          clientSecret: googleClientSecret || "",
        });
      }
      
      // Update Facebook config
      if (facebookEnabled !== undefined) {
        await storage.saveSocialLoginConfig({
          provider: "facebook",
          enabled: facebookEnabled,
          clientId: facebookAppId || "",
          clientSecret: facebookAppSecret || "",
        });
      }
      
      // Update GitHub config
      if (githubEnabled !== undefined) {
        await storage.saveSocialLoginConfig({
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
      const emailConfig = await storage.getEmailConfig();
      if (!emailConfig || !emailConfig.enabled) {
        return res.status(400).json({ message: "La configurazione email non è attiva" });
      }
      
      // Recupera il template email
      const template = await storage.getEmailTemplate(templateName || "welcome");
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
        await storage.savePaymentConfig({
          provider: "stripe",
          enabled: stripeEnabled,
          publicKey: stripePublicKey || "",
          secretKey: stripeSecretKey || "",
        });
      }
      
      // Update PayPal config
      if (paypalEnabled !== undefined) {
        await storage.savePaymentConfig({
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
      const socialLoginConfigs = await storage.getSocialLoginConfigs();
      
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

  const httpServer = createServer(app);
  return httpServer;
}
