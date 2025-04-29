import { db } from './db';
import { InsertVehicle, vehicles, brands, categories } from '@shared/schema';
import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

const smallCarModels = [
  // Fiat
  { brand: 5, model: "Panda", type: 4 },
  { brand: 5, model: "500", type: 4 },
  { brand: 5, model: "Tipo", type: 4 },
  { brand: 5, model: "500L", type: 4 },
  
  // Volkswagen
  { brand: 4, model: "Polo", type: 4 },
  { brand: 4, model: "Golf", type: 4 },
  { brand: 4, model: "Up!", type: 4 },
  
  // Ford
  { brand: 6, model: "Fiesta", type: 4 },
  { brand: 6, model: "Focus", type: 4 },
  { brand: 6, model: "Ka+", type: 4 },
  
  // Renault
  { brand: 7, model: "Clio", type: 4 },
  { brand: 7, model: "Twingo", type: 4 },
  { brand: 7, model: "Zoe", type: 4 },
  { brand: 7, model: "Captur", type: 4 },
  
  // Peugeot
  { brand: 8, model: "208", type: 4 },
  { brand: 8, model: "308", type: 4 },
  { brand: 8, model: "108", type: 4 },
  
  // Toyota
  { brand: 9, model: "Yaris", type: 4 },
  { brand: 9, model: "Aygo", type: 4 },
  { brand: 9, model: "Corolla", type: 5 },
  
  // Opel
  { brand: 10, model: "Corsa", type: 4 },
  { brand: 10, model: "Astra", type: 5 },
  { brand: 10, model: "Karl", type: 4 },
  
  // Citroen
  { brand: 11, model: "C3", type: 4 },
  { brand: 11, model: "C1", type: 4 },
  { brand: 11, model: "C4", type: 5 },
  
  // Kia
  { brand: 12, model: "Picanto", type: 4 },
  { brand: 12, model: "Rio", type: 4 },
  { brand: 12, model: "Ceed", type: 5 },
  
  // Hyundai
  { brand: 13, model: "i10", type: 4 },
  { brand: 13, model: "i20", type: 4 },
  { brand: 13, model: "i30", type: 5 },
  
  // Nissan
  { brand: 14, model: "Micra", type: 4 },
  { brand: 14, model: "Note", type: 4 },
  { brand: 14, model: "Leaf", type: 4 },
  
  // Seat
  { brand: 15, model: "Ibiza", type: 4 },
  { brand: 15, model: "Leon", type: 5 },
  { brand: 15, model: "Mii", type: 4 },
  
  // Skoda
  { brand: 16, model: "Fabia", type: 4 },
  { brand: 16, model: "Citigo", type: 4 },
  { brand: 16, model: "Scala", type: 5 },
  
  // Dacia
  { brand: 17, model: "Sandero", type: 4 },
  { brand: 17, model: "Logan", type: 5 },
  
  // Suzuki
  { brand: 18, model: "Swift", type: 4 },
  { brand: 18, model: "Ignis", type: 4 },
  { brand: 18, model: "Baleno", type: 4 },
  
  // Mazda
  { brand: 19, model: "2", type: 4 },
  { brand: 19, model: "3", type: 5 },
  
  // Mini
  { brand: 20, model: "Cooper", type: 4 },
  { brand: 20, model: "One", type: 4 }
];

// Nuovi marchi da aggiungere
const newBrands = [
  { id: 5, name: "Fiat", logo: "fiat_logo.jpg" },
  { id: 6, name: "Ford", logo: "ford_logo.jpg" },
  { id: 7, name: "Renault", logo: "renault_logo.jpg" },
  { id: 8, name: "Peugeot", logo: "peugeot_logo.jpg" },
  { id: 9, name: "Toyota", logo: "toyota_logo.jpg" },
  { id: 10, name: "Opel", logo: "opel_logo.jpg" },
  { id: 11, name: "Citroen", logo: "citroen_logo.jpg" },
  { id: 12, name: "Kia", logo: "kia_logo.jpg" },
  { id: 13, name: "Hyundai", logo: "hyundai_logo.jpg" },
  { id: 14, name: "Nissan", logo: "nissan_logo.jpg" },
  { id: 15, name: "Seat", logo: "seat_logo.jpg" },
  { id: 16, name: "Skoda", logo: "skoda_logo.jpg" },
  { id: 17, name: "Dacia", logo: "dacia_logo.jpg" },
  { id: 18, name: "Suzuki", logo: "suzuki_logo.jpg" },
  { id: 19, name: "Mazda", logo: "mazda_logo.jpg" },
  { id: 20, name: "Mini", logo: "mini_logo.jpg" }
];

// Nuove categorie da aggiungere
const newCategories = [
  { id: 4, name: "Utilitaria", image: "utilitaria_category.jpg" },
  { id: 5, name: "Berlina Compatta", image: "berlina_compatta_category.jpg" }
];

// Funzione per generare caso di prova (circa 40% hanno promo)
function shouldHavePromo(): boolean {
  return Math.random() < 0.40; // 40% di probabilità
}

// Funzione per generare una sequenza casuale di badge
function generateBadges(isPromo: boolean): string[] {
  const badges = [];
  if (isPromo) {
    badges.push("promo");
  }
  
  // Occasionalmente aggiungi altri badge
  if (Math.random() < 0.2) {
    badges.push("zero emissioni");
  }
  
  if (Math.random() < 0.15) {
    badges.push("economica");
  }
  
  return badges;
}

// Funzione per generare colori casuali
function getRandomColor(): string {
  const colors = [
    "Bianco", "Nero", "Grigio", "Argento", "Rosso", "Blu", "Verde", 
    "Giallo", "Arancione", "Beige", "Marrone", "Bronzo", "Azzurro"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Funzione per generare colori interni casuali
function getRandomInteriorColor(): string {
  const colors = [
    "Nero", "Grigio", "Beige", "Marrone", "Crema", "Bordeaux"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Funzione per generare il tipo di carburante
function getRandomFuelType(): string {
  const fuelTypes = [
    "Benzina", "Diesel", "Ibrida", "Elettrica", "GPL"
  ];
  const weights = [0.35, 0.25, 0.2, 0.1, 0.1]; // probabilità per ciascun tipo
  
  const randomValue = Math.random();
  let cumulativeWeight = 0;
  
  for (let i = 0; i < fuelTypes.length; i++) {
    cumulativeWeight += weights[i];
    if (randomValue <= cumulativeWeight) {
      return fuelTypes[i];
    }
  }
  
  return fuelTypes[0]; // fallback a benzina
}

// Funzione per generare il tipo di trasmissione
function getRandomTransmission(): string {
  return Math.random() < 0.65 ? "Manuale" : "Automatica";
}

// Funzione per generare anno casuale (tra 2018 e 2024)
function getRandomYear(): number {
  return Math.floor(Math.random() * 7) + 2018;
}

// Funzione per generare chilometraggio casuale (0-100000)
function getRandomMileage(): number {
  return Math.floor(Math.random() * 100000);
}

// Funzione per generare potenza casuale (50-150 CV per auto piccole)
function getRandomPower(): number {
  return Math.floor(Math.random() * 100) + 50;
}

// Funzione per generare la condizione dell'auto
function getRandomCondition(): string {
  return Math.random() < 0.7 ? "Nuova" : "2Life";
}

// Funzioni per generare le caratteristiche principali
function getCommonFeatures(): string[] {
  const baseFeatures = [
    "Climatizzatore", 
    "Chiusura centralizzata", 
    "Alzacristalli elettrici", 
    "Radio"
  ];
  
  const optionalFeatures = [
    "Sensori di parcheggio", 
    "Navigatore", 
    "Bluetooth", 
    "USB", 
    "Cruise Control",
    "Cerchi in lega",
    "Fendinebbia",
    "Controllo della trazione",
    "Start/Stop",
    "Volante multifunzione",
    "Sensore pioggia",
    "Sensore luci"
  ];
  
  // Prendi tutte le caratteristiche base
  const features = [...baseFeatures];
  
  // Aggiungi 3-8 caratteristiche opzionali casuali
  const numOptionalFeatures = Math.floor(Math.random() * 6) + 3;
  const shuffledOptional = [...optionalFeatures].sort(() => 0.5 - Math.random());
  
  for (let i = 0; i < numOptionalFeatures && i < shuffledOptional.length; i++) {
    features.push(shuffledOptional[i]);
  }
  
  return features;
}

async function addSmallCars() {
  try {
    console.log("Iniziando l'aggiunta di 50 nuove auto piccole...");
    
    // Aggiungi nuovi marchi se non esistono già
    for (const brand of newBrands) {
      const existingBrand = await db.query.brands.findFirst({
        where: (brands, { eq }) => eq(brands.id, brand.id)
      });
      
      if (!existingBrand) {
        console.log(`Aggiungendo il marchio: ${brand.name}`);
        await db.insert(brands).values(brand);
      }
    }
    
    // Aggiungi nuove categorie se non esistono già
    for (const category of newCategories) {
      const existingCategory = await db.query.categories.findFirst({
        where: (categories, { eq }) => eq(categories.id, category.id)
      });
      
      if (!existingCategory) {
        console.log(`Aggiungendo la categoria: ${category.name}`);
        await db.insert(categories).values(category);
      }
    }
    
    // Genera e inserisci 50 veicoli
    const vehiclesToAdd: InsertVehicle[] = [];
    let promoCount = 0;
    
    for (let i = 0; i < 50; i++) {
      // Scegli un modello casuale
      const carModel = smallCarModels[Math.floor(Math.random() * smallCarModels.length)];
      
      // Determina se ha la promo
      const isPromo = shouldHavePromo();
      if (isPromo) promoCount++;
      
      // Genera caratteristiche del veicolo
      const vehicle: InsertVehicle = {
        title: `${await getBrandName(carModel.brand)} ${carModel.model}`,
        brandId: carModel.brand,
        categoryId: carModel.type,
        model: carModel.model,
        year: getRandomYear(),
        mileage: getRandomMileage(),
        color: getRandomColor(),
        interiorColor: getRandomInteriorColor(),
        fuelType: getRandomFuelType(),
        transmission: getRandomTransmission(),
        power: getRandomPower(),
        description: `${await getBrandName(carModel.brand)} ${carModel.model} in ottime condizioni. Veicolo perfetto per la città con consumi ridotti e manutenzione economica. Ideale per neopatentati e famiglie.`,
        featured: Math.random() < 0.15, // 15% di probabilità di essere featured
        condition: getRandomCondition(),
        mainImage: `${carModel.model.toLowerCase().replace(/\s+/g, '_')}_main.jpg`,
        images: [
          `${carModel.model.toLowerCase().replace(/\s+/g, '_')}_1.jpg`,
          `${carModel.model.toLowerCase().replace(/\s+/g, '_')}_2.jpg`,
          `${carModel.model.toLowerCase().replace(/\s+/g, '_')}_3.jpg`
        ],
        badges: generateBadges(isPromo),
        features: getCommonFeatures()
      };
      
      vehiclesToAdd.push(vehicle);
    }
    
    console.log(`Aggiungendo 50 veicoli (${promoCount} con badge promo)...`);
    for (const vehicle of vehiclesToAdd) {
      await db.insert(vehicles).values(vehicle);
    }
    
    console.log(`Aggiunti 50 veicoli con successo! ${promoCount} veicoli hanno il badge promo.`);
  } catch (error) {
    console.error("Errore durante il seeding dei veicoli:", error);
  }
}

// Funzione ausiliaria per ottenere il nome del marchio dato l'ID
async function getBrandName(brandId: number): Promise<string> {
  // Prima cerca nei nuovi marchi (più veloce)
  const newBrand = newBrands.find(b => b.id === brandId);
  if (newBrand) return newBrand.name;
  
  // Altrimenti cerca nel database
  const brand = await db.query.brands.findFirst({
    where: (brands, { eq }) => eq(brands.id, brandId)
  });
  
  return brand?.name || "Unknown";
}

// Esegui lo script
addSmallCars()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Errore durante il seeding:', error);
    process.exit(1);
  });