import { db } from "../db";
import { sql } from "drizzle-orm";

async function addVerifiedToTwoFactorSecrets() {
  console.log("Inizio migrazione: aggiunta campo 'verified' alla tabella two_factor_secrets");
  
  try {
    // Verifica se la colonna esiste già
    const checkColumnExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_two_factor_secrets' AND column_name = 'verified'
    `);
    
    if (checkColumnExists.rows.length === 0) {
      console.log("La colonna 'verified' non esiste, la aggiungo");
      
      // Aggiungi la colonna verified con valore predefinito false
      await db.execute(sql`
        ALTER TABLE user_two_factor_secrets 
        ADD COLUMN verified BOOLEAN NOT NULL DEFAULT false
      `);
      
      console.log("Colonna 'verified' aggiunta con successo");
    } else {
      console.log("La colonna 'verified' esiste già, salto questa migrazione");
    }
  } catch (error) {
    console.error("Errore durante la migrazione:", error);
    throw error;
  }
}

addVerifiedToTwoFactorSecrets()
  .then(() => {
    console.log("Migrazione completata con successo");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Errore fatale durante la migrazione:", error);
    process.exit(1);
  });