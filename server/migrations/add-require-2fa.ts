import { db } from "../db";

/**
 * Aggiunge la colonna require_2fa alla tabella security_settings
 */
export async function addRequire2FAColumn() {
  console.log("Avvio migrazione: adding require_2fa column to security_settings");

  try {
    // Aggiungi la colonna require_2fa alla tabella security_settings
    await db.execute(`
      ALTER TABLE "security_settings"
      ADD COLUMN IF NOT EXISTS "require_2fa" BOOLEAN NOT NULL DEFAULT FALSE;
    `);
    
    console.log("Colonna require_2fa aggiunta alla tabella security_settings");
    console.log("Migrazione completata con successo");
  } catch (error) {
    console.error("Errore durante l'esecuzione della migrazione:", error);
    throw error;
  }
}

// Eseguiamo direttamente la migrazione
addRequire2FAColumn()
  .then(() => {
    console.log("Migrazione completata, uscita");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Errore nella migrazione:", error);
    process.exit(1);
  });