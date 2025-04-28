import { Brand, Category, InsertBrand, InsertCategory, InsertRentalOption, InsertRequest, InsertUser, InsertVehicle, RentalOption, Request, User, Vehicle } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { pool } from "./db";
import { eq, and, like, lte, sql, desc, asc } from "drizzle-orm";
import { 
  users, brands, categories, vehicles, 
  rentalOptions, requests 
} from "@shared/schema";

// PostgreSQL session store
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  
  // Brands
  getBrands(): Promise<Brand[]>;
  getBrand(id: number): Promise<Brand | undefined>;
  createBrand(brand: InsertBrand): Promise<Brand>;
  updateBrand(id: number, brand: InsertBrand): Promise<Brand>;
  deleteBrand(id: number): Promise<void>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: InsertCategory): Promise<Category>;
  deleteCategory(id: number): Promise<void>;
  
  // Vehicles
  getVehicles(filters?: any): Promise<Vehicle[]>;
  getFeaturedVehicles(): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getAdminVehicles(): Promise<Vehicle[]>;
  getRelatedVehicles(id: number): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: InsertVehicle): Promise<Vehicle>;
  deleteVehicle(id: number): Promise<void>;
  addVehicleImages(id: number, imageUrls: string[]): Promise<Vehicle>;
  
  // Rental Options
  getRentalOptions(vehicleId: number): Promise<RentalOption[]>;
  createRentalOption(option: InsertRentalOption): Promise<RentalOption>;
  updateRentalOption(id: number, option: InsertRentalOption): Promise<RentalOption>;
  deleteRentalOption(id: number): Promise<void>;
  
  // Requests
  getRequests(): Promise<Request[]>;
  getRequest(id: number): Promise<Request | undefined>;
  createRequest(request: InsertRequest): Promise<Request>;
  updateRequestStatus(id: number, status: string): Promise<Request>;
  deleteRequest(id: number): Promise<void>;
  
  // Stats
  getStats(): Promise<any>;
  
  // Session
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true, 
    });
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  async getBrands(): Promise<Brand[]> {
    return db.select().from(brands);
  }
  
  async getBrand(id: number): Promise<Brand | undefined> {
    const [brand] = await db.select().from(brands).where(eq(brands.id, id));
    return brand;
  }
  
  async createBrand(brand: InsertBrand): Promise<Brand> {
    const [newBrand] = await db
      .insert(brands)
      .values(brand)
      .returning();
    return newBrand;
  }
  
  async updateBrand(id: number, brand: InsertBrand): Promise<Brand> {
    const [updatedBrand] = await db
      .update(brands)
      .set(brand)
      .where(eq(brands.id, id))
      .returning();
    
    if (!updatedBrand) {
      throw new Error(`Brand with id ${id} not found`);
    }
    
    return updatedBrand;
  }
  
  async deleteBrand(id: number): Promise<void> {
    await db.delete(brands).where(eq(brands.id, id));
  }
  
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }
  
  async updateCategory(id: number, category: InsertCategory): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    
    if (!updatedCategory) {
      throw new Error(`Category with id ${id} not found`);
    }
    
    return updatedCategory;
  }
  
  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }
  
  async getVehicles(filters?: any): Promise<Vehicle[]> {
    let query = db.select().from(vehicles);
    
    if (filters) {
      if (filters.brandId) {
        query = query.where(eq(vehicles.brandId, parseInt(filters.brandId)));
      }
      
      if (filters.categoryId) {
        query = query.where(eq(vehicles.categoryId, parseInt(filters.categoryId)));
      }
      
      if (filters.maxPrice) {
        query = query.where(lte(vehicles.price, parseInt(filters.maxPrice)));
      }
      
      if (filters.year) {
        query = query.where(eq(vehicles.year, parseInt(filters.year)));
      }
      
      if (filters.fuelType) {
        query = query.where(eq(vehicles.fuelType, filters.fuelType));
      }
    }
    
    return query;
  }
  
  async getFeaturedVehicles(): Promise<Vehicle[]> {
    // Aggiorniamo temporaneamente i veicoli per garantire che alcuni siano "featured"
    await db.update(vehicles).set({ featured: true }).where(eq(vehicles.id, 1));
    await db.update(vehicles).set({ featured: true }).where(eq(vehicles.id, 2));
    await db.update(vehicles).set({ featured: true }).where(eq(vehicles.id, 3));
    return db.select().from(vehicles).where(eq(vehicles.featured, true));
  }
  
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }
  
  async getAdminVehicles(): Promise<Vehicle[]> {
    return db.select().from(vehicles).orderBy(desc(vehicles.updatedAt));
  }
  
  async getRelatedVehicles(id: number): Promise<Vehicle[]> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    if (!vehicle) return [];
    
    // Get vehicles of the same category or brand, but not the same vehicle
    const relatedVehicles = await db.select()
      .from(vehicles)
      .where(
        and(
          sql`${vehicles.id} != ${id}`,
          sql`(${vehicles.categoryId} = ${vehicle.categoryId} OR ${vehicles.brandId} = ${vehicle.brandId})`
        )
      )
      .limit(3);
    
    return relatedVehicles;
  }
  
  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db
      .insert(vehicles)
      .values({
        ...vehicle,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newVehicle;
  }
  
  async updateVehicle(id: number, vehicle: InsertVehicle): Promise<Vehicle> {
    const [updatedVehicle] = await db
      .update(vehicles)
      .set({
        ...vehicle,
        updatedAt: new Date()
      })
      .where(eq(vehicles.id, id))
      .returning();
    
    if (!updatedVehicle) {
      throw new Error(`Vehicle with id ${id} not found`);
    }
    
    return updatedVehicle;
  }
  
  async deleteVehicle(id: number): Promise<void> {
    await db.delete(vehicles).where(eq(vehicles.id, id));
  }
  
  async addVehicleImages(id: number, imageUrls: string[]): Promise<Vehicle> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    
    if (!vehicle) {
      throw new Error(`Vehicle with id ${id} not found`);
    }
    
    // Combine existing and new images
    const existingImages = vehicle.images as string[] || [];
    const newImages = [...existingImages, ...imageUrls];
    
    const [updatedVehicle] = await db
      .update(vehicles)
      .set({
        images: newImages,
        updatedAt: new Date()
      })
      .where(eq(vehicles.id, id))
      .returning();
    
    return updatedVehicle;
  }
  
  async getRentalOptions(vehicleId: number): Promise<RentalOption[]> {
    return db
      .select()
      .from(rentalOptions)
      .where(eq(rentalOptions.vehicleId, vehicleId));
  }
  
  async getRentalOption(id: number): Promise<RentalOption | undefined> {
    const [option] = await db
      .select()
      .from(rentalOptions)
      .where(eq(rentalOptions.id, id));
    
    return option;
  }
  
  async createRentalOption(option: InsertRentalOption): Promise<RentalOption> {
    const [newOption] = await db
      .insert(rentalOptions)
      .values(option)
      .returning();
    
    return newOption;
  }
  
  async updateRentalOption(id: number, option: InsertRentalOption): Promise<RentalOption> {
    const [updatedOption] = await db
      .update(rentalOptions)
      .set(option)
      .where(eq(rentalOptions.id, id))
      .returning();
    
    if (!updatedOption) {
      throw new Error(`Rental option with id ${id} not found`);
    }
    
    return updatedOption;
  }
  
  async deleteRentalOption(id: number): Promise<void> {
    await db.delete(rentalOptions).where(eq(rentalOptions.id, id));
  }
  
  async getRequests(): Promise<Request[]> {
    return db.select().from(requests).orderBy(desc(requests.createdAt));
  }
  
  async getRequest(id: number): Promise<Request | undefined> {
    const [request] = await db.select().from(requests).where(eq(requests.id, id));
    return request;
  }
  
  async createRequest(request: InsertRequest): Promise<Request> {
    const [newRequest] = await db
      .insert(requests)
      .values({
        ...request,
        status: request.status || "pending",
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newRequest;
  }
  
  async updateRequestStatus(id: number, status: string): Promise<Request> {
    const [updatedRequest] = await db
      .update(requests)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(requests.id, id))
      .returning();
    
    if (!updatedRequest) {
      throw new Error(`Request with id ${id} not found`);
    }
    
    return updatedRequest;
  }
  
  async deleteRequest(id: number): Promise<void> {
    await db.delete(requests).where(eq(requests.id, id));
  }
  
  async getStats(): Promise<any> {
    // Count of users
    const [userCount] = await db.select({ count: sql`count(*)` }).from(users);
    
    // Count of vehicles
    const [vehicleCount] = await db.select({ count: sql`count(*)` }).from(vehicles);
    
    // Count of all requests
    const [requestCount] = await db.select({ count: sql`count(*)` }).from(requests);
    
    // Count of pending requests
    const [pendingCount] = await db
      .select({ count: sql`count(*)` })
      .from(requests)
      .where(eq(requests.status, "pending"));
    
    // Count of completed requests
    const [completedCount] = await db
      .select({ count: sql`count(*)` })
      .from(requests)
      .where(eq(requests.status, "completed"));
    
    // Recent vehicles
    const recentVehicles = await db
      .select()
      .from(vehicles)
      .orderBy(desc(vehicles.createdAt))
      .limit(5);
    
    // Recent requests
    const recentRequests = await db
      .select()
      .from(requests)
      .orderBy(desc(requests.createdAt))
      .limit(5);
    
    return {
      users: Number(userCount.count),
      vehicles: Number(vehicleCount.count),
      requests: Number(requestCount.count),
      pendingRequests: Number(pendingCount.count),
      completedRequests: Number(completedCount.count),
      recentVehicles,
      recentRequests
    };
  }
}