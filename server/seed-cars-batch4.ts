import { db } from './db';
import { InsertVehicle, vehicles, brands, categories } from '@shared/schema';

// Definiamo gli ultimi marchi
const carBrands = [
  { id: 16, name: "Skoda", logo: "skoda_logo.jpg" },
  { id: 17, name: "Dacia", logo: "dacia_logo.jpg" },
  { id: 18, name: "Suzuki", logo: "suzuki_logo.jpg" },
  { id: 19, name: "Mazda", logo: "mazda_logo.jpg" },
  { id: 20, name: "Mini", logo: "mini_logo.jpg" }
];

// Categorie
const berlina = { id: 5, name: "Berlina Compatta", image: "berlina_compatta_category.jpg" };

// Quarta batch di auto piccole (20 per completare i 50 richiesti)
const smallCars = [
  // Skoda
  { title: "Skoda Fabia", brandId: 16, categoryId: 4, model: "Fabia", 
    year: 2023, mileage: 5000, color: "Blu", interiorColor: "Grigio", 
    fuelType: "Benzina", transmission: "Manuale", power: 95, 
    description: "Skoda Fabia con ampio bagagliaio e soluzioni Simply Clever.", 
    featured: false, condition: "Nuova", badges: ["promo"] },
  
  { title: "Skoda Citigo", brandId: 16, categoryId: 4, model: "Citigo", 
    year: 2020, mileage: 30000, color: "Bianco", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Manuale", power: 60, 
    description: "Skoda Citigo compatta ed economica, ideale per la città.", 
    featured: false, condition: "2Life", badges: ["economica"] },
  
  { title: "Skoda Scala", brandId: 16, categoryId: 5, model: "Scala", 
    year: 2022, mileage: 15000, color: "Grigio", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Automatica", power: 116, 
    description: "Skoda Scala con tecnologia avanzata e spazio interno generoso.", 
    featured: true, condition: "Nuova", badges: ["promo"] },
  
  // Dacia
  { title: "Dacia Sandero", brandId: 17, categoryId: 4, model: "Sandero", 
    year: 2022, mileage: 8000, color: "Blu", interiorColor: "Grigio", 
    fuelType: "GPL", transmission: "Manuale", power: 90, 
    description: "Dacia Sandero GPL con costi di gestione ridotti e ottimo rapporto qualità-prezzo.", 
    featured: true, condition: "Nuova", badges: ["promo", "economica"] },
  
  { title: "Dacia Logan", brandId: 17, categoryId: 5, model: "Logan", 
    year: 2021, mileage: 25000, color: "Bianco", interiorColor: "Nero", 
    fuelType: "Diesel", transmission: "Manuale", power: 95, 
    description: "Dacia Logan, la berlina economica con ampio bagagliaio.", 
    featured: false, condition: "2Life", badges: [] },
  
  // Suzuki
  { title: "Suzuki Swift", brandId: 18, categoryId: 4, model: "Swift", 
    year: 2023, mileage: 6000, color: "Rosso", interiorColor: "Nero", 
    fuelType: "Ibrida", transmission: "Manuale", power: 83, 
    description: "Suzuki Swift ibrida con consumi ridotti e piacere di guida.", 
    featured: false, condition: "Nuova", badges: ["promo"] },
  
  { title: "Suzuki Ignis", brandId: 18, categoryId: 4, model: "Ignis", 
    year: 2022, mileage: 12000, color: "Arancione", interiorColor: "Nero", 
    fuelType: "Ibrida", transmission: "Manuale", power: 83, 
    description: "Suzuki Ignis, il mini SUV con tecnologia ibrida e stile unico.", 
    featured: false, condition: "Nuova", badges: ["promo"] },
  
  { title: "Suzuki Baleno", brandId: 18, categoryId: 4, model: "Baleno", 
    year: 2021, mileage: 20000, color: "Blu", interiorColor: "Grigio", 
    fuelType: "Benzina", transmission: "Manuale", power: 90, 
    description: "Suzuki Baleno spaziosa e ben equipaggiata con prezzo competitivo.", 
    featured: false, condition: "2Life", badges: [] },
  
  // Mazda
  { title: "Mazda 2", brandId: 19, categoryId: 4, model: "2", 
    year: 2023, mileage: 5000, color: "Rosso", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Manuale", power: 90, 
    description: "Mazda 2 con design KODO e tecnologia Skyactiv per il massimo piacere di guida.", 
    featured: true, condition: "Nuova", badges: ["promo"] },
  
  { title: "Mazda 3", brandId: 19, categoryId: 5, model: "3", 
    year: 2022, mileage: 15000, color: "Grigio", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Automatica", power: 122, 
    description: "Mazda 3 con interni premium e dinamica di guida raffinata.", 
    featured: true, condition: "Nuova", badges: ["promo"] },
  
  // Mini
  { title: "Mini Cooper", brandId: 20, categoryId: 4, model: "Cooper", 
    year: 2022, mileage: 10000, color: "Nero", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Automatica", power: 136, 
    description: "Mini Cooper con carattere sportivo e stile inconfondibile.", 
    featured: true, condition: "Nuova", badges: ["promo"] },
  
  { title: "Mini One", brandId: 20, categoryId: 4, model: "One", 
    year: 2021, mileage: 20000, color: "Bianco", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Manuale", power: 102, 
    description: "Mini One con consumi contenuti e design iconico.", 
    featured: false, condition: "2Life", badges: [] },
  
  // Altri modelli di marchi già presenti per completare 50 veicoli
  
  // Fiat
  { title: "Fiat 500X", brandId: 5, categoryId: 4, model: "500X", 
    year: 2023, mileage: 7000, color: "Grigio", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Manuale", power: 120, 
    description: "Fiat 500X con stile italiano e dotazioni complete.", 
    featured: false, condition: "Nuova", badges: ["promo"] },
  
  // Volkswagen
  { title: "Volkswagen T-Cross", brandId: 4, categoryId: 4, model: "T-Cross", 
    year: 2022, mileage: 12000, color: "Bianco", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Automatica", power: 115, 
    description: "Volkswagen T-Cross, il crossover compatto e versatile.", 
    featured: false, condition: "Nuova", badges: ["promo"] },
  
  // Toyota
  { title: "Toyota Corolla", brandId: 9, categoryId: 5, model: "Corolla", 
    year: 2023, mileage: 8000, color: "Blu", interiorColor: "Beige", 
    fuelType: "Ibrida", transmission: "Automatica", power: 122, 
    description: "Toyota Corolla ibrida, efficienza e comfort ai massimi livelli.", 
    featured: true, condition: "Nuova", badges: ["promo"] },
  
  // Renault
  { title: "Renault Zoe", brandId: 7, categoryId: 4, model: "Zoe", 
    year: 2022, mileage: 10000, color: "Bianco", interiorColor: "Grigio", 
    fuelType: "Elettrica", transmission: "Automatica", power: 135, 
    description: "Renault Zoe 100% elettrica con grande autonomia e zero emissioni.", 
    featured: true, condition: "Nuova", badges: ["promo", "zero emissioni"] },
  
  // Citroen
  { title: "Citroen C4", brandId: 11, categoryId: 5, model: "C4", 
    year: 2023, mileage: 6000, color: "Grigio", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Automatica", power: 130, 
    description: "Citroen C4 con comfort eccezionale e design originale.", 
    featured: false, condition: "Nuova", badges: ["promo"] },
  
  // Hyundai
  { title: "Hyundai i30", brandId: 13, categoryId: 5, model: "i30", 
    year: 2022, mileage: 15000, color: "Argento", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Manuale", power: 120, 
    description: "Hyundai i30 con 5 anni di garanzia e dotazioni complete.", 
    featured: false, condition: "Nuova", badges: ["promo"] },
  
  // Kia
  { title: "Kia Ceed", brandId: 12, categoryId: 5, model: "Ceed", 
    year: 2023, mileage: 7000, color: "Nero", interiorColor: "Nero", 
    fuelType: "Benzina", transmission: "Automatica", power: 140, 
    description: "Kia Ceed con 7 anni di garanzia e finiture di qualità premium.", 
    featured: true, condition: "Nuova", badges: ["promo"] }
];

async function addCars() {
  try {
    console.log("Iniziando l'aggiunta della quarta batch di auto...");
    
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
    
    // Aggiungi la categoria Berlina Compatta se non esiste
    const existingBerlinaCategory = await db.query.categories.findFirst({
      where: (categories, { eq }) => eq(categories.id, 5)
    });
    
    if (!existingBerlinaCategory) {
      console.log(`Aggiungendo la categoria: ${berlina.name}`);
      await db.insert(categories).values(berlina);
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
        "Volante multifunzione",
        "Sensore pioggia",
        "Sensore luci",
        "Sistema keyless"
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