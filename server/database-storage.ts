import { 
  Brand, Category, InsertBrand, InsertCategory, InsertRentalOption, 
  InsertRequest, InsertUser, InsertVehicle, RentalOption, Request, 
  User, Vehicle, InsertPromoSettings, PromoSettings, 
  InsertFeaturedPromo, FeaturedPromo, Province, InsertProvince,
  GeneralSettings, InsertGeneralSettings, SecuritySettings, InsertSecuritySettings,
  ActivityLog, InsertActivityLog, PasswordHistory, AccountLockout, InsertAccountLockout,
  PasswordReset, InsertPasswordReset, InsertPasswordHistory, TwoFactorAuth, InsertTwoFactorAuth,
  EmailConfig, InsertEmailConfig, EmailTemplate, InsertEmailTemplate,
  TwilioConfig, InsertTwilioConfig, SocialLoginConfig, InsertSocialLoginConfig,
  PaymentConfig, InsertPaymentConfig
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
  passwordHistory, accountLockouts, passwordResets, twoFactorAuth,
  emailConfig, emailTemplates, twilioConfig, socialLoginConfig, paymentConfig
} from "@shared/schema";

// PostgreSQL session store
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByProfileId(profileId: string, provider: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: number, newPasswordHash: string): Promise<User | undefined>;
  updateUserSocialProfile(userId: number, data: { profileId: string, provider: string }): Promise<User>;
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
  
  // 2FA (Autenticazione a due fattori)
  getUserTwoFactorAuth(userId: number): Promise<TwoFactorAuth | undefined>;
  createTwoFactorAuth(data: InsertTwoFactorAuth): Promise<TwoFactorAuth>;
  updateTwoFactorAuth(userId: number, data: Partial<InsertTwoFactorAuth>): Promise<TwoFactorAuth>;
  deleteTwoFactorAuth(userId: number): Promise<void>;
  verify2FAToken(userId: number, token: string): Promise<boolean>;
  useBackupCode(userId: number, code: string): Promise<boolean>;
  
  // Integrations - Email
  getEmailConfig(): Promise<EmailConfig | undefined>;
  saveEmailConfig(config: InsertEmailConfig): Promise<EmailConfig>;
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(name: string): Promise<EmailTemplate | undefined>;
  saveEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  sendEmail(to: string, templateName: string, data?: Record<string, any>): Promise<boolean>;
  
  // Integrations - Twilio
  getTwilioConfig(): Promise<TwilioConfig | undefined>;
  saveTwilioConfig(config: InsertTwilioConfig): Promise<TwilioConfig>;
  sendSMS(to: string, message: string): Promise<boolean>;
  startPhoneVerification(phoneNumber: string): Promise<boolean>;
  checkPhoneVerification(phoneNumber: string, code: string): Promise<boolean>;
  
  // Integrations - Social Login
  getSocialLoginConfigs(): Promise<SocialLoginConfig[]>;
  getSocialLoginConfig(provider: string): Promise<SocialLoginConfig | undefined>;
  saveSocialLoginConfig(config: InsertSocialLoginConfig): Promise<SocialLoginConfig>;
  
  // Integrations - Payment
  getPaymentConfigs(): Promise<PaymentConfig[]>;
  getPaymentConfig(provider: string): Promise<PaymentConfig | undefined>;
  savePaymentConfig(config: InsertPaymentConfig): Promise<PaymentConfig>;
  
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
  
  async getUserByProfileId(profileId: string, provider: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.profileId, profileId),
            eq(users.provider, provider)
          )
        );
      return user;
    } catch (error) {
      console.error(`Error getting user by profile ID: ${profileId}`, error);
      return undefined;
    }
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUserSocialProfile(userId: number, data: { profileId: string, provider: string }): Promise<User> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          profileId: data.profileId,
          provider: data.provider
        })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        throw new Error(`User with id ${userId} not found`);
      }
      
      return updatedUser;
    } catch (error) {
      console.error(`Error updating user social profile: ${userId}`, error);
      throw error;
    }
  }
  
  async updateUserPassword(id: number, newPasswordHash: string): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ password: newPasswordHash })
        .where(eq(users.id, id))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user password:', error);
      throw error;
    }
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

  // 2FA Implementation
  async getUserTwoFactorAuth(userId: number): Promise<TwoFactorAuth | undefined> {
    const [twoFactor] = await db.select().from(twoFactorAuth).where(eq(twoFactorAuth.userId, userId));
    return twoFactor;
  }

  async createTwoFactorAuth(data: InsertTwoFactorAuth): Promise<TwoFactorAuth> {
    const [twoFactor] = await db
      .insert(twoFactorAuth)
      .values(data)
      .returning();
    return twoFactor;
  }

  async updateTwoFactorAuth(userId: number, data: Partial<InsertTwoFactorAuth>): Promise<TwoFactorAuth> {
    const [updatedTwoFactor] = await db
      .update(twoFactorAuth)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(twoFactorAuth.userId, userId))
      .returning();

    if (!updatedTwoFactor) {
      throw new Error(`Two-factor authentication for user ${userId} not found`);
    }

    return updatedTwoFactor;
  }

  async deleteTwoFactorAuth(userId: number): Promise<void> {
    await db.delete(twoFactorAuth).where(eq(twoFactorAuth.userId, userId));
  }

  async verify2FAToken(userId: number, token: string): Promise<boolean> {
    // Il controllo effettivo del token verrà gestito nel controller usando speakeasy
    // Qui restituiamo solo i dati 2FA dell'utente
    const twoFactorData = await this.getUserTwoFactorAuth(userId);
    return !!twoFactorData; // Questo verrà modificato nella logica di autenticazione
  }

  async useBackupCode(userId: number, code: string): Promise<boolean> {
    const twoFactorData = await this.getUserTwoFactorAuth(userId);
    
    if (!twoFactorData || !twoFactorData.backupCodes) {
      return false;
    }
    
    // Ottieni i codici di backup (potrebbero essere memorizzati come JSON)
    let backupCodes: string[] = Array.isArray(twoFactorData.backupCodes) 
      ? twoFactorData.backupCodes 
      : JSON.parse(twoFactorData.backupCodes as string);
    
    // Verifica se il codice è presente
    const codeIndex = backupCodes.indexOf(code);
    if (codeIndex === -1) {
      return false;
    }
    
    // Rimuovi il codice utilizzato dall'array
    backupCodes.splice(codeIndex, 1);
    
    // Aggiorna i codici di backup
    await this.updateTwoFactorAuth(userId, {
      backupCodes: backupCodes as any
    });
    
    return true;
  }

  // Implementazione metodi integrations - Email
  async getEmailConfig(): Promise<EmailConfig | undefined> {
    try {
      const results = await db.select().from(emailConfig).limit(1);
      return results.length > 0 ? results[0] : undefined;
    } catch (error) {
      console.error("Error getting email config:", error);
      return undefined;
    }
  }
  
  async saveEmailConfig(config: InsertEmailConfig): Promise<EmailConfig> {
    try {
      // Controlla se esiste già una configurazione
      const existingConfig = await this.getEmailConfig();
      
      if (existingConfig) {
        // Update existing config
        const [updatedConfig] = await db
          .update(emailConfig)
          .set({
            ...config,
            updatedAt: new Date()
          })
          .where(eq(emailConfig.id, existingConfig.id))
          .returning();
        return updatedConfig;
      } else {
        // Create new config
        const [newConfig] = await db
          .insert(emailConfig)
          .values({
            ...config,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        return newConfig;
      }
    } catch (error) {
      console.error("Error saving email config:", error);
      throw error;
    }
  }
  
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      return await db.select().from(emailTemplates);
    } catch (error) {
      console.error("Error getting email templates:", error);
      return [];
    }
  }
  
  async getEmailTemplate(name: string): Promise<EmailTemplate | undefined> {
    try {
      const results = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.name, name));
      return results.length > 0 ? results[0] : undefined;
    } catch (error) {
      console.error(`Error getting email template "${name}":`, error);
      return undefined;
    }
  }
  
  async saveEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    try {
      // Controlla se il template esiste già
      const existingTemplate = await this.getEmailTemplate(template.name);
      
      if (existingTemplate) {
        // Update existing template
        const [updatedTemplate] = await db
          .update(emailTemplates)
          .set({
            ...template,
            updatedAt: new Date()
          })
          .where(eq(emailTemplates.id, existingTemplate.id))
          .returning();
        return updatedTemplate;
      } else {
        // Create new template
        const [newTemplate] = await db
          .insert(emailTemplates)
          .values({
            ...template,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        return newTemplate;
      }
    } catch (error) {
      console.error("Error saving email template:", error);
      throw error;
    }
  }
  
  async sendEmail(to: string, templateName: string, data?: Record<string, any>): Promise<boolean> {
    try {
      const config = await this.getEmailConfig();
      if (!config || !config.enabled) {
        console.warn("Email is not configured or disabled");
        return false;
      }
      
      const template = await this.getEmailTemplate(templateName);
      if (!template) {
        console.warn(`Email template "${templateName}" not found`);
        return false;
      }
      
      // Sostituisce le variabili nel template (semplice sostituzione a stringa)
      let subject = template.subject;
      let body = template.body;
      
      if (data) {
        for (const [key, value] of Object.entries(data)) {
          const placeholder = `{{${key}}}`;
          subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
          body = body.replace(new RegExp(placeholder, 'g'), String(value));
        }
      }
      
      // In un'implementazione reale, qui ci sarebbe il codice per inviare l'email
      // tramite nodemailer o SendGrid in base alla configurazione
      
      console.log(`[MOCK] Email sent to ${to} with subject "${subject}"`);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }
  
  // Implementazione metodi integrations - Twilio
  async getTwilioConfig(): Promise<TwilioConfig | undefined> {
    try {
      const results = await db.select().from(twilioConfig).limit(1);
      return results.length > 0 ? results[0] : undefined;
    } catch (error) {
      console.error("Error getting Twilio config:", error);
      return undefined;
    }
  }
  
  async saveTwilioConfig(config: InsertTwilioConfig): Promise<TwilioConfig> {
    try {
      // Controlla se esiste già una configurazione
      const existingConfig = await this.getTwilioConfig();
      
      if (existingConfig) {
        // Update existing config
        const [updatedConfig] = await db
          .update(twilioConfig)
          .set({
            ...config,
            updatedAt: new Date()
          })
          .where(eq(twilioConfig.id, existingConfig.id))
          .returning();
        return updatedConfig;
      } else {
        // Create new config
        const [newConfig] = await db
          .insert(twilioConfig)
          .values({
            ...config,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        return newConfig;
      }
    } catch (error) {
      console.error("Error saving Twilio config:", error);
      throw error;
    }
  }
  
  // Social Login Configuration Methods
  // Questi metodi sono utilizzati sia per il frontend che per l'autenticazione
  async getSocialLoginConfigs(): Promise<SocialLoginConfig[]> {
    try {
      return await db.select().from(socialLoginConfig);
    } catch (error) {
      console.error("Error getting social login configs:", error);
      return [];
    }
  }
  
  async getSocialLoginConfig(provider: string): Promise<SocialLoginConfig | undefined> {
    try {
      const results = await db
        .select()
        .from(socialLoginConfig)
        .where(eq(socialLoginConfig.provider, provider))
        .limit(1);
      
      return results.length > 0 ? results[0] : undefined;
    } catch (error) {
      console.error(`Error getting social login config for ${provider}:`, error);
      return undefined;
    }
  }
  
  async saveSocialLoginConfig(config: InsertSocialLoginConfig): Promise<SocialLoginConfig> {
    try {
      // Controlla se esiste già una configurazione per questo provider
      const existingConfig = await this.getSocialLoginConfig(config.provider);
      
      if (existingConfig) {
        // Update existing config
        const [updatedConfig] = await db
          .update(socialLoginConfig)
          .set({
            ...config,
            updatedAt: new Date()
          })
          .where(eq(socialLoginConfig.id, existingConfig.id))
          .returning();
        return updatedConfig;
      } else {
        // Create new config
        const [newConfig] = await db
          .insert(socialLoginConfig)
          .values({
            ...config,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        return newConfig;
      }
    } catch (error) {
      console.error(`Error saving social login config for ${config.provider}:`, error);
      throw error;
    }
  }
  
  // Metodi per gli utenti collegati tramite social login
  async getUserByProfileId(profileId: string, provider: string): Promise<User | undefined> {
    try {
      const results = await db
        .select()
        .from(users)
        .where(and(
          eq(users.profileId, profileId),
          eq(users.provider, provider)
        ))
        .limit(1);
      
      return results.length > 0 ? results[0] : undefined;
    } catch (error) {
      console.error(`Error getting user by profile ID ${profileId}:`, error);
      return undefined;
    }
  }
  
  async updateUserSocialProfile(userId: number, profileId: string, provider: string): Promise<User> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          profileId,
          provider,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error(`Error updating user ${userId} social profile:`, error);
      throw error;
    }
  }
  
  async createUserFromSocialProfile(userData: {
    username: string;
    email: string;
    fullName: string;
    profileId: string;
    provider: string;
  }): Promise<User> {
    try {
      // Crea un nuovo utente con password casuale (non verrà mai usata poiché l'utente accede via OAuth)
      const randomPassword = randomBytes(16).toString('hex');
      const hashedPassword = await hashPassword(randomPassword);
      
      const [newUser] = await db
        .insert(users)
        .values({
          ...userData,
          password: hashedPassword,
          role: 'user', // Ruolo predefinito per gli utenti social
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return newUser;
    } catch (error) {
      console.error(`Error creating user from social profile:`, error);
      throw error;
    }
  }
  
  async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      const config = await this.getTwilioConfig();
      if (!config || !config.enabled) {
        console.warn("Twilio is not configured or disabled");
        return false;
      }
      
      // In un'implementazione reale, qui ci sarebbe il codice per inviare SMS con Twilio
      console.log(`[MOCK] SMS sent to ${to}: "${message}"`);
      return true;
    } catch (error) {
      console.error("Error sending SMS:", error);
      return false;
    }
  }
  
  async startPhoneVerification(phoneNumber: string): Promise<boolean> {
    try {
      const config = await this.getTwilioConfig();
      if (!config || !config.enabled) {
        console.warn("Twilio is not configured or disabled");
        return false;
      }
      
      // In un'implementazione reale, qui ci sarebbe il codice per avviare la verifica con Twilio Verify
      console.log(`[MOCK] Started phone verification for ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error("Error starting phone verification:", error);
      return false;
    }
  }
  
  async checkPhoneVerification(phoneNumber: string, code: string): Promise<boolean> {
    try {
      const config = await this.getTwilioConfig();
      if (!config || !config.enabled) {
        console.warn("Twilio is not configured or disabled");
        return false;
      }
      
      // In un'implementazione reale, qui ci sarebbe il codice per verificare il codice con Twilio Verify
      console.log(`[MOCK] Verified code ${code} for ${phoneNumber}`);
      
      // Simulazione di verifica riuscita se il codice è "123456"
      return code === "123456";
    } catch (error) {
      console.error("Error checking phone verification:", error);
      return false;
    }
  }
  
  // Implementazione metodi integrations - Payment
  async getPaymentConfigs(): Promise<PaymentConfig[]> {
    try {
      return await db.select().from(paymentConfig);
    } catch (error) {
      console.error("Error getting payment configs:", error);
      return [];
    }
  }
  
  async getPaymentConfig(provider: string): Promise<PaymentConfig | undefined> {
    try {
      const results = await db
        .select()
        .from(paymentConfig)
        .where(eq(paymentConfig.provider, provider));
      return results.length > 0 ? results[0] : undefined;
    } catch (error) {
      console.error(`Error getting payment config for "${provider}":`, error);
      return undefined;
    }
  }
  
  async savePaymentConfig(config: InsertPaymentConfig): Promise<PaymentConfig> {
    try {
      // Controlla se esiste già una configurazione per questo provider
      const existingConfig = await this.getPaymentConfig(config.provider);
      
      if (existingConfig) {
        // Update existing config
        const [updatedConfig] = await db
          .update(paymentConfig)
          .set({
            ...config,
            updatedAt: new Date()
          })
          .where(eq(paymentConfig.id, existingConfig.id))
          .returning();
        return updatedConfig;
      } else {
        // Create new config
        const [newConfig] = await db
          .insert(paymentConfig)
          .values({
            ...config,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        return newConfig;
      }
    } catch (error) {
      console.error("Error saving payment config:", error);
      throw error;
    }
  }
}