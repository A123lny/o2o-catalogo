import { db } from './db';
import { InsertVehicle, vehicles, brands, categories } from '@shared/schema';

// Definiamo altri marchi
const carBrands = [
  { id: 11, name: "Citroen", logo: "citroen_logo.jpg" },
  { id: 12, name: "Kia", logo: "kia_logo.jpg" },
  { id: 13, name: "Hyundai", logo: "hyundai_logo.jpg" },
  { id: 14, name: "Nissan", logo: "nissan_logo.jpg" },
  { id: 15, name: "Seat", logo: "seat_logo.jpg" }
];

// Terza batch di auto piccole da aggiungere (10 per batch)
const smallCars = [
  // Citroen
  { title: "Citroen C3", brandId: 11, categoryId: 4, model: "C3", 
    year: 2022, mileage: 12000, color: "Bianco", interiorColor: "Beige", 
    fuelType: "Benzina", transmission: "Manuale", power: 83, 
    description: "Citroen C3 con comfort sospensioni Advanced Comfort e design originale.", 
    featured: false, condition: "Nuova", badges: ["promo"] },
  
  { title: "Citroen C1", brandId: 11, categoryId: 4, model: "C1", 
    year: 2020, mileage: 35000, color: "Rosso", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Manuale", power: 72, 
    description: "Citroen C1, compatta e agile, perfetta per la città.", 
    featured: false, condition: "2Life", badges: ["economica"] },
  
  // Kia
  { title: "Kia Picanto", brandId: 12, categoryId: 4, model: "Picanto", 
    year: 2023, mileage: 5000, color: "Blu", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Manuale", power: 67, 
    description: "Kia Picanto con garanzia 7 anni e dotazioni di sicurezza complete.", 
    featured: false, condition: "Nuova", badges: ["promo"] },
  
  { title: "Kia Rio", brandId: 12, categoryId: 4, model: "Rio", 
    year: 2022, mileage: 15000, color: "Grigio", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Manuale", power: 84, 
    description: "Kia Rio con sistema infotainment avanzato e ampio spazio interno.", 
    featured: true, condition: "Nuova", badges: ["promo"] },
  
  // Hyundai
  { title: "Hyundai i10", brandId: 13, categoryId: 4, model: "i10", 
    year: 2023, mileage: 8000, color: "Bianco", interiorColor: "Grigio", 
    fuelType: "Benzina", transmission: "Automatica", power: 67, 
    description: "Hyundai i10 con cambio automatico e tecnologia di sicurezza completa.", 
    featured: false, condition: "Nuova", badges: ["promo"] },
  
  { title: "Hyundai i20", brandId: 13, categoryId: 4, model: "i20", 
    year: 2021, mileage: 25000, color: "Grigio", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Manuale", power: 84, 
    description: "Hyundai i20 con design dinamico e dotazioni di serie complete.", 
    featured: false, condition: "2Life", badges: [] },
  
  // Nissan
  { title: "Nissan Micra", brandId: 14, categoryId: 4, model: "Micra", 
    year: 2022, mileage: 18000, color: "Rosso", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Manuale", power: 92, 
    description: "Nissan Micra con assistenza alla guida ProPILOT e design accattivante.", 
    featured: true, condition: "Nuova", badges: ["promo"] },
  
  { title: "Nissan Leaf", brandId: 14, categoryId: 4, model: "Leaf", 
    year: 2021, mileage: 20000, color: "Bianco", interiorColor: "Nero", 
    fuelType: "Elettrica", transmission: "Automatica", power: 150, 
    description: "Nissan Leaf, l'elettrica più venduta con autonomia fino a 385 km.", 
    featured: true, condition: "2Life", badges: ["zero emissioni"] },
  
  // Seat
  { title: "Seat Ibiza", brandId: 15, categoryId: 4, model: "Ibiza", 
    year: 2023, mileage: 7000, color: "Blu", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Manuale", power: 95, 
    description: "Seat Ibiza con dinamica di guida sportiva e tecnologia all'avanguardia.", 
    featured: true, condition: "Nuova", badges: ["promo"] },
  
  { title: "Seat Mii Electric", brandId: 15, categoryId: 4, model: "Mii Electric", 
    year: 2022, mileage: 10000, color: "Bianco", interiorColor: "Nero", 
    fuelType: "Elettrica", transmission: "Automatica", power: 83, 
    description: "Seat Mii Electric, compatta ed efficiente con zero emissioni.", 
    featured: false, condition: "Nuova", badges: ["promo", "zero emissioni"] }
];

async function addCars() {
  try {
    console.log("Iniziando l'aggiunta della terza batch di auto piccole...");
    
    // Aggiungi marchi se non esistono già
    for (const brand of carBrands) {
      const existingBrand = await db.query.brands.findFirst({
        where: (brands, { eq }) => eq(brands.id, brand.id)
      });
      
      if (!existingBrand) {
        console.log(`Aggiungendo il marchio: ${brand.name}`);
        await db.insert(brands).values(brand);
      }
    }
    
    // Aggiungi le auto
    console.log(`Aggiungendo ${smallCars.length} veicoli...`);
    
    for (const car of smallCars) {
      // Aggiungi le caratteristiche comuni
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
        "Volante multifunzione"
      ];
      
      // Aggiungi 4-7 caratteristiche opzionali casuali
      const numOptionalFeatures = Math.floor(Math.random() * 4) + 4;
      const shuffledOptional = [...optionalFeatures].sort(() => 0.5 - Math.random());
      const features = [...baseFeatures];
      
      for (let i = 0; i < numOptionalFeatures && i < shuffledOptional.length; i++) {
        features.push(shuffledOptional[i]);
      }
      
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