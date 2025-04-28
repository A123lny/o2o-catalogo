import { pgTable, text, serial, integer, jsonb, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

export type LoginData = Pick<InsertUser, 'username' | 'password'>;
