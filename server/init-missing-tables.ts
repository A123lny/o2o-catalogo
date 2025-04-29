import { db } from './db';
import {
  provinces,
  generalSettings,
  securitySettings,
  activityLogs,
  passwordHistory,
  accountLockouts,
  passwordResets,
} from '@shared/schema';

async function initializeMissingTables() {
  console.log("Inizializzazione delle tabelle mancanti...");

  try {
    // Tabella delle province
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "provinces" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL UNIQUE,
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
        "display_order" INTEGER NOT NULL
      );
    `);
    console.log("Tabella 'provinces' creata o già esistente");

    // Tabella impostazioni generali
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "general_settings" (
        "id" SERIAL PRIMARY KEY,
        "site_name" TEXT NOT NULL DEFAULT 'O2O Mobility',
        "logo_path" TEXT,
        "primary_color" TEXT DEFAULT '#3b82f6',
        "secondary_color" TEXT DEFAULT '#f97316',
        "contact_email" TEXT,
        "contact_phone" TEXT,
        "address" TEXT,
        "vat_number" TEXT,
        "social_facebook" TEXT,
        "social_instagram" TEXT,
        "social_linkedin" TEXT,
        "footer_text" TEXT,
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Tabella 'general_settings' creata o già esistente");

    // Tabella impostazioni sicurezza
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "security_settings" (
        "id" SERIAL PRIMARY KEY,
        "password_expiry_days" INTEGER DEFAULT 90,
        "min_password_length" INTEGER DEFAULT 8,
        "require_uppercase" BOOLEAN DEFAULT TRUE,
        "require_lowercase" BOOLEAN DEFAULT TRUE,
        "require_number" BOOLEAN DEFAULT TRUE,
        "require_special_char" BOOLEAN DEFAULT TRUE,
        "password_history_count" INTEGER DEFAULT 5,
        "enable_2fa" BOOLEAN DEFAULT FALSE,
        "failed_login_attempts" INTEGER DEFAULT 5,
        "lockout_duration_minutes" INTEGER DEFAULT 30,
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Tabella 'security_settings' creata o già esistente");

    // Tabella storico password
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "password_history" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "password_hash" TEXT NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Tabella 'password_history' creata o già esistente");

    // Tabella log attività
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "activity_logs" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "action" TEXT NOT NULL,
        "entity_type" TEXT NOT NULL,
        "entity_id" INTEGER,
        "details" JSONB,
        "ip_address" TEXT,
        "user_agent" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Tabella 'activity_logs' creata o già esistente");

    // Tabella blocco account
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "account_lockouts" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL UNIQUE,
        "failed_attempts" INTEGER NOT NULL DEFAULT 0,
        "locked_until" TIMESTAMP,
        "last_failed_attempt" TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Tabella 'account_lockouts' creata o già esistente");

    // Tabella reset password
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "password_resets" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "token" TEXT NOT NULL UNIQUE,
        "expires_at" TIMESTAMP NOT NULL,
        "is_used" BOOLEAN NOT NULL DEFAULT FALSE,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Tabella 'password_resets' creata o già esistente");

    // Inserisci alcune province di esempio con ordine di visualizzazione crescente
    const provinceNames = [
      "Agrigento", "Alessandria", "Ancona", "Aosta", "Arezzo", "Ascoli Piceno", "Asti", "Avellino", 
      "Bari", "Barletta-Andria-Trani", "Belluno", "Benevento", "Bergamo", "Biella", "Bologna", "Bolzano", 
      "Brescia", "Brindisi", "Cagliari", "Caltanissetta", "Campobasso", "Caserta", "Catania", "Catanzaro", 
      "Chieti", "Como", "Cosenza", "Cremona", "Crotone", "Cuneo", "Enna", "Fermo", "Ferrara", "Firenze", 
      "Foggia", "Forlì-Cesena", "Frosinone", "Genova", "Gorizia", "Grosseto", "Imperia", "Isernia", 
      "L'Aquila", "La Spezia", "Latina", "Lecce", "Lecco", "Livorno", "Lodi", "Lucca", "Macerata", 
      "Mantova", "Massa-Carrara", "Matera", "Messina", "Milano", "Modena", "Monza e Brianza", "Napoli", 
      "Novara", "Nuoro", "Oristano", "Padova", "Palermo", "Parma", "Pavia", "Perugia", "Pesaro e Urbino", 
      "Pescara", "Piacenza", "Pisa", "Pistoia", "Pordenone", "Potenza", "Prato", "Ragusa", "Ravenna", 
      "Reggio Calabria", "Reggio Emilia", "Rieti", "Rimini", "Roma", "Rovigo", "Salerno", "Sassari", 
      "Savona", "Siena", "Siracusa", "Sondrio", "Sud Sardegna", "Taranto", "Teramo", "Terni", "Torino", 
      "Trapani", "Trento", "Treviso", "Trieste", "Udine", "Varese", "Venezia", "Verbano-Cusio-Ossola", 
      "Vercelli", "Verona", "Vibo Valentia", "Vicenza", "Viterbo"
    ];

    // Verifica se esistono già province nel database
    const existingProvinces = await db.select().from(provinces);
    if (existingProvinces.length === 0) {
      // Se non ci sono province, le inserisce
      for (let i = 0; i < provinceNames.length; i++) {
        await db.insert(provinces).values({
          name: provinceNames[i],
          isActive: true,
          displayOrder: i + 1
        });
      }
      console.log(`Inserite ${provinceNames.length} province`);
    } else {
      console.log("Province già presenti nel database, nessun inserimento effettuato");
    }

    // Crea le impostazioni generali predefinite se non esistono
    const existingGeneralSettings = await db.select().from(generalSettings);
    if (existingGeneralSettings.length === 0) {
      await db.insert(generalSettings).values({
        siteName: "o2o Mobility",
        primaryColor: "#3b82f6",
        secondaryColor: "#f97316",
        footerText: "© 2023 o2o Mobility. Tutti i diritti riservati."
      });
      console.log("Impostazioni generali predefinite create");
    } else {
      console.log("Impostazioni generali già presenti nel database");
    }

    // Crea le impostazioni di sicurezza predefinite se non esistono
    const existingSecuritySettings = await db.select().from(securitySettings);
    if (existingSecuritySettings.length === 0) {
      await db.insert(securitySettings).values({
        passwordExpiryDays: 90,
        minPasswordLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecialChar: true,
        passwordHistoryCount: 5,
        enable2FA: false,
        failedLoginAttempts: 5,
        lockoutDurationMinutes: 30
      });
      console.log("Impostazioni di sicurezza predefinite create");
    } else {
      console.log("Impostazioni di sicurezza già presenti nel database");
    }

    console.log("Inizializzazione completata con successo!");
  } catch (error) {
    console.error("Errore durante l'inizializzazione delle tabelle:", error);
  }
}

initializeMissingTables().catch(console.error);