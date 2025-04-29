import { 
  Brand, Category, InsertBrand, InsertCategory, InsertRentalOption, 
  InsertRequest, InsertUser, InsertVehicle, RentalOption, Request, 
  User, Vehicle, InsertPromoSettings, PromoSettings, 
  InsertFeaturedPromo, FeaturedPromo, Province, InsertProvince,
  GeneralSettings, InsertGeneralSettings, SecuritySettings, InsertSecuritySettings,
  ActivityLog, InsertActivityLog, PasswordHistory, AccountLockout, InsertAccountLockout,
  PasswordReset, InsertPasswordReset, InsertPasswordHistory
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { pool } from "./db";
import { eq, and, like, lte, lt, sql, desc, asc, inArray } from "drizzle-orm";
import { 
  users, brands, categories, vehicles, 
  rentalOptions, requests, promoSettings, featuredPromos,
  provinces, generalSettings, securitySettings, activityLogs,
  passwordHistory, accountLockouts, passwordResets
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
  getActiveBrands(): Promise<Brand[]>; // Marche con veicoli disponibili
  getBrand(id: number): Promise<Brand | undefined>;
  createBrand(brand: InsertBrand): Promise<Brand>;
  updateBrand(id: number, brand: InsertBrand): Promise<Brand>;
  deleteBrand(id: number): Promise<void>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getActiveCategories(): Promise<Category[]>; // Categorie con veicoli disponibili
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Rental Options
  getAllRentalOptions(): Promise<RentalOption[]>; // Tutte le opzioni di tutti i veicoli
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
  
  // Promo Management
  getPromoSettings(): Promise<PromoSettings | undefined>;
  updatePromoSettings(settings: InsertPromoSettings): Promise<PromoSettings>;
  getFeaturedPromos(): Promise<FeaturedPromo[]>;
  getFeaturedPromoVehicles(): Promise<Array<Vehicle & { displayOrder: number }>>;
  addVehicleToPromo(vehicleId: number, displayOrder?: number): Promise<FeaturedPromo>;
  removeVehicleFromPromo(vehicleId: number): Promise<void>;
  updatePromoOrder(promos: { vehicleId: number, displayOrder: number }[]): Promise<FeaturedPromo[]>;
  
  // Provinces (Province)
  getProvinces(): Promise<Province[]>;
  getActiveProvinces(): Promise<Province[]>;
  getProvince(id: number): Promise<Province | undefined>;
  createProvince(province: InsertProvince): Promise<Province>;
  updateProvince(id: number, province: InsertProvince): Promise<Province>;
  deleteProvince(id: number): Promise<void>;
  updateProvincesStatus(ids: number[], isActive: boolean): Promise<void>;
  
  // General Settings (Impostazioni Generali)
  getGeneralSettings(): Promise<GeneralSettings | undefined>;
  updateGeneralSettings(settings: InsertGeneralSettings): Promise<GeneralSettings>;
  
  // Security Settings (Impostazioni Sicurezza)
  getSecuritySettings(): Promise<SecuritySettings | undefined>;
  updateSecuritySettings(settings: InsertSecuritySettings): Promise<SecuritySettings>;
  
  // Activity Logs (Log Attività)
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;
  getActivityLogsByUser(userId: number, limit?: number): Promise<ActivityLog[]>;
  getActivityLogsByEntity(entityType: string, entityId: number, limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  
  // Password History (Storico Password)
  getPasswordHistory(userId: number): Promise<PasswordHistory[]>;
  addPasswordToHistory(userId: number, passwordHash: string): Promise<PasswordHistory>;
  cleanupPasswordHistory(userId: number, keep: number): Promise<void>;
  
  // Account Lockouts (Blocco Account)
  getAccountLockout(userId: number): Promise<AccountLockout | undefined>;
  createOrUpdateAccountLockout(userId: number, data: Partial<InsertAccountLockout>): Promise<AccountLockout>;
  deleteAccountLockout(userId: number): Promise<void>;
  
  // Password Resets (Reset Password)
  createPasswordReset(userId: number, token: string, expiresAt: Date): Promise<PasswordReset>;
  getPasswordResetByToken(token: string): Promise<PasswordReset | undefined>;
  markPasswordResetUsed(id: number): Promise<void>;
  cleanupExpiredPasswordResets(): Promise<void>;
  
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
  
  async getActiveBrands(): Promise<Brand[]> {
    // Questa query ottiene tutti i brand che hanno almeno un veicolo non assegnato
    const allVehicles = await this.getVehicles();
    
    // Filtra i veicoli per escludere quelli assegnati
    const availableVehicles = allVehicles.filter(vehicle => {
      if (!vehicle.badges) return true;
      
      // Se badges è una stringa, convertila in array
      const badges = typeof vehicle.badges === 'string' 
        ? JSON.parse(vehicle.badges as string) 
        : vehicle.badges;
        
      return !Array.isArray(badges) || !badges.includes("Assegnato");
    });
    
    // Estrai ID dei brand con veicoli disponibili
    const activeBrandIds = [...new Set(availableVehicles.map(v => v.brandId))];
    
    // Ottiene tutti i brand
    const allBrands = await this.getBrands();
    
    // Filtra i brand in base agli ID attivi
    return allBrands.filter(brand => activeBrandIds.includes(brand.id));
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
  
  async getActiveCategories(): Promise<Category[]> {
    // Questa query ottiene tutte le categorie che hanno almeno un veicolo non assegnato
    const allVehicles = await this.getVehicles();
    
    // Filtra i veicoli per escludere quelli assegnati
    const availableVehicles = allVehicles.filter(vehicle => {
      if (!vehicle.badges) return true;
      
      // Se badges è una stringa, convertila in array
      const badges = typeof vehicle.badges === 'string' 
        ? JSON.parse(vehicle.badges as string) 
        : vehicle.badges;
        
      return !Array.isArray(badges) || !badges.includes("Assegnato");
    });
    
    // Estrai ID delle categorie con veicoli disponibili
    const activeCategoryIds = [...new Set(availableVehicles.map(v => v.categoryId))];
    
    // Ottiene tutte le categorie
    const allCategories = await this.getCategories();
    
    // Filtra le categorie in base agli ID attivi
    return allCategories.filter(category => activeCategoryIds.includes(category.id));
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
      // Gestisci array di brandIds (selezione multipla)
      if (filters.brandIds) {
        try {
          // Se è una stringa (dal querystring), dividi per virgole
          const brandIds = typeof filters.brandIds === 'string' 
            ? filters.brandIds.split(',').map(id => parseInt(id))
            : filters.brandIds.map((id: string) => parseInt(id));
          
          if (brandIds.length > 0) {
            query = query.where(inArray(vehicles.brandId, brandIds));
          }
        } catch (error) {
          console.error('Errore nella gestione dei brandIds:', error);
        }
      } 
      // Compatibilità retroattiva con vecchio formato
      else if (filters.brandId) {
        query = query.where(eq(vehicles.brandId, parseInt(filters.brandId)));
      }
      
      // Gestisci array di categoryIds (selezione multipla)
      if (filters.categoryIds) {
        try {
          // Se è una stringa (dal querystring), dividi per virgole
          const categoryIds = typeof filters.categoryIds === 'string' 
            ? filters.categoryIds.split(',').map(id => parseInt(id))
            : filters.categoryIds.map((id: string) => parseInt(id));
          
          if (categoryIds.length > 0) {
            query = query.where(inArray(vehicles.categoryId, categoryIds));
          }
        } catch (error) {
          console.error('Errore nella gestione dei categoryIds:', error);
        }
      }
      // Compatibilità retroattiva con vecchio formato
      else if (filters.categoryId) {
        query = query.where(eq(vehicles.categoryId, parseInt(filters.categoryId)));
      }
      
      // Il filtro per il prezzo è stato rimosso poiché i prezzi di vendita non sono più utilizzati
      // Teniamo il codice commentato come riferimento
      /* if (filters.maxPrice) {
        query = query.where(lte(vehicles.price, parseInt(filters.maxPrice)));
      } */
      
      if (filters.year) {
        query = query.where(eq(vehicles.year, parseInt(filters.year)));
      }
      
      if (filters.fuelType) {
        query = query.where(eq(vehicles.fuelType, filters.fuelType));
      }
      
      if (filters.condition) {
        query = query.where(eq(vehicles.condition, filters.condition));
      }
    }
    
    // Esegui la query
    let result = await query;
    
    // Filtra i veicoli con il badge "Assegnato", a meno che non sia esplicitamente richiesto di visualizzarli
    if (!filters?.includeAssigned) {
      result = result.filter(vehicle => {
        if (!vehicle.badges) return true;
        
        // Se badges è una stringa, convertila in array
        const badges = typeof vehicle.badges === 'string' 
          ? JSON.parse(vehicle.badges as string) 
          : vehicle.badges;
          
        return !Array.isArray(badges) || !badges.includes("Assegnato");
      });
    }
    
    // Filtra per badge "Promo" se richiesto
    if (filters?.isPromo === 'true' || filters?.isPromo === true) {
      result = result.filter(vehicle => {
        if (!vehicle.badges) return false;
        
        // Se badges è una stringa, convertila in array
        const badges = typeof vehicle.badges === 'string' 
          ? JSON.parse(vehicle.badges as string) 
          : vehicle.badges;
          
        return Array.isArray(badges) && badges.includes("Promo");
      });
    }
    
    // Filtra per tipo di contratto (NLT, RTB, o entrambi)
    if (filters?.contractType) {
      // Prima otteniamo le opzioni di noleggio per tutti i veicoli in un'unica query
      const vehicleIds = result.map(v => v.id);
      
      if (vehicleIds.length > 0) {
        const allOptions = await db.select().from(rentalOptions)
          .where(inArray(rentalOptions.vehicleId, vehicleIds));
        
        // Mappa delle opzioni di noleggio per veicolo
        const optionsByVehicleId = new Map();
        
        allOptions.forEach(option => {
          if (!optionsByVehicleId.has(option.vehicleId)) {
            optionsByVehicleId.set(option.vehicleId, []);
          }
          optionsByVehicleId.get(option.vehicleId).push(option);
        });
        
        // Filtra i veicoli in base ai tipi di contratto
        result = result.filter(vehicle => {
          const options = optionsByVehicleId.get(vehicle.id) || [];
          
          if (filters.contractType === 'NLT') {
            return options.some(o => o.type === 'NLT');
          } else if (filters.contractType === 'RTB') {
            return options.some(o => o.type === 'RTB');
          } else if (filters.contractType === 'NLTRTB') {
            return options.some(o => o.type === 'NLT') && options.some(o => o.type === 'RTB');
          }
          
          return true;
        });
      }
    }
    
    return result;
  }
  
  async getFeaturedVehicles(): Promise<Vehicle[]> {
    try {
      // Ottiene le impostazioni delle promozioni
      const settings = await this.getPromoSettings();
      const maxVehicles = settings?.maxFeaturedVehicles || 16;
      
      // Ottiene i veicoli in promozione nell'ordine specificato dalla tabella featuredPromos
      const featuredPromoVehicles = await this.getFeaturedPromoVehicles();
      
      // Utilizziamo SOLO i veicoli che sono esplicitamente aggiunti alla tabella featuredPromos
      // Se non ci sono veicoli nella tabella, non mostriamo nulla
      return featuredPromoVehicles.slice(0, maxVehicles);
    } catch (error) {
      console.error("Errore nel recupero dei veicoli in evidenza:", error);
      return [];
    }
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
    let relatedVehicles = await db.select()
      .from(vehicles)
      .where(
        and(
          sql`${vehicles.id} != ${id}`,
          sql`(${vehicles.categoryId} = ${vehicle.categoryId} OR ${vehicles.brandId} = ${vehicle.brandId})`
        )
      )
      .limit(6); // Aumentiamo il limite per avere abbastanza veicoli dopo il filtro
    
    // Filtra i veicoli con il badge "Assegnato"
    relatedVehicles = relatedVehicles.filter(vehicle => {
      if (!vehicle.badges) return true;
      
      // Se badges è una stringa, convertila in array
      const badges = typeof vehicle.badges === 'string' 
        ? JSON.parse(vehicle.badges as string) 
        : vehicle.badges;
        
      return !Array.isArray(badges) || !badges.includes("Assegnato");
    });
    
    // Limita a 3 veicoli
    return relatedVehicles.slice(0, 3);
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
  
  async getAllRentalOptions(): Promise<RentalOption[]> {
    return db.select().from(rentalOptions);
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
  
  // Promo Management
  
  async getPromoSettings(): Promise<PromoSettings | undefined> {
    // Prova a ottenere le impostazioni esistenti
    const [settings] = await db.select().from(promoSettings);
    
    // Se non esistono impostazioni, crea quelle di default
    if (!settings) {
      return this.updatePromoSettings({ maxFeaturedVehicles: 16 });
    }
    
    return settings;
  }
  
  async updatePromoSettings(settings: InsertPromoSettings): Promise<PromoSettings> {
    // Verifica se esistono già delle impostazioni
    const existingSettings = await db.select().from(promoSettings);
    
    if (existingSettings.length === 0) {
      // Se non esistono, crea un nuovo record
      const [newSettings] = await db
        .insert(promoSettings)
        .values({
          ...settings,
          updatedAt: new Date()
        })
        .returning();
      return newSettings;
    } else {
      // Altrimenti aggiorna il record esistente
      const [updatedSettings] = await db
        .update(promoSettings)
        .set({
          ...settings,
          updatedAt: new Date()
        })
        .where(eq(promoSettings.id, existingSettings[0].id))
        .returning();
      return updatedSettings;
    }
  }
  
  async getFeaturedPromos(): Promise<FeaturedPromo[]> {
    return db
      .select()
      .from(featuredPromos)
      .orderBy(asc(featuredPromos.displayOrder));
  }
  
  async getFeaturedPromoVehicles(): Promise<Array<Vehicle & { displayOrder: number }>> {
    // Otteniamo tutte le promozioni in ordine
    const promos = await this.getFeaturedPromos();
    
    if (promos.length === 0) {
      return [];
    }
    
    // Estraiamo gli ID dei veicoli
    const vehicleIds = promos.map(promo => promo.vehicleId);
    
    // Otteniamo i veicoli
    const allVehicles = await db
      .select()
      .from(vehicles)
      .where(inArray(vehicles.id, vehicleIds));
    
    // Assegniamo l'ordine di visualizzazione a ciascun veicolo
    const result = allVehicles.map(vehicle => {
      const promo = promos.find(p => p.vehicleId === vehicle.id);
      return {
        ...vehicle,
        displayOrder: promo ? promo.displayOrder : 999
      };
    });
    
    // Ordiniamo in base all'ordine di visualizzazione
    return result.sort((a, b) => a.displayOrder - b.displayOrder);
  }
  
  async addVehicleToPromo(vehicleId: number, displayOrder?: number): Promise<FeaturedPromo> {
    // Verifica se il veicolo esiste
    const vehicle = await this.getVehicle(vehicleId);
    if (!vehicle) {
      throw new Error(`Vehicle with id ${vehicleId} not found`);
    }
    
    // Verifica se il veicolo è già in promo
    const existing = await db
      .select()
      .from(featuredPromos)
      .where(eq(featuredPromos.vehicleId, vehicleId));
    
    if (existing.length > 0) {
      // Se è già in promo, aggiorniamo solo l'ordine se specificato
      if (displayOrder !== undefined) {
        const [updated] = await db
          .update(featuredPromos)
          .set({ displayOrder, updatedAt: new Date() })
          .where(eq(featuredPromos.vehicleId, vehicleId))
          .returning();
        return updated;
      }
      return existing[0];
    }
    
    // Se non è specificato un ordine, mettilo alla fine
    let order = displayOrder;
    if (order === undefined) {
      const lastPromo = await db
        .select()
        .from(featuredPromos)
        .orderBy(desc(featuredPromos.displayOrder))
        .limit(1);
      
      order = lastPromo.length > 0 ? lastPromo[0].displayOrder + 1 : 0;
    }
    
    // Aggiungi il veicolo alle promozioni
    const [newPromo] = await db
      .insert(featuredPromos)
      .values({
        vehicleId,
        displayOrder: order,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    // Assicuriamoci che il veicolo abbia il badge "Promo"
    if (vehicle.badges) {
      const badges = typeof vehicle.badges === 'string'
        ? JSON.parse(vehicle.badges as string)
        : vehicle.badges;
      
      if (Array.isArray(badges) && !badges.includes("Promo")) {
        // Aggiungi il badge "Promo"
        badges.push("Promo");
        await this.updateVehicle(vehicleId, {
          ...vehicle,
          badges
        });
      }
    } else {
      // Se non ha badge, crea un array con "Promo"
      await this.updateVehicle(vehicleId, {
        ...vehicle,
        badges: ["Promo"]
      });
    }
    
    return newPromo;
  }
  
  async removeVehicleFromPromo(vehicleId: number): Promise<void> {
    // Rimuovi il veicolo dalle promozioni
    await db
      .delete(featuredPromos)
      .where(eq(featuredPromos.vehicleId, vehicleId));
    
    // Opzionalmente, rimuovi il badge "Promo" dal veicolo
    const vehicle = await this.getVehicle(vehicleId);
    if (vehicle && vehicle.badges) {
      const badges = typeof vehicle.badges === 'string'
        ? JSON.parse(vehicle.badges as string)
        : vehicle.badges;
      
      if (Array.isArray(badges) && badges.includes("Promo")) {
        // Rimuovi il badge "Promo"
        const newBadges = badges.filter(b => b !== "Promo");
        await this.updateVehicle(vehicleId, {
          ...vehicle,
          badges: newBadges
        });
      }
    }
  }
  
  async updatePromoOrder(promos: { vehicleId: number, displayOrder: number }[]): Promise<FeaturedPromo[]> {
    // Aggiorna l'ordine di ogni promo uno alla volta
    const results: FeaturedPromo[] = [];
    
    for (const promo of promos) {
      const [updated] = await db
        .update(featuredPromos)
        .set({ displayOrder: promo.displayOrder, updatedAt: new Date() })
        .where(eq(featuredPromos.vehicleId, promo.vehicleId))
        .returning();
      
      if (updated) {
        results.push(updated);
      }
    }
    
    // Ritorna tutte le promozioni nell'ordine aggiornato
    return this.getFeaturedPromos();
  }

  // METODI PER GESTIONE PROVINCE

  async getProvinces(): Promise<Province[]> {
    return db.select().from(provinces).orderBy(provinces.displayOrder);
  }

  async getActiveProvinces(): Promise<Province[]> {
    return db.select().from(provinces)
      .where(eq(provinces.isActive, true))
      .orderBy(provinces.displayOrder);
  }

  async getProvince(id: number): Promise<Province | undefined> {
    const [province] = await db.select().from(provinces).where(eq(provinces.id, id));
    return province;
  }

  async createProvince(province: InsertProvince): Promise<Province> {
    const [newProvince] = await db.insert(provinces).values(province).returning();
    return newProvince;
  }

  async updateProvince(id: number, province: InsertProvince): Promise<Province> {
    const [updatedProvince] = await db
      .update(provinces)
      .set(province)
      .where(eq(provinces.id, id))
      .returning();
    return updatedProvince;
  }

  async deleteProvince(id: number): Promise<void> {
    await db.delete(provinces).where(eq(provinces.id, id));
  }

  async updateProvincesStatus(ids: number[], isActive: boolean): Promise<void> {
    await db.update(provinces)
      .set({ isActive })
      .where(inArray(provinces.id, ids));
  }

  // METODI PER GENERAL SETTINGS

  async getGeneralSettings(): Promise<GeneralSettings | undefined> {
    const [settings] = await db.select().from(generalSettings).limit(1);
    return settings;
  }

  async updateGeneralSettings(settings: InsertGeneralSettings): Promise<GeneralSettings> {
    // Prima verifica se esiste già un record
    const existingSettings = await this.getGeneralSettings();
    
    if (existingSettings) {
      // Aggiorna il record esistente
      const [updatedSettings] = await db
        .update(generalSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(generalSettings.id, existingSettings.id))
        .returning();
      return updatedSettings;
    } else {
      // Crea un nuovo record se non esiste
      const [newSettings] = await db
        .insert(generalSettings)
        .values(settings)
        .returning();
      return newSettings;
    }
  }

  // METODI PER SECURITY SETTINGS

  async getSecuritySettings(): Promise<SecuritySettings | undefined> {
    const [settings] = await db.select().from(securitySettings).limit(1);
    return settings;
  }

  async updateSecuritySettings(settings: InsertSecuritySettings): Promise<SecuritySettings> {
    // Prima verifica se esiste già un record
    const existingSettings = await this.getSecuritySettings();
    
    if (existingSettings) {
      // Aggiorna il record esistente
      const [updatedSettings] = await db
        .update(securitySettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(securitySettings.id, existingSettings.id))
        .returning();
      return updatedSettings;
    } else {
      // Crea un nuovo record se non esiste
      const [newSettings] = await db
        .insert(securitySettings)
        .values(settings)
        .returning();
      return newSettings;
    }
  }

  // METODI PER ACTIVITY LOGS

  async getActivityLogs(limit: number = 100): Promise<ActivityLog[]> {
    return db.select().from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async getActivityLogsByUser(userId: number, limit: number = 100): Promise<ActivityLog[]> {
    return db.select().from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async getActivityLogsByEntity(entityType: string, entityId: number, limit: number = 100): Promise<ActivityLog[]> {
    return db.select().from(activityLogs)
      .where(and(
        eq(activityLogs.entityType, entityType),
        eq(activityLogs.entityId, entityId)
      ))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
  }

  // METODI PER PASSWORD HISTORY

  async getPasswordHistory(userId: number): Promise<PasswordHistory[]> {
    return db.select().from(passwordHistory)
      .where(eq(passwordHistory.userId, userId))
      .orderBy(desc(passwordHistory.createdAt));
  }

  async addPasswordToHistory(userId: number, passwordHash: string): Promise<PasswordHistory> {
    const [entry] = await db.insert(passwordHistory)
      .values({ userId, passwordHash })
      .returning();
    return entry;
  }

  async cleanupPasswordHistory(userId: number, keep: number): Promise<void> {
    // Ottiene tutti i record di password per l'utente
    const allPasswords = await this.getPasswordHistory(userId);
    
    // Se ci sono più record di quelli da mantenere
    if (allPasswords.length > keep) {
      // Identifica gli ID da eliminare (i più vecchi oltre il numero da mantenere)
      const idsToDelete = allPasswords
        .slice(keep)
        .map(entry => entry.id);
      
      // Elimina i record vecchi
      if (idsToDelete.length > 0) {
        await db.delete(passwordHistory)
          .where(inArray(passwordHistory.id, idsToDelete));
      }
    }
  }

  // METODI PER ACCOUNT LOCKOUTS

  async getAccountLockout(userId: number): Promise<AccountLockout | undefined> {
    const [lockout] = await db.select().from(accountLockouts)
      .where(eq(accountLockouts.userId, userId));
    return lockout;
  }

  async createOrUpdateAccountLockout(userId: number, data: Partial<InsertAccountLockout>): Promise<AccountLockout> {
    const existingLockout = await this.getAccountLockout(userId);
    
    if (existingLockout) {
      // Aggiorna il record esistente
      const [updatedLockout] = await db
        .update(accountLockouts)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(accountLockouts.userId, userId))
        .returning();
      return updatedLockout;
    } else {
      // Crea un nuovo record
      const [newLockout] = await db
        .insert(accountLockouts)
        .values({ userId, ...data })
        .returning();
      return newLockout;
    }
  }

  async deleteAccountLockout(userId: number): Promise<void> {
    await db.delete(accountLockouts)
      .where(eq(accountLockouts.userId, userId));
  }

  // METODI PER PASSWORD RESET

  async createPasswordReset(userId: number, token: string, expiresAt: Date): Promise<PasswordReset> {
    // Prima invalida tutti i reset precedenti per questo utente
    await db.update(passwordResets)
      .set({ isUsed: true })
      .where(eq(passwordResets.userId, userId));
    
    // Poi crea un nuovo token
    const [reset] = await db.insert(passwordResets)
      .values({ userId, token, expiresAt, isUsed: false })
      .returning();
    return reset;
  }

  async getPasswordResetByToken(token: string): Promise<PasswordReset | undefined> {
    const [reset] = await db.select().from(passwordResets)
      .where(and(
        eq(passwordResets.token, token),
        eq(passwordResets.isUsed, false)
      ));
    return reset;
  }

  async markPasswordResetUsed(id: number): Promise<void> {
    await db.update(passwordResets)
      .set({ isUsed: true })
      .where(eq(passwordResets.id, id));
  }

  async cleanupExpiredPasswordResets(): Promise<void> {
    // Elimina i token scaduti più vecchi di 7 giorni
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    await db.delete(passwordResets)
      .where(lt(passwordResets.expiresAt, sevenDaysAgo));
  }
  
  // Provinces Methods
  async getProvinces(): Promise<Province[]> {
    return db.select().from(provinces).orderBy(asc(provinces.displayOrder));
  }

  async getActiveProvinces(): Promise<Province[]> {
    return db.select().from(provinces).where(eq(provinces.isActive, true)).orderBy(asc(provinces.displayOrder));
  }

  async getProvince(id: number): Promise<Province | undefined> {
    const [province] = await db.select().from(provinces).where(eq(provinces.id, id));
    return province;
  }

  async createProvince(province: InsertProvince): Promise<Province> {
    // Trova il displayOrder massimo e aggiungi 1
    const maxOrderResult = await db
      .select({ maxOrder: sql`MAX(${provinces.displayOrder})` })
      .from(provinces);
    
    const maxOrder = maxOrderResult[0]?.maxOrder || 0;
    const newProvince = { ...province, displayOrder: province.displayOrder || maxOrder + 1 };
    
    const [createdProvince] = await db
      .insert(provinces)
      .values(newProvince)
      .returning();
    
    return createdProvince;
  }

  async updateProvince(id: number, province: InsertProvince): Promise<Province> {
    const [updatedProvince] = await db
      .update(provinces)
      .set(province)
      .where(eq(provinces.id, id))
      .returning();
    
    if (!updatedProvince) {
      throw new Error(`Province with id ${id} not found`);
    }
    
    return updatedProvince;
  }

  async deleteProvince(id: number): Promise<void> {
    await db.delete(provinces).where(eq(provinces.id, id));
  }

  async updateProvincesStatus(ids: number[], isActive: boolean): Promise<void> {
    if (ids.length === 0) return;
    
    await db
      .update(provinces)
      .set({ isActive })
      .where(inArray(provinces.id, ids));
  }
  
  // General Settings Methods
  async getGeneralSettings(): Promise<GeneralSettings | undefined> {
    const [settings] = await db.select().from(generalSettings).limit(1);
    return settings;
  }

  async updateGeneralSettings(settings: InsertGeneralSettings): Promise<GeneralSettings> {
    // Verifica se le impostazioni esistono già
    const existingSettings = await this.getGeneralSettings();
    
    if (existingSettings) {
      // Aggiorna le impostazioni esistenti
      const [updatedSettings] = await db
        .update(generalSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(generalSettings.id, existingSettings.id))
        .returning();
      
      return updatedSettings;
    } else {
      // Crea nuove impostazioni
      const [newSettings] = await db
        .insert(generalSettings)
        .values({ ...settings, updatedAt: new Date() })
        .returning();
      
      return newSettings;
    }
  }
  
  // Security Settings Methods
  async getSecuritySettings(): Promise<SecuritySettings | undefined> {
    const [settings] = await db.select().from(securitySettings).limit(1);
    return settings;
  }

  async updateSecuritySettings(settings: InsertSecuritySettings): Promise<SecuritySettings> {
    // Verifica se le impostazioni esistono già
    const existingSettings = await this.getSecuritySettings();
    
    if (existingSettings) {
      // Aggiorna le impostazioni esistenti
      const [updatedSettings] = await db
        .update(securitySettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(securitySettings.id, existingSettings.id))
        .returning();
      
      return updatedSettings;
    } else {
      // Crea nuove impostazioni
      const [newSettings] = await db
        .insert(securitySettings)
        .values({ ...settings, updatedAt: new Date() })
        .returning();
      
      return newSettings;
    }
  }
  
  // Activity Logs Methods
  async getActivityLogs(limit: number = 100): Promise<ActivityLog[]> {
    return db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async getActivityLogsByUser(userId: number, limit: number = 100): Promise<ActivityLog[]> {
    return db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async getActivityLogsByEntity(entityType: string, entityId: number, limit: number = 100): Promise<ActivityLog[]> {
    return db
      .select()
      .from(activityLogs)
      .where(and(
        eq(activityLogs.entityType, entityType),
        eq(activityLogs.entityId, entityId)
      ))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db
      .insert(activityLogs)
      .values({
        ...log,
        createdAt: new Date()
      })
      .returning();
    
    return newLog;
  }
  
  // Password History Methods
  async getPasswordHistory(userId: number): Promise<PasswordHistory[]> {
    return db
      .select()
      .from(passwordHistory)
      .where(eq(passwordHistory.userId, userId))
      .orderBy(desc(passwordHistory.createdAt));
  }

  async addPasswordToHistory(userId: number, passwordHash: string): Promise<PasswordHistory> {
    const [newHistory] = await db
      .insert(passwordHistory)
      .values({
        userId,
        passwordHash,
        createdAt: new Date()
      })
      .returning();
    
    return newHistory;
  }

  async cleanupPasswordHistory(userId: number, keep: number): Promise<void> {
    // Ottieni tutti i record di password per l'utente
    const allHistory = await this.getPasswordHistory(userId);
    
    // Se ci sono meno record di quanti ne vogliamo mantenere, non fare nulla
    if (allHistory.length <= keep) return;
    
    // Altrimenti, mantieni solo i 'keep' record più recenti
    const idsToKeep = allHistory.slice(0, keep).map(h => h.id);
    
    // Elimina tutti gli altri record
    await db
      .delete(passwordHistory)
      .where(and(
        eq(passwordHistory.userId, userId),
        sql`${passwordHistory.id} NOT IN (${idsToKeep.join(',')})`
      ));
  }
  
  // Account Lockout Methods
  async getAccountLockout(userId: number): Promise<AccountLockout | undefined> {
    const [lockout] = await db
      .select()
      .from(accountLockouts)
      .where(eq(accountLockouts.userId, userId));
    
    return lockout;
  }

  async createOrUpdateAccountLockout(userId: number, data: Partial<InsertAccountLockout>): Promise<AccountLockout> {
    const existingLockout = await this.getAccountLockout(userId);
    
    if (existingLockout) {
      // Aggiorna il lockout esistente
      const [updatedLockout] = await db
        .update(accountLockouts)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(accountLockouts.userId, userId))
        .returning();
      
      return updatedLockout;
    } else {
      // Crea un nuovo lockout
      const [newLockout] = await db
        .insert(accountLockouts)
        .values({
          userId,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return newLockout;
    }
  }

  async deleteAccountLockout(userId: number): Promise<void> {
    await db
      .delete(accountLockouts)
      .where(eq(accountLockouts.userId, userId));
  }
}