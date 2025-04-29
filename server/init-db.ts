import { db } from './db';
import { pool } from './db';
import * as schema from '@shared/schema';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { pgTable, text, serial, integer, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";

async function initializeDatabase() {
  try {
    console.log('Inizializzazione del database...');

    // Elimina le tabelle se esistono
    await pool.query(`
      DROP TABLE IF EXISTS password_resets CASCADE;
      DROP TABLE IF EXISTS account_lockouts CASCADE;
      DROP TABLE IF EXISTS activity_logs CASCADE;
      DROP TABLE IF EXISTS password_history CASCADE;
      DROP TABLE IF EXISTS featured_promos CASCADE;
      DROP TABLE IF EXISTS promo_settings CASCADE;
      DROP TABLE IF EXISTS security_settings CASCADE;
      DROP TABLE IF EXISTS general_settings CASCADE;
      DROP TABLE IF EXISTS provinces CASCADE;
      DROP TABLE IF EXISTS rental_options CASCADE;
      DROP TABLE IF EXISTS requests CASCADE;
      DROP TABLE IF EXISTS vehicles CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS brands CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    console.log('Tabelle eliminate con successo');

    // Crea le tabelle dal modello aggiornato
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        logo TEXT
      );

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        image TEXT
      );

      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        brand_id INTEGER NOT NULL,
        model TEXT NOT NULL,
        year INTEGER NOT NULL,
        mileage INTEGER NOT NULL,
        fuel_type TEXT NOT NULL,
        transmission TEXT NOT NULL,
        power INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        color TEXT NOT NULL,
        interior_color TEXT,
        description TEXT NOT NULL,
        condition TEXT NOT NULL,
        features JSONB,
        badges JSONB,
        main_image TEXT,
        images JSONB,
        featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS rental_options (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        deposit INTEGER NOT NULL,
        caution INTEGER,
        setup_fee INTEGER,
        duration INTEGER NOT NULL,
        annual_mileage INTEGER,
        monthly_price INTEGER NOT NULL,
        final_payment INTEGER,
        is_default BOOLEAN DEFAULT FALSE,
        included_services JSONB
      );

      CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        province TEXT NOT NULL,
        is_company BOOLEAN DEFAULT FALSE,
        company_name TEXT,
        vat_number TEXT,
        interest_type TEXT NOT NULL,
        message TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS promo_settings (
        id SERIAL PRIMARY KEY,
        max_featured_vehicles INTEGER NOT NULL DEFAULT 16,
        show_on_homepage BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS featured_promos (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS provinces (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        code TEXT NOT NULL UNIQUE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS general_settings (
        id SERIAL PRIMARY KEY,
        site_name TEXT NOT NULL DEFAULT 'o2o Mobility',
        site_description TEXT,
        contact_email TEXT,
        phone_number TEXT,
        address TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS security_settings (
        id SERIAL PRIMARY KEY,
        password_min_length INTEGER NOT NULL DEFAULT 8,
        password_require_uppercase BOOLEAN NOT NULL DEFAULT TRUE,
        password_require_lowercase BOOLEAN NOT NULL DEFAULT TRUE,
        password_require_number BOOLEAN NOT NULL DEFAULT TRUE,
        password_require_special_char BOOLEAN NOT NULL DEFAULT TRUE,
        password_expiry_days INTEGER NOT NULL DEFAULT 90,
        password_history_count INTEGER NOT NULL DEFAULT 5,
        enable_2fa BOOLEAN NOT NULL DEFAULT FALSE,
        failed_login_attempts INTEGER NOT NULL DEFAULT 5,
        lockout_duration_minutes INTEGER NOT NULL DEFAULT 30,
        session_timeout_minutes INTEGER NOT NULL DEFAULT 60,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS password_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id INTEGER,
        details JSONB,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS account_lockouts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        last_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        locked_until TIMESTAMP WITH TIME ZONE
      );
      
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    console.log('Tabelle create con successo');
    console.log('Database inizializzato con successo!');
  } catch (error) {
    console.error('Errore durante l\'inizializzazione del database:', error);
  } finally {
    await pool.end();
  }
}

initializeDatabase().then(() => console.log('Operazione completata'));