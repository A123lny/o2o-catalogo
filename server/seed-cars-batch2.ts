import { db } from './db';
import { InsertVehicle, vehicles, brands, categories } from '@shared/schema';

// Definiamo altri marchi
const carBrands = [
  { id: 6, name: "Ford", logo: "ford_logo.jpg" },
  { id: 7, name: "Renault", logo: "renault_logo.jpg" },
  { id: 8, name: "Peugeot", logo: "peugeot_logo.jpg" },
  { id: 9, name: "Toyota", logo: "toyota_logo.jpg" },
  { id: 10, name: "Opel", logo: "opel_logo.jpg" }
];

// Seconda batch di auto piccole da aggiungere (10 per batch)
const smallCars = [
  // Ford
  { title: "Ford Fiesta", brandId: 6, categoryId: 4, model: "Fiesta", 
    year: 2022, mileage: 12000, color: "Blu", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Manuale", power: 95, 
    description: "Ford Fiesta, compatta ed economica con ottime prestazioni e bassi consumi.", 
    featured: false, condition: "Nuova", badges: ["promo"] },
  
  { title: "Ford Focus", brandId: 6, categoryId: 4, model: "Focus", 
    year: 2021, mileage: 25000, color: "Grigio", interiorColor: "Nero", 
    fuelType: "Diesel", transmission: "Manuale", power: 120, 
    description: "Ford Focus diesel con bassi consumi e spazio interno generoso.", 
    featured: false, condition: "2Life", badges: [] },
  
  // Renault
  { title: "Renault Clio", brandId: 7, categoryId: 4, model: "Clio", 
    year: 2023, mileage: 5000, color: "Rosso", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Manuale", power: 90, 
    description: "Renault Clio moderna con design accattivante e tecnologia avanzata.", 
    featured: true, condition: "Nuova", badges: ["promo"] },
  
  { title: "Renault Twingo", brandId: 7, categoryId: 4, model: "Twingo", 
    year: 2022, mileage: 15000, color: "Giallo", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Manuale", power: 65, 
    description: "Renault Twingo, compatta ed estremamente maneggevole per la città.", 
    featured: false, condition: "Nuova", badges: ["economica"] },
  
  // Peugeot
  { title: "Peugeot 208", brandId: 8, categoryId: 4, model: "208", 
    year: 2023, mileage: 8000, color: "Bianco", interiorColor: "Nero", 
    fuelType: "Elettrica", transmission: "Automatica", power: 136, 
    description: "Peugeot 208 elettrica con i-Cockpit e autonomia fino a 340 km.", 
    featured: true, condition: "Nuova", badges: ["promo", "zero emissioni"] },
  
  { title: "Peugeot 308", brandId: 8, categoryId: 4, model: "308", 
    year: 2021, mileage: 30000, color: "Grigio", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Automatica", power: 130, 
    description: "Peugeot 308 con cambio automatico e ampio spazio interno.", 
    featured: false, condition: "2Life", badges: [] },
  
  // Toyota
  { title: "Toyota Yaris", brandId: 9, categoryId: 4, model: "Yaris", 
    year: 2022, mileage: 15000, color: "Rosso", interiorColor: "Nero", 
    fuelType: "Ibrida", transmission: "Automatica", power: 116, 
    description: "Toyota Yaris ibrida con bassissimi consumi e tecnologia avanzata.", 
    featured: true, condition: "Nuova", badges: ["promo"] },
  
  { title: "Toyota Aygo", brandId: 9, categoryId: 4, model: "Aygo", 
    year: 2020, mileage: 35000, color: "Nero", interiorColor: "Grigio", 
    fuelType: "Benzina", transmission: "Manuale", power: 72, 
    description: "Toyota Aygo, la citycar perfetta con consumi ridotti al minimo.", 
    featured: false, condition: "2Life", badges: ["economica"] },
  
  // Opel
  { title: "Opel Corsa", brandId: 10, categoryId: 4, model: "Corsa", 
    year: 2023, mileage: 7000, color: "Blu", interiorColor: "Nero", 
    fuelType: "Elettrica", transmission: "Automatica", power: 136, 
    description: "Opel Corsa elettrica con ricarica rapida e autonomia di 330 km.", 
    featured: true, condition: "Nuova", badges: ["promo", "zero emissioni"] },
  
  { title: "Opel Astra", brandId: 10, categoryId: 4, model: "Astra", 
    year: 2022, mileage: 20000, color: "Argento", interiorColor: "Nero", 
    fuelType: "Diesel", transmission: "Manuale", power: 130, 
    description: "Opel Astra con motore diesel efficiente e interni spaziosi.", 
    featured: false, condition: "Nuova", badges: ["promo"] }
];

async function addCars() {
  try {
    console.log("Iniziando l'aggiunta della seconda batch di auto piccole...");
    
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
      const features = [
        "Climatizzatore", 
        "Chiusura centralizzata", 
        "Alzacristalli elettrici", 
        "Radio",
        "Bluetooth",
        "USB",
        "Sensori di parcheggio",
        "Cruise Control",
        "Cerchi in lega"
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