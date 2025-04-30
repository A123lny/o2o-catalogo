import { db } from "../db";

/**
 * Aggiunge le colonne per l'autenticazione a due fattori (2FA) alla tabella users
 * e crea la nuova tabella user_two_factor_secrets
 */
export async function addTwoFactorAuth() {
  console.log("Avvio migrazione: adding two-factor authentication columns");

  try {
    // Aggiungi le colonne two_factor_enabled e two_factor_verified alla tabella users
    await db.execute(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "two_factor_enabled" BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS "two_factor_verified" BOOLEAN DEFAULT FALSE;
    `);
    console.log("Colonne 2FA aggiunte alla tabella users");

    // Crea tabella user_two_factor_secrets
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "user_two_factor_secrets" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL UNIQUE,
        "secret" TEXT NOT NULL,
        "backup_codes" JSONB,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Tabella user_two_factor_secrets creata");

    console.log("Migrazione completata con successo");
  } catch (error) {
    console.error("Errore durante l'esecuzione della migrazione:", error);
    throw error;
  }
}

// Eseguiamo direttamente la migrazione
addTwoFactorAuth()
  .then(() => {
    console.log("Migrazione completata, uscita");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Errore nella migrazione:", error);
    process.exit(1);
  });