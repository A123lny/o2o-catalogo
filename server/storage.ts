import { 
  User, InsertUser, 
  Brand, InsertBrand, 
  Category, InsertCategory,
  Vehicle, InsertVehicle,
  RentalOption, InsertRentalOption,
  Request, InsertRequest
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { Store as SessionStore } from "express-session";

const MemoryStore = createMemoryStore(session);

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
  sessionStore: SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private brands: Map<number, Brand>;
  private categories: Map<number, Category>;
  private vehicles: Map<number, Vehicle>;
  private rentalOptions: Map<number, RentalOption>;
  private requests: Map<number, Request>;
  
  currentUserId: number;
  currentBrandId: number;
  currentCategoryId: number;
  currentVehicleId: number;
  currentRentalOptionId: number;
  currentRequestId: number;
  sessionStore: SessionStore;

  constructor() {
    this.users = new Map();
    this.brands = new Map();
    this.categories = new Map();
    this.vehicles = new Map();
    this.rentalOptions = new Map();
    this.requests = new Map();
    
    this.currentUserId = 1;
    this.currentBrandId = 1;
    this.currentCategoryId = 1;
    this.currentVehicleId = 1;
    this.currentRentalOptionId = 1;
    this.currentRequestId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Clear expired sessions every 24h
    });
    
    // Seed some initial data
    this.seedInitialData();
  }

  // User Operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const timestamp = new Date();
    // Ensure role is always present with default "user" if not specified
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: timestamp,
      role: insertUser.role || "user"
    };
    this.users.set(id, user);
    return user;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Brand Operations
  async getBrands(): Promise<Brand[]> {
    return Array.from(this.brands.values());
  }

  async getBrand(id: number): Promise<Brand | undefined> {
    return this.brands.get(id);
  }

  async createBrand(brand: InsertBrand): Promise<Brand> {
    const id = this.currentBrandId++;
    const newBrand: Brand = { ...brand, id };
    this.brands.set(id, newBrand);
    return newBrand;
  }

  async updateBrand(id: number, brand: InsertBrand): Promise<Brand> {
    const existingBrand = this.brands.get(id);
    if (!existingBrand) {
      throw new Error("Brand not found");
    }
    
    const updatedBrand: Brand = { ...brand, id };
    this.brands.set(id, updatedBrand);
    return updatedBrand;
  }

  async deleteBrand(id: number): Promise<void> {
    this.brands.delete(id);
  }

  // Category Operations
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async updateCategory(id: number, category: InsertCategory): Promise<Category> {
    const existingCategory = this.categories.get(id);
    if (!existingCategory) {
      throw new Error("Category not found");
    }
    
    const updatedCategory: Category = { ...category, id };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<void> {
    this.categories.delete(id);
  }

  // Vehicle Operations
  async getVehicles(filters?: any): Promise<Vehicle[]> {
    let filteredVehicles = Array.from(this.vehicles.values());
    
    if (filters) {
      if (filters.brandId) {
        filteredVehicles = filteredVehicles.filter(v => v.brandId === parseInt(filters.brandId));
      }
      
      if (filters.categoryId) {
        filteredVehicles = filteredVehicles.filter(v => v.categoryId === parseInt(filters.categoryId));
      }
      
      if (filters.maxPrice) {
        filteredVehicles = filteredVehicles.filter(v => {
          const price = v.discountPrice || v.price;
          return price <= parseInt(filters.maxPrice);
        });
      }
      
      if (filters.year) {
        filteredVehicles = filteredVehicles.filter(v => v.year === parseInt(filters.year));
      }
      
      if (filters.fuelType) {
        filteredVehicles = filteredVehicles.filter(v => v.fuelType === filters.fuelType);
      }
    }
    
    return filteredVehicles;
  }

  async getFeaturedVehicles(): Promise<Vehicle[]> {
    const allVehicles = Array.from(this.vehicles.values());
    // Get vehicles with "promo" or "new" badges
    const featuredVehicles = allVehicles.filter(vehicle => {
      if (!vehicle.badges) return false;
      const badges = vehicle.badges as string[];
      return badges.includes('promo') || badges.includes('new');
    });
    
    // Sort by creation date (newest first) and limit to 6
    return featuredVehicles
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async getAdminVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }

  async getRelatedVehicles(id: number): Promise<Vehicle[]> {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) return [];
    
    // Get vehicles with the same category or brand, excluding the current vehicle
    const relatedVehicles = Array.from(this.vehicles.values())
      .filter(v => v.id !== id && (v.categoryId === vehicle.categoryId || v.brandId === vehicle.brandId))
      .slice(0, 3);
    
    return relatedVehicles;
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.currentVehicleId++;
    const timestamp = new Date();
    const newVehicle: Vehicle = {
      ...vehicle,
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    this.vehicles.set(id, newVehicle);
    return newVehicle;
  }

  async updateVehicle(id: number, vehicle: InsertVehicle): Promise<Vehicle> {
    const existingVehicle = this.vehicles.get(id);
    if (!existingVehicle) {
      throw new Error("Vehicle not found");
    }
    
    const updatedVehicle: Vehicle = {
      ...vehicle,
      id,
      createdAt: existingVehicle.createdAt,
      updatedAt: new Date()
    };
    
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }

  async deleteVehicle(id: number): Promise<void> {
    this.vehicles.delete(id);
    
    // Delete related rental options
    const rentalOptionsToDelete = Array.from(this.rentalOptions.values())
      .filter(option => option.vehicleId === id);
    
    rentalOptionsToDelete.forEach(option => {
      this.rentalOptions.delete(option.id);
    });
  }

  async addVehicleImages(id: number, imageUrls: string[]): Promise<Vehicle> {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) {
      throw new Error("Vehicle not found");
    }
    
    // Append new images to existing ones
    const existingImages = vehicle.images ? (vehicle.images as string[]) : [];
    const updatedVehicle: Vehicle = {
      ...vehicle,
      images: [...existingImages, ...imageUrls],
      updatedAt: new Date()
    };
    
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }

  // Rental Option Operations
  async getRentalOptions(vehicleId: number): Promise<RentalOption[]> {
    return Array.from(this.rentalOptions.values())
      .filter(option => option.vehicleId === vehicleId);
  }

  async createRentalOption(option: InsertRentalOption): Promise<RentalOption> {
    const id = this.currentRentalOptionId++;
    const newOption: RentalOption = { ...option, id };
    
    // If this option is set as default, unset any other default options for this vehicle
    if (newOption.isDefault) {
      Array.from(this.rentalOptions.values())
        .filter(o => o.vehicleId === newOption.vehicleId && o.isDefault)
        .forEach(o => {
          const updatedOption = { ...o, isDefault: false };
          this.rentalOptions.set(o.id, updatedOption);
        });
    }
    
    this.rentalOptions.set(id, newOption);
    return newOption;
  }

  async updateRentalOption(id: number, option: InsertRentalOption): Promise<RentalOption> {
    const existingOption = this.rentalOptions.get(id);
    if (!existingOption) {
      throw new Error("Rental option not found");
    }
    
    const updatedOption: RentalOption = { ...option, id };
    
    // If this option is set as default, unset any other default options for this vehicle
    if (updatedOption.isDefault) {
      Array.from(this.rentalOptions.values())
        .filter(o => o.id !== id && o.vehicleId === updatedOption.vehicleId && o.isDefault)
        .forEach(o => {
          const updatedDefaultOption = { ...o, isDefault: false };
          this.rentalOptions.set(o.id, updatedDefaultOption);
        });
    }
    
    this.rentalOptions.set(id, updatedOption);
    return updatedOption;
  }

  async deleteRentalOption(id: number): Promise<void> {
    this.rentalOptions.delete(id);
  }

  // Request Operations
  async getRequests(): Promise<Request[]> {
    return Array.from(this.requests.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getRequest(id: number): Promise<Request | undefined> {
    return this.requests.get(id);
  }

  async createRequest(request: InsertRequest): Promise<Request> {
    const id = this.currentRequestId++;
    const timestamp = new Date();
    const newRequest: Request = {
      ...request,
      id,
      status: "new",
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    this.requests.set(id, newRequest);
    return newRequest;
  }

  async updateRequestStatus(id: number, status: string): Promise<Request> {
    const request = this.requests.get(id);
    if (!request) {
      throw new Error("Request not found");
    }
    
    const updatedRequest: Request = {
      ...request,
      status,
      updatedAt: new Date()
    };
    
    this.requests.set(id, updatedRequest);
    return updatedRequest;
  }

  async deleteRequest(id: number): Promise<void> {
    this.requests.delete(id);
  }

  // Stats
  async getStats(): Promise<any> {
    const totalVehicles = this.vehicles.size;
    const totalRequests = this.requests.size;
    const newRequests = Array.from(this.requests.values()).filter(r => r.status === "new").length;
    const inProgressRequests = Array.from(this.requests.values()).filter(r => r.status === "in_progress").length;
    const completedRequests = Array.from(this.requests.values()).filter(r => r.status === "completed").length;
    
    const vehiclesByCategory = Array.from(this.vehicles.values()).reduce((acc, vehicle) => {
      const categoryId = vehicle.categoryId;
      acc[categoryId] = (acc[categoryId] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const vehiclesByBrand = Array.from(this.vehicles.values()).reduce((acc, vehicle) => {
      const brandId = vehicle.brandId;
      acc[brandId] = (acc[brandId] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    return {
      totalVehicles,
      totalRequests,
      newRequests,
      inProgressRequests,
      completedRequests,
      vehiclesByCategory,
      vehiclesByBrand,
      recentRequests: Array.from(this.requests.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
    };
  }

  // Seed initial data
  private seedInitialData() {
    // Create admin user
    const adminUser: InsertUser = {
      username: "admin",
      password: "admin123", // Sarà hashata nel registro/login
      email: "admin@autoprestige.it",
      fullName: "Admin User",
      role: "admin"
    };
    // Usiamo una password già hashata per l'account admin
    adminUser.password = "2eb74e4eef9153ee4b6ef3a0f3b8a1cefd8dca44b4aa4b6c4c7d1dd3a43da8537fe6148ca1ac1ce54c5be5e99cb6fd39ceeff451662d4c1aee23cc7f3b5c018e.6a0d5b4ee8985c0c"; // corrisponde a "admin123"
    this.createUser(adminUser);
    
    // Create brands
    const brands: InsertBrand[] = [
      { name: "Audi", logo: "audi_logo.jpg" },
      { name: "BMW", logo: "bmw_logo.jpg" },
      { name: "Mercedes", logo: "mercedes_logo.jpg" },
      { name: "Porsche", logo: "porsche_logo.jpg" },
      { name: "Ferrari", logo: "ferrari_logo.jpg" }
    ];
    
    brands.forEach(brand => this.createBrand(brand));
    
    // Create categories
    const categories: InsertCategory[] = [
      { name: "SUV", image: "suv_category.jpg" },
      { name: "Sportive", image: "sportive_category.jpg" },
      { name: "Berline", image: "berline_category.jpg" },
      { name: "Cabrio", image: "cabrio_category.jpg" },
      { name: "Station Wagon", image: "stationwagon_category.jpg" },
      { name: "Elettriche", image: "elettriche_category.jpg" }
    ];
    
    categories.forEach(category => this.createCategory(category));
    
    // Create vehicles
    const vehicles: InsertVehicle[] = [
      {
        title: "Audi A7 Sportback",
        brandId: 1, // Audi
        model: "A7 Sportback S line 50 TDI quattro tiptronic",
        year: 2022,
        mileage: 15000,
        price: 82000,
        discountPrice: 75000,
        fuelType: "Diesel",
        transmission: "Automatico",
        power: 286,
        categoryId: 3, // Berline
        color: "Nero Mythos",
        interiorColor: "Pelle Nera",
        description: "L'Audi A7 Sportback rappresenta la perfetta fusione tra eleganza e sportività. Questa vettura esprime un carattere dinamico attraverso linee affilate e proporzioni atletiche, incarnando la filosofia di design Audi più recente. Il modello in offerta è equipaggiato con il potente motore 50 TDI da 286 CV, abbinato alla trazione integrale quattro e al cambio automatico tiptronic, garantendo prestazioni di altissimo livello con consumi contenuti. L'allestimento S line esalta ulteriormente il carattere sportivo della vettura, con dettagli estetici distintivi sia all'esterno che nell'abitacolo. Gli interni presentano finiture pregiate e tecnologie all'avanguardia, tra cui il sistema MMI Navigation plus con MMI touch response e l'Audi virtual cockpit.",
        condition: "Usato",
        features: [
          "Cerchi in lega da 20\" design 5 razze a V",
          "Fari LED Matrix HD con indicatori di direzione dinamici",
          "Pacchetto S line exterior",
          "Tetto panoramico apribile",
          "Vetri privacy",
          "Sedili anteriori sportivi riscaldabili e regolabili elettricamente",
          "Rivestimento in pelle Valcona",
          "Inserti decorativi in alluminio spazzolato",
          "Volante multifunzione plus in pelle traforata con bilancieri",
          "Pacchetto luci ambiente multicolore",
          "Audi virtual cockpit plus",
          "MMI Navigation plus con MMI touch response",
          "Bang & Olufsen Premium Sound System",
          "Audi smartphone interface",
          "Adaptive cruise control con Traffic Jam assist"
        ],
        badges: ["promo"],
        mainImage: "audi_a7_main.jpg",
        images: [
          "audi_a7_1.jpg",
          "audi_a7_2.jpg",
          "audi_a7_3.jpg",
          "audi_a7_4.jpg",
          "audi_a7_5.jpg"
        ]
      },
      {
        title: "BMW X5 xDrive",
        brandId: 2, // BMW
        model: "X5 xDrive40i M Sport",
        year: 2023,
        mileage: 0,
        price: 89000,
        discountPrice: null,
        fuelType: "Benzina",
        transmission: "Automatico",
        power: 340,
        categoryId: 1, // SUV
        color: "Bianco Alpino",
        interiorColor: "Pelle Nera",
        description: "BMW X5 xDrive40i M Sport. Vettura nuova, pronta consegna, full optional.",
        condition: "Nuovo",
        features: [
          "Cerchi in lega M da 21\"",
          "Fari LED adattivi",
          "Sospensioni adattive",
          "Tetto panoramico",
          "Cambio automatico Steptronic a 8 rapporti",
          "Sedili in pelle Dakota",
          "Head-up Display",
          "Sistema di navigazione Professional",
          "BMW Intelligent Personal Assistant",
          "BMW Live Cockpit Professional",
          "Harman Kardon Surround Sound System",
          "Parking Assistant Plus",
          "Driving Assistant Professional",
          "Pacchetto M Sport"
        ],
        badges: ["nuovo"],
        mainImage: "bmw_x5_main.jpg",
        images: [
          "bmw_x5_1.jpg",
          "bmw_x5_2.jpg",
          "bmw_x5_3.jpg",
          "bmw_x5_4.jpg"
        ]
      },
      {
        title: "Porsche 911 Carrera",
        brandId: 4, // Porsche
        model: "911 Carrera S Coupé",
        year: 2022,
        mileage: 6500,
        price: 145000,
        discountPrice: null,
        fuelType: "Benzina",
        transmission: "Automatico PDK",
        power: 450,
        categoryId: 2, // Sportive
        color: "Argento GT metallizzato",
        interiorColor: "Pelle Nera",
        description: "911 Carrera S Coupé. Pacchetto Sport Chrono, scarico sportivo, PASM.",
        condition: "Usato",
        features: [
          "Pacchetto Sport Chrono",
          "Scarico sportivo",
          "PASM (Porsche Active Suspension Management)",
          "Cerchi da 20\"/21\" Carrera S",
          "Fari a LED con Porsche Dynamic Light System Plus",
          "Interni in pelle",
          "Sedili sportivi Plus (4 vie)",
          "Porsche Communication Management (PCM)",
          "Sistema audio Bose® Surround Sound-System",
          "Volante sportivo GT multifunzione con paddle cambio",
          "ParkAssist anteriore e posteriore con telecamera di retromarcia",
          "Cruise control adattivo",
          "Porsche Entry & Drive"
        ],
        badges: [],
        mainImage: "porsche_911_main.jpg",
        images: [
          "porsche_911_1.jpg",
          "porsche_911_2.jpg",
          "porsche_911_3.jpg",
          "porsche_911_4.jpg"
        ]
      }
    ];
    
    vehicles.forEach(vehicle => this.createVehicle(vehicle));
    
    // Create rental options
    const rentalOptions: InsertRentalOption[] = [
      {
        vehicleId: 1, // Audi A7
        type: "NLT", // Noleggio a Lungo Termine
        deposit: 7500,
        duration: 48, // months
        annualMileage: 20000,
        monthlyPrice: 850,
        finalPayment: null,
        isDefault: true
      },
      {
        vehicleId: 1, // Audi A7
        type: "RTB", // Rent to Buy
        deposit: 9000,
        duration: 36, // months
        annualMileage: 15000,
        monthlyPrice: 920,
        finalPayment: 37500,
        isDefault: false
      },
      {
        vehicleId: 2, // BMW X5
        type: "RTB", // Rent to Buy
        deposit: 12000,
        duration: 36, // months
        annualMileage: 15000,
        monthlyPrice: 1050,
        finalPayment: 42000,
        isDefault: true
      },
      {
        vehicleId: 3, // Porsche 911
        type: "NLT", // Noleggio a Lungo Termine
        deposit: 18000,
        duration: 48, // months
        annualMileage: 10000,
        monthlyPrice: 1950,
        finalPayment: null,
        isDefault: true
      }
    ];
    
    rentalOptions.forEach(option => this.createRentalOption(option));
    
    // Create some requests
    const requests: InsertRequest[] = [
      {
        vehicleId: 1,
        fullName: "Marco Rossi",
        email: "m.rossi@email.it",
        phone: "+393331234567",
        interestType: "Noleggio a Lungo Termine",
        message: "Buongiorno, sarei interessato a questo modello. Potete fornirmi maggiori dettagli sulle opzioni di noleggio?"
      },
      {
        vehicleId: 2,
        fullName: "Giulia Bianchi",
        email: "g.bianchi@email.it",
        phone: "+393457654321",
        interestType: "Rent to Buy",
        message: "Salve, vorrei sapere se è possibile vedere il veicolo di persona e fare un test drive."
      }
    ];
    
    requests.forEach(request => this.createRequest(request));
  }
}

export const storage = new MemStorage();
