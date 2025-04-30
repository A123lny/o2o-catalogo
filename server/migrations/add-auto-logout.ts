import { db } from '../db';

async function addAutoLogoutColumn() {
  console.log("Aggiunta colonna auto_logout_minutes alla tabella security_settings...");

  try {
    // Verifica se la colonna esiste già
    const result = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'security_settings' AND column_name = 'auto_logout_minutes'
    `);
    
    if (result.rows.length === 0) {
      // Aggiungi la colonna se non esiste
      await db.execute(`
        ALTER TABLE "security_settings" 
        ADD COLUMN "auto_logout_minutes" INTEGER DEFAULT 30
      `);
      console.log("Colonna auto_logout_minutes aggiunta con successo");
    } else {
      console.log("La colonna auto_logout_minutes esiste già");
    }

    console.log("Migrazione completata con successo!");
  } catch (error) {
    console.error("Errore durante la migrazione:", error);
  }
}

addAutoLogoutColumn().catch(console.error);