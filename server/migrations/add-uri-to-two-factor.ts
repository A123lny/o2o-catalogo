/**
 * Migrazione per aggiungere la colonna URI alla tabella user_two_factor_secrets
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

async function addUriToTwoFactorSecrets() {
  console.log("Inizio migrazione: aggiunta campo 'uri' alla tabella user_two_factor_secrets");
  
  try {
    // Verifica se la colonna esiste già
    const checkColumnExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_two_factor_secrets' AND column_name = 'uri'
    `);
    
    if (checkColumnExists.rows.length === 0) {
      console.log("La colonna 'uri' non esiste, la aggiungo");
      
      // Verifichiamo se ci sono record esistenti
      const existingRecords = await db.execute(sql`
        SELECT COUNT(*) FROM user_two_factor_secrets
      `);
      
      const count = parseInt(existingRecords.rows[0].count);
      console.log(`Record esistenti: ${count}`);
      
      if (count > 0) {
        console.log("Ci sono record esistenti, li cancello per procedere con la migrazione");
        
        // Elimina tutti i record esistenti
        await db.execute(sql`
          DELETE FROM user_two_factor_secrets
        `);
        
        console.log("Tabella svuotata con successo");
      }
      
      // Aggiungi la colonna uri
      await db.execute(sql`
        ALTER TABLE user_two_factor_secrets 
        ADD COLUMN uri TEXT NOT NULL DEFAULT 'placeholder'
      `);
      
      // Rimuovi il default per i nuovi record
      await db.execute(sql`
        ALTER TABLE user_two_factor_secrets 
        ALTER COLUMN uri DROP DEFAULT
      `);
      
      console.log("Colonna 'uri' aggiunta con successo");
    } else {
      console.log("La colonna 'uri' esiste già, salto questa migrazione");
    }
  } catch (error) {
    console.error("Errore durante la migrazione:", error);
    throw error;
  }
}

addUriToTwoFactorSecrets()
  .then(() => {
    console.log("Migrazione completata con successo");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Errore fatale durante la migrazione:", error);
    process.exit(1);
  });