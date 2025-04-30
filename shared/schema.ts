import { pgTable, text, serial, integer, jsonb, boolean, date, timestamp, real, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User and Auth tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Brands table
export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  logo: text("logo"),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  image: text("image"),
});

// Vehicles table
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  brandId: integer("brand_id").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  mileage: integer("mileage").notNull(),
  fuelType: text("fuel_type").notNull(),
  transmission: text("transmission").notNull(),
  power: integer("power").notNull(),
  categoryId: integer("category_id").notNull(),
  color: text("color").notNull(),
  interiorColor: text("interior_color"),
  description: text("description").notNull(),
  condition: text("condition").notNull(),
  features: jsonb("features"),
  badges: jsonb("badges"),
  mainImage: text("main_image"),
  images: jsonb("images"),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Rental options table
export const rentalOptions = pgTable("rental_options", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  type: text("type").notNull(), // NLT or RTB
  deposit: integer("deposit").notNull(),
  caution: integer("caution"), // Deposito cauzionale
  setupFee: integer("setup_fee"), // Spese di istruttoria
  duration: integer("duration").notNull(), // in months
  annualMileage: integer("annual_mileage"),
  monthlyPrice: integer("monthly_price").notNull(),
  finalPayment: integer("final_payment"), // for RTB
  isDefault: boolean("is_default").default(false),
  includedServices: jsonb("included_services"), // Array of services included in the contract
});

// Information requests table
export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  province: text("province").notNull(),
  isCompany: boolean("is_company").default(false),
  companyName: text("company_name"),
  vatNumber: text("vat_number"),
  interestType: text("interest_type").notNull(),
  message: text("message"),
  status: text("status").notNull().default("new"), // new, in_progress, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Promo settings and featured vehicles order
export const promoSettings = pgTable("promo_settings", {
  id: serial("id").primaryKey(),
  maxFeaturedVehicles: integer("max_featured_vehicles").notNull().default(16),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Featured promo vehicles with order
export const featuredPromos = pgTable("featured_promos", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull().unique(),
  displayOrder: integer("display_order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  featuredPromo: many(featuredPromos),
}));

export const featuredPromosRelations = relations(featuredPromos, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [featuredPromos.vehicleId],
    references: [vehicles.id],
  }),
}));

// NUOVE TABELLE PER LE IMPOSTAZIONI

// Gestione delle province
export const provinces = pgTable("provinces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(), // Codice provincia (2 caratteri)
  isActive: boolean("is_active").default(true).notNull(),
  displayOrder: integer("display_order").notNull(),
});

// Impostazioni generali del sito
export const generalSettings = pgTable("general_settings", {
  id: serial("id").primaryKey(),
  siteName: text("site_name").notNull().default("O2O Mobility"),
  logoPath: text("logo_path"),
  primaryColor: text("primary_color").default("#3b82f6"),
  secondaryColor: text("secondary_color").default("#f97316"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  vatNumber: text("vat_number"),
  socialFacebook: text("social_facebook"),
  socialInstagram: text("social_instagram"),
  socialLinkedin: text("social_linkedin"),
  footerText: text("footer_text"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Impostazioni di sicurezza
export const securitySettings = pgTable("security_settings", {
  id: serial("id").primaryKey(),
  passwordExpiryDays: integer("password_expiry_days").default(90),
  minPasswordLength: integer("min_password_length").default(8),
  requireUppercase: boolean("require_uppercase").default(true),
  requireLowercase: boolean("require_lowercase").default(true),
  requireNumber: boolean("require_number").default(true),
  requireSpecialChar: boolean("require_special_char").default(true),
  passwordHistoryCount: integer("password_history_count").default(5),
  enable2FA: boolean("enable_2fa").default(false),
  failedLoginAttempts: integer("failed_login_attempts").default(5),
  lockoutDurationMinutes: integer("lockout_duration_minutes").default(30),
  autoLogoutMinutes: integer("auto_logout_minutes").default(30),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Storico delle password per controllare il riutilizzo
export const passwordHistory = pgTable("password_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Registro delle attività degli utenti (audit log)
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(), // vehicle, brand, category, user, etc.
  entityId: integer("entity_id"), // ID dell'entità coinvolta (può essere null)
  details: jsonb("details"), // Dettagli aggiuntivi in formato JSON
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Blocco degli account dopo tentativi falliti
export const accountLockouts = pgTable("account_lockouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  failedAttempts: integer("failed_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
  lastFailedAttempt: timestamp("last_failed_attempt"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabella per le richieste di reset password
export const passwordResets = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// SCHEMAS

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  role: true,
});

export const insertBrandSchema = createInsertSchema(brands).pick({
  name: true,
  logo: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  image: true,
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRentalOptionSchema = createInsertSchema(rentalOptions).omit({
  id: true,
});

export const insertRequestSchema = createInsertSchema(requests).pick({
  vehicleId: true,
  fullName: true,
  email: true,
  phone: true,
  province: true,
  isCompany: true,
  companyName: true,
  vatNumber: true,
  interestType: true,
  message: true,
});

// TYPES

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type Brand = typeof brands.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

export type InsertRentalOption = z.infer<typeof insertRentalOptionSchema>;
export type RentalOption = typeof rentalOptions.$inferSelect;

export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requests.$inferSelect;

export const insertPromoSettingsSchema = createInsertSchema(promoSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertFeaturedPromoSchema = createInsertSchema(featuredPromos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPromoSettings = z.infer<typeof insertPromoSettingsSchema>;
export type PromoSettings = typeof promoSettings.$inferSelect;

export type InsertFeaturedPromo = z.infer<typeof insertFeaturedPromoSchema>;
export type FeaturedPromo = typeof featuredPromos.$inferSelect;

// Schemi per le nuove tabelle
export const insertProvinceSchema = createInsertSchema(provinces).omit({
  id: true,
});

export const insertGeneralSettingsSchema = createInsertSchema(generalSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertSecuritySettingsSchema = createInsertSchema(securitySettings).omit({
  id: true,
  updatedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertPasswordHistorySchema = createInsertSchema(passwordHistory).omit({
  id: true,
  createdAt: true,
});

export const insertAccountLockoutSchema = createInsertSchema(accountLockouts).omit({
  id: true,
  updatedAt: true,
});

export const insertPasswordResetSchema = createInsertSchema(passwordResets).omit({
  id: true,
  createdAt: true,
});

// Tipi per le nuove tabelle
export type InsertProvince = z.infer<typeof insertProvinceSchema>;
export type Province = typeof provinces.$inferSelect;

export type InsertGeneralSettings = z.infer<typeof insertGeneralSettingsSchema>;
export type GeneralSettings = typeof generalSettings.$inferSelect;

export type InsertSecuritySettings = z.infer<typeof insertSecuritySettingsSchema>;
export type SecuritySettings = typeof securitySettings.$inferSelect;

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

export type InsertPasswordHistory = z.infer<typeof insertPasswordHistorySchema>;
export type PasswordHistory = typeof passwordHistory.$inferSelect;

export type InsertAccountLockout = z.infer<typeof insertAccountLockoutSchema>;
export type AccountLockout = typeof accountLockouts.$inferSelect;

export type InsertPasswordReset = z.infer<typeof insertPasswordResetSchema>;
export type PasswordReset = typeof passwordResets.$inferSelect;

export type LoginData = Pick<InsertUser, 'username' | 'password'>;
