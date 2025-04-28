import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import { insertVehicleSchema, insertBrandSchema, insertCategorySchema, insertRequestSchema, insertRentalOptionSchema } from "@shared/schema";

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

  // Get all brands
  app.get("/api/brands", async (req, res) => {
    try {
      const brands = await storage.getBrands();
      res.json(brands);
    } catch (error) {
      res.status(500).json({ message: "Error fetching brands" });
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

  app.put("/api/admin/vehicles/:id", upload.single("mainImage"), async (req, res) => {
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

  app.delete("/api/admin/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteVehicle(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting vehicle" });
    }
  });

  // Upload additional vehicle images
  app.post("/api/admin/vehicles/:id/images", upload.array("images", 10), async (req, res) => {
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
  app.get("/api/admin/brands", async (req, res) => {
    try {
      const brands = await storage.getBrands();
      res.json(brands);
    } catch (error) {
      res.status(500).json({ message: "Error fetching brands" });
    }
  });

  app.post("/api/admin/brands", upload.single("logo"), async (req, res) => {
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

  app.put("/api/admin/brands/:id", upload.single("logo"), async (req, res) => {
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

  app.delete("/api/admin/brands/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBrand(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting brand" });
    }
  });

  // CRUD operations for categories
  app.get("/api/admin/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories" });
    }
  });

  app.post("/api/admin/categories", upload.single("image"), async (req, res) => {
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

  app.put("/api/admin/categories/:id", upload.single("image"), async (req, res) => {
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

  app.delete("/api/admin/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting category" });
    }
  });

  // CRUD operations for rental options
  app.get("/api/admin/vehicles/:id/rental-options", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rentalOptions = await storage.getRentalOptions(id);
      res.json(rentalOptions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching rental options" });
    }
  });
  
  app.get("/api/admin/rental-options/:id", async (req, res) => {
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

  app.post("/api/admin/vehicles/:id/rental-options", async (req, res) => {
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

  app.put("/api/admin/rental-options/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertRentalOptionSchema.parse(req.body);
      
      const rentalOption = await storage.updateRentalOption(id, validatedData);
      res.json(rentalOption);
    } catch (error) {
      res.status(400).json({ message: "Invalid rental option data" });
    }
  });

  app.delete("/api/admin/rental-options/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRentalOption(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting rental option" });
    }
  });

  // Information requests management
  app.get("/api/admin/requests", async (req, res) => {
    try {
      const requests = await storage.getRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Error fetching requests" });
    }
  });

  app.put("/api/admin/requests/:id", async (req, res) => {
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

  app.delete("/api/admin/requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRequest(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
