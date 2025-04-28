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