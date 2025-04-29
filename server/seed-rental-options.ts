import { db } from './db';
import { InsertRentalOption, rentalOptions, vehicles } from '@shared/schema';

async function addRentalOptions() {
  try {
    console.log("Iniziando l'aggiunta di opzioni di noleggio per i nuovi veicoli...");
    
    // Ottieni tutti i veicoli
    const allVehicles = await db.query.vehicles.findMany();
    
    // Ottieni gli ID dei veicoli che non hanno ancora opzioni di noleggio
    const vehicleIds = new Set<number>();
    
    for (const vehicle of allVehicles) {
      const options = await db.query.rentalOptions.findMany({
        where: (options, { eq }) => eq(options.vehicleId, vehicle.id)
      });
      
      if (options.length === 0) {
        vehicleIds.add(vehicle.id);
      }
    }
    
    console.log(`Trovati ${vehicleIds.size} veicoli senza opzioni di noleggio`);
    
    // Aggiungi opzioni di noleggio per ogni veicolo
    for (const vehicleId of vehicleIds) {
      const vehicle = allVehicles.find(v => v.id === vehicleId);
      if (!vehicle) continue;
      
      // Determina se aggiungere solo NLT, solo RTB, o entrambi
      const contractTypes = ['NLT', 'RTB', 'BOTH'];
      const contractType = contractTypes[Math.floor(Math.random() * contractTypes.length)];
      
      if (contractType === 'NLT' || contractType === 'BOTH') {
        await addNLTOptions(vehicleId, vehicle);
      }
      
      if (contractType === 'RTB' || contractType === 'BOTH') {
        await addRTBOptions(vehicleId, vehicle);
      }
    }
    
    console.log("Opzioni di noleggio aggiunte con successo!");
  } catch (error) {
    console.error("Errore durante l'aggiunta delle opzioni di noleggio:", error);
  }
}

// Funzione per aggiungere opzioni NLT
async function addNLTOptions(vehicleId: number, vehicle: any) {
  // Calcola il prezzo base in base al modello e alla potenza
  // Le auto più potenti e più nuove costano di più
  const basePrice = 150 + (vehicle.power * 0.7) + ((2024 - vehicle.year) * -15);
  
  // Piccolo sconto per le vetture a km elevato
  const mileageDiscount = Math.min(vehicle.mileage / 10000, 5) * 10;
  
  // Aggiungi varianti da 12, 24, 36, 48 mesi
  const durations = [12, 24, 36, 48];
  
  for (const duration of durations) {
    // Calcola lo sconto in base alla durata
    // Contratti più lunghi hanno prezzi mensili più bassi
    const durationDiscount = (duration > 12) ? (duration / 12) * 5 : 0;
    
    // Prezzo mensile scontato in base alla durata
    const monthlyPrice = Math.round(basePrice - durationDiscount - mileageDiscount);
    
    // L'anticipo è generalmente 6 volte il canone mensile
    const deposit = Math.round(monthlyPrice * 6);
    
    // La cauzione è generalmente 1 o 2 volte il canone mensile
    const caution = Math.round(monthlyPrice * (Math.random() < 0.5 ? 1 : 2));
    
    // Calcola il chilometraggio annuale in base al prezzo
    // Più economico = meno km
    const annualMileage = 10000 + (Math.round(monthlyPrice / 10) * 1000);
    
    // Le opzioni consigliate sono 36 mesi e 24 mesi
    const isDefault = (duration === 36 || duration === 24);
    
    // Servizi inclusi standard per NLT
    const baseServices = [
      "Assicurazione RCA",
      "Manutenzione ordinaria",
      "Soccorso stradale",
      "Gestione sinistri"
    ];
    
    // Servizi aggiuntivi per contratti più costosi
    const extraServices = [
      "Copertura kasko",
      "Sostituzione pneumatici",
      "Auto sostitutiva",
      "Assistenza 24/7",
      "Gestione multe"
    ];
    
    // Calcola il numero di servizi extra da includere
    const numExtraServices = Math.floor(monthlyPrice / 50); // 1 servizio extra ogni 50€ di canone
    
    const includedServices = [...baseServices];
    for (let i = 0; i < numExtraServices && i < extraServices.length; i++) {
      includedServices.push(extraServices[i]);
    }
    
    const option: InsertRentalOption = {
      vehicleId,
      type: "NLT",
      duration,
      monthlyPrice,
      deposit,
      caution,
      annualMileage,
      setupFee: Math.random() < 0.7 ? 0 : 300, // 70% senza setup fee
      finalPayment: 0, // NLT senza pagamento finale
      isDefault,
      includedServices
    };
    
    await db.insert(rentalOptions).values(option);
  }
}

// Funzione per aggiungere opzioni RTB
async function addRTBOptions(vehicleId: number, vehicle: any) {
  // Calcola il valore dell'auto
  const carValue = (10000 + (vehicle.power * 100) + ((2024 - vehicle.year) * -1000)) - (vehicle.mileage / 100);
  
  // Prezzo base mensile sarà circa l'1-1.5% del valore dell'auto
  const pricePercentage = 0.01 + (Math.random() * 0.005);
  const basePrice = Math.round(carValue * pricePercentage);
  
  // Aggiungi varianti da 24, 36, 48 mesi
  const durations = [24, 36, 48];
  
  for (const duration of durations) {
    // Calcolo deposito (10-15% del valore dell'auto)
    const depositPercentage = 0.1 + (Math.random() * 0.05);
    const deposit = Math.round(carValue * depositPercentage);
    
    // Calcolo pagamento finale (30-50% del valore dell'auto)
    // Contratti più lunghi hanno un valore residuo minore
    const finalPaymentPercentage = 0.5 - ((duration - 24) / 24 * 0.1);
    const finalPayment = Math.round(carValue * finalPaymentPercentage);
    
    // Calcolo prezzo mensile in base agli altri parametri
    // (valore auto - deposito - valore residuo) / durata + margine
    const baseMonthlyCost = (carValue - deposit - finalPayment) / duration;
    const margin = baseMonthlyCost * 0.15; // 15% di margine
    const monthlyPrice = Math.round(baseMonthlyCost + margin);
    
    // Cauzione standard
    const caution = Math.round(monthlyPrice * 2);
    
    // Chilometraggio annuo
    const annualMileage = 10000 + (Math.round(monthlyPrice / 15) * 1000);
    
    // Le opzioni consigliate sono 36 mesi
    const isDefault = (duration === 36);
    
    // Servizi inclusi standard per RTB
    const baseServices = [
      "Assicurazione RCA",
      "Manutenzione ordinaria"
    ];
    
    // Servizi aggiuntivi
    const extraServices = [
      "Soccorso stradale",
      "Gestione sinistri",
      "Sostituzione pneumatici",
      "Assistenza 24/7"
    ];
    
    // RTB ha generalmente meno servizi inclusi rispetto a NLT
    const numExtraServices = Math.floor(monthlyPrice / 70); // 1 servizio extra ogni 70€
    
    const includedServices = [...baseServices];
    for (let i = 0; i < numExtraServices && i < extraServices.length; i++) {
      includedServices.push(extraServices[i]);
    }
    
    const option: InsertRentalOption = {
      vehicleId,
      type: "RTB",
      duration,
      monthlyPrice,
      deposit,
      caution,
      annualMileage,
      setupFee: Math.random() < 0.8 ? 0 : 200, // 80% senza setup fee
      finalPayment,
      isDefault,
      includedServices
    };
    
    await db.insert(rentalOptions).values(option);
  }
}

// Esegui lo script
addRentalOptions()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Errore durante il seeding:', error);
    process.exit(1);
  });