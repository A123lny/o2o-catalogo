import { db } from './db';
import { InsertVehicle, vehicles, brands, categories } from '@shared/schema';

// Definisci i marchi che vogliamo usare (numeri ID più bassi per quelli già esistenti)
const carBrands = [
  { id: 1, name: "Audi" },
  { id: 2, name: "BMW" },
  { id: 3, name: "Mercedes-Benz" },
  { id: 4, name: "Volkswagen" },
  { id: 5, name: "Fiat", logo: "fiat_logo.jpg" }
];

// Nuove categorie da aggiungere
const carCategories = [
  { id: 1, name: "SUV" },
  { id: 2, name: "Berlina" },
  { id: 3, name: "Coupé" },
  { id: 4, name: "Utilitaria", image: "utilitaria_category.jpg" }
];

// Auto piccole da aggiungere (10 per batch)
const smallCars = [
  // Batch 1: Volkswagen
  { title: "Volkswagen Polo", brandId: 4, categoryId: 4, model: "Polo", 
    year: 2022, mileage: 15000, color: "Bianco", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Manuale", power: 95, 
    description: "Volkswagen Polo in ottime condizioni. Perfetta per la città con bassi consumi.", 
    featured: false, condition: "Nuova", badges: ["promo"] },
  
  { title: "Volkswagen Up!", brandId: 4, categoryId: 4, model: "Up!", 
    year: 2021, mileage: 25000, color: "Rosso", interiorColor: "Grigio", 
    fuelType: "Benzina", transmission: "Manuale", power: 65, 
    description: "Volkswagen Up! compatta ed economica, ideale per la città.", 
    featured: false, condition: "2Life", badges: ["economica"] },
  
  { title: "Volkswagen Golf", brandId: 4, categoryId: 4, model: "Golf", 
    year: 2023, mileage: 5000, color: "Argento", interiorColor: "Nero", 
    fuelType: "Ibrida", transmission: "Automatica", power: 150, 
    description: "Volkswagen Golf ibrida con bassi consumi e ottime prestazioni.", 
    featured: true, condition: "Nuova", badges: ["promo"] },
  
  // Batch 2: Fiat
  { title: "Fiat 500", brandId: 5, categoryId: 4, model: "500", 
    year: 2022, mileage: 10000, color: "Bianco", interiorColor: "Beige", 
    fuelType: "Elettrica", transmission: "Automatica", power: 95, 
    description: "Fiat 500 elettrica con autonomia di 320 km e ricarica rapida.", 
    featured: true, condition: "Nuova", badges: ["promo", "zero emissioni"] },
  
  { title: "Fiat Panda", brandId: 5, categoryId: 4, model: "Panda", 
    year: 2021, mileage: 30000, color: "Blu", interiorColor: "Grigio", 
    fuelType: "Benzina", transmission: "Manuale", power: 70, 
    description: "Fiat Panda, l'auto ideale per la città con la massima praticità.", 
    featured: false, condition: "2Life", badges: ["economica"] },
  
  { title: "Fiat Tipo", brandId: 5, categoryId: 4, model: "Tipo", 
    year: 2022, mileage: 20000, color: "Grigio", interiorColor: "Nero", 
    fuelType: "Diesel", transmission: "Manuale", power: 95, 
    description: "Fiat Tipo diesel con bassi consumi e ottima affidabilità.", 
    featured: false, condition: "Nuova", badges: ["promo"] },
  
  // Batch 3: Audi
  { title: "Audi A1", brandId: 1, categoryId: 4, model: "A1", 
    year: 2023, mileage: 8000, color: "Nero", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Automatica", power: 110, 
    description: "Audi A1 compatta con interni premium e finiture di alta qualità.", 
    featured: true, condition: "Nuova", badges: ["promo"] },
  
  // Batch 4: BMW
  { title: "BMW Serie 1", brandId: 2, categoryId: 4, model: "Serie 1", 
    year: 2023, mileage: 10000, color: "Blu", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Automatica", power: 136, 
    description: "BMW Serie 1 con tecnologia all'avanguardia e prestazioni sportive.", 
    featured: true, condition: "Nuova", badges: ["promo"] },
  
  // Batch 5: Mercedes
  { title: "Mercedes-Benz Classe A", brandId: 3, categoryId: 4, model: "Classe A", 
    year: 2022, mileage: 15000, color: "Grigio", interiorColor: "Nero", 
    fuelType: "Ibrida", transmission: "Automatica", power: 160, 
    description: "Mercedes-Benz Classe A ibrida con interni di lusso e tecnologia MBUX.", 
    featured: true, condition: "Nuova", badges: ["promo"] },
  
  // Batch 6: Altra Fiat
  { title: "Fiat 500L", brandId: 5, categoryId: 4, model: "500L", 
    year: 2020, mileage: 40000, color: "Rosso", interiorColor: "Beige", 
    fuelType: "Benzina", transmission: "Manuale", power: 95, 
    description: "Fiat 500L spaziosa e versatile, ideale per famiglia.", 
    featured: false, condition: "2Life", badges: [] }
];

async function addCars() {
  try {
    console.log("Iniziando l'aggiunta di auto piccole...");
    
    // Assicurati che la categoria "Utilitaria" esista
    const existingCategory = await db.query.categories.findFirst({
      where: (categories, { eq }) => eq(categories.id, 4)
    });
    
    if (!existingCategory) {
      console.log("Aggiungendo la categoria Utilitaria...");
      await db.insert(categories).values(carCategories[3]);
    }
    
    // Assicurati che il marchio Fiat esista
    const existingBrand = await db.query.brands.findFirst({
      where: (brands, { eq }) => eq(brands.id, 5)
    });
    
    if (!existingBrand) {
      console.log("Aggiungendo il marchio Fiat...");
      await db.insert(brands).values(carBrands[4]);
    }
    
    // Aggiungi le auto
    console.log(`Aggiungendo ${smallCars.length} veicoli...`);
    
    for (const car of smallCars) {
      // Aggiungi le caratteristiche comuni
      const features = [
        "Climatizzatore", 
        "Chiusura centralizzata", 
        "Alzacristalli elettrici", 
        "Radio",
        "Bluetooth",
        "USB",
        "Sensori di parcheggio"
      ];
      
      // Aggiungi immagini generiche
      const model = car.model.toLowerCase().replace(/\s+/g, '_');
      const images = [
        `${model}_1.jpg`,
        `${model}_2.jpg`,
        `${model}_3.jpg`
      ];
      
      const vehicle: InsertVehicle = {
        ...car,
        features,
        mainImage: `${model}_main.jpg`,
        images
      };
      
      await db.insert(vehicles).values(vehicle);
      console.log(`Aggiunto veicolo: ${car.title}`);
    }
    
    console.log(`Aggiunti ${smallCars.length} veicoli con successo!`);
  } catch (error) {
    console.error("Errore durante il seeding dei veicoli:", error);
  }
}

// Esegui lo script
addCars()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Errore durante il seeding:', error);
    process.exit(1);
  });