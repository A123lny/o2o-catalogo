import { db } from './db';
import { vehicles } from '@shared/schema';
import { eq } from 'drizzle-orm';

const START_ID = 1;  // Modifichiamo tutti i veicoli
const END_ID = 100;

// I badge corretti nel sistema
const correctBadges = [
  "Premium",
  "Promo",     // Questo è il formato corretto con la P maiuscola
  "Economica",
  "Zero Emissioni",
  "Riservato",
  "Assegnato", 
  "2Life"
];

// Funzione per normalizzare i badge
function normalizeBadges(badges: string[]): string[] {
  if (!badges || !Array.isArray(badges)) return [];
  
  return badges.map(badge => {
    // Controlliamo diversi casi con formati non corretti
    if (badge === "promo") return "Promo";
    if (badge === "economica") return "Economica";
    if (badge === "zero emissioni") return "Zero Emissioni";
    if (badge === "premium") return "Premium";
    if (badge === "riservato") return "Riservato";
    if (badge === "assegnato") return "Assegnato";
    if (badge === "2life") return "2Life";
    
    // Verifichiamo che il badge sia tra quelli consentiti
    if (correctBadges.includes(badge)) return badge;
    
    // Badge simili a quelli corretti ma con errori di battitura
    const lowerBadge = badge.toLowerCase();
    if (lowerBadge.includes("premium")) return "Premium";
    if (lowerBadge.includes("promo")) return "Promo";
    if (lowerBadge.includes("econom")) return "Economica";
    if (lowerBadge.includes("emiss")) return "Zero Emissioni";
    if (lowerBadge.includes("riserv")) return "Riservato";
    if (lowerBadge.includes("assegn")) return "Assegnato";
    if (lowerBadge.includes("2life") || lowerBadge.includes("2 life")) return "2Life";
    
    // Se non è un badge valido, lo escludiamo
    return null;
  }).filter(badge => badge !== null) as string[];
}

async function fixBadges() {
  try {
    console.log(`Inizio correzione dei badge per i veicoli da ID ${START_ID} a ${END_ID}...`);
    
    // Ottieni i veicoli nel range specificato
    const vehicles_to_fix = await db.query.vehicles.findMany({
      where: (vehicles, { and, between }) => and(
        between(vehicles.id, START_ID, END_ID)
      )
    });
    
    console.log(`Trovati ${vehicles_to_fix.length} veicoli nel range specificato`);
    
    let corrected = 0;
    
    // Correggi i badge per ogni veicolo
    for (const vehicle of vehicles_to_fix) {
      const originalBadges = vehicle.badges as string[];
      
      if (!originalBadges || !Array.isArray(originalBadges)) {
        console.log(`ID ${vehicle.id}: ${vehicle.title} - Nessun badge da correggere`);
        continue;
      }
      
      const normalizedBadges = normalizeBadges(originalBadges);
      
      // Verifica se i badge sono cambiati
      const hasChanges = JSON.stringify(originalBadges) !== JSON.stringify(normalizedBadges);
      
      if (hasChanges) {
        // Aggiorna il veicolo solo se ci sono modifiche
        await db.update(vehicles)
          .set({ badges: normalizedBadges })
          .where(eq(vehicles.id, vehicle.id));
        
        console.log(`ID ${vehicle.id}: ${vehicle.title} - Badge corretti: ${JSON.stringify(originalBadges)} -> ${JSON.stringify(normalizedBadges)}`);
        corrected++;
      } else {
        console.log(`ID ${vehicle.id}: ${vehicle.title} - Badge già corretti: ${JSON.stringify(originalBadges)}`);
      }
    }
    
    console.log(`Correzione completata! Corretti ${corrected} veicoli su ${vehicles_to_fix.length}.`);
  } catch (error) {
    console.error("Errore durante la correzione dei badge:", error);
  }
}

// Esegui lo script
fixBadges()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Errore durante l\'esecuzione:', error);
    process.exit(1);
  });