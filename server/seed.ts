import { db } from './db';
import { brands, categories, users, vehicles, rentalOptions } from '@shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { eq } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function seedDatabase() {
  try {
    console.log('Iniziando il seeding del database...');

    // Aggiungiamo un utente admin
    const hashedPassword = await hashPassword('admin123');
    
    const adminExists = await db.select().from(users).where(eq(users.username, 'admin'));
    
    if (adminExists.length === 0) {
      await db.insert(users).values({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@example.com',
        fullName: 'Administrator',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Utente admin creato');
    } else {
      console.log('⚠️ Utente admin già esistente, salto la creazione');
    }

    // Aggiungiamo i marchi
    const brandsList = [
      { name: 'Audi', logo: 'audi_logo.jpg' },
      { name: 'BMW', logo: 'bmw_logo.jpg' },
      { name: 'Mercedes-Benz', logo: 'mercedes_logo.jpg' },
      { name: 'Volkswagen', logo: 'volkswagen_logo.jpg' },
      { name: 'Porsche', logo: 'porsche_logo.jpg' }
    ];

    const brandsExist = await db.select().from(brands);
    
    if (brandsExist.length === 0) {
      for (const brand of brandsList) {
        await db.insert(brands).values(brand);
      }
      console.log('✅ Marchi aggiunti');
    } else {
      console.log('⚠️ Marchi già esistenti, salto la creazione');
    }

    // Aggiungiamo le categorie
    const categoriesList = [
      { name: 'SUV', image: 'suv_category.jpg' },
      { name: 'Berlina', image: 'sedan_category.jpg' },
      { name: 'Station Wagon', image: 'wagon_category.jpg' },
      { name: 'Coupé', image: 'coupe_category.jpg' },
      { name: 'Cabriolet', image: 'convertible_category.jpg' }
    ];

    const categoriesExist = await db.select().from(categories);
    
    if (categoriesExist.length === 0) {
      for (const category of categoriesList) {
        await db.insert(categories).values(category);
      }
      console.log('✅ Categorie aggiunte');
    } else {
      console.log('⚠️ Categorie già esistenti, salto la creazione');
    }

    // Ora aggiungiamo alcuni veicoli
    const vehiclesExist = await db.select().from(vehicles);
    
    if (vehiclesExist.length === 0) {
      // Recuperiamo gli ID dei marchi e delle categorie
      const brandsData = await db.select().from(brands);
      const categoriesData = await db.select().from(categories);
      
      const brandMap = new Map(brandsData.map(b => [b.name, b.id]));
      const categoryMap = new Map(categoriesData.map(c => [c.name, c.id]));
      
      const vehiclesList = [
        {
          title: "Audi A7 Sportback",
          brandId: brandMap.get('Audi'),
          categoryId: categoryMap.get('Berlina'),
          model: "A7",
          year: 2023,
          color: "Nero Metallizzato",
          description: "Berlina sportiva dal design accattivante e prestazioni eccezionali. L'Audi A7 Sportback combina eleganza e potenza in un'unica auto. Dotata delle più recenti tecnologie di assistenza alla guida e di intrattenimento, offre un'esperienza di guida senza pari.",
          mileage: 5000,
          price: 85000,
          discountPrice: 82000,
          power: 340,
          transmission: "Automatico",
          condition: "Nuovo",
          fuelType: "Diesel",
          features: [
            "Tetto panoramico",
            "Navigatore satellitare",
            "Sedili in pelle riscaldati",
            "Sistema audio Bang & Olufsen",
            "Assistente al parcheggio",
            "Head-up display",
            "Adaptive cruise control",
            "Lane assist",
            "Telecamera 360°"
          ],
          badges: ["Premium", "Berlina"],
          mainImage: "https://www.audi.it/content/dam/nemo/models/a7/a7-sportback/my-2022/nemo-derivate-startpage/product-highlight/1080x1920-AA7_181003.jpg",
          images: [
            "https://www.audi.it/content/dam/nemo/models/a7/a7-sportback/my-2022/nemo-derivate-startpage/product-highlight/1080x1920-AA7_181003.jpg",
            "https://www.audi.it/content/dam/nemo/models/a7/a7-sportback/my-2023/feature-gallery/feature-techical-1/1920x1080-audi-a7-sportback-interior.jpg"
          ],
          featured: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: "BMW Serie 5",
          brandId: brandMap.get('BMW'),
          categoryId: categoryMap.get('Berlina'),
          model: "Serie 5",
          year: 2022,
          color: "Blu Metallizzato",
          description: "La BMW Serie 5 è l'emblema dell'eleganza sportiva. Con il suo design raffinato e le prestazioni eccezionali, questa berlina di lusso offre il massimo in termini di comfort e tecnologia.",
          mileage: 12000,
          price: 75000,
          discountPrice: null,
          power: 320,
          transmission: "Automatico",
          condition: "Ottimo",
          fuelType: "Benzina",
          features: [
            "BMW Live Cockpit Professional",
            "Sedili in pelle Dakota",
            "Climatizzatore automatico a 4 zone",
            "Cerchi in lega da 19\"",
            "BMW Intelligent Personal Assistant",
            "Parking Assistant Plus",
            "Driving Assistant Professional",
            "Harman Kardon Surround Sound System"
          ],
          badges: ["Premium", "Berlina"],
          mainImage: "https://cdn.motor1.com/images/mgl/JOB6y/s1/esterno-nuova-bmw-serie-5-touring-2023.jpg",
          images: [
            "https://cdn.motor1.com/images/mgl/JOB6y/s1/esterno-nuova-bmw-serie-5-touring-2023.jpg"
          ],
          featured: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: "Mercedes-Benz GLE Coupé",
          brandId: brandMap.get('Mercedes-Benz'),
          categoryId: categoryMap.get('SUV'),
          model: "GLE Coupé",
          year: 2023,
          color: "Argento",
          description: "Il Mercedes-Benz GLE Coupé unisce l'eleganza di una coupé con la robustezza di un SUV. Con interni lussuosi e tecnologie all'avanguardia, offre un'esperienza di guida impareggiabile.",
          mileage: 3000,
          price: 95000,
          discountPrice: 92000,
          power: 380,
          transmission: "Automatico",
          condition: "Nuovo",
          fuelType: "Ibrido",
          features: [
            "MBUX con display da 12,3\"",
            "Sistema audio Burmester",
            "Tetto panoramico",
            "Sospensioni pneumatiche AIRMATIC",
            "Sedili riscaldati e ventilati",
            "Pacchetto ENERGIZING",
            "Assistente interno MBUX",
            "Head-up display"
          ],
          badges: ["Luxury", "SUV", "Coupé"],
          mainImage: "https://media.mercedes-benz.it/marsMediaSite/GetMedia.do?id=CQ-23021161-1",
          images: [
            "https://media.mercedes-benz.it/marsMediaSite/GetMedia.do?id=CQ-23021161-1"
          ],
          featured: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: "Porsche 911 Carrera",
          brandId: brandMap.get('Porsche'),
          categoryId: categoryMap.get('Coupé'),
          model: "911 Carrera",
          year: 2022,
          color: "Rosso",
          description: "L'iconica Porsche 911 Carrera rappresenta l'apice dell'ingegneria automobilistica tedesca. Con prestazioni straordinarie e un design senza tempo, continua a stabilire lo standard per le auto sportive di lusso.",
          mileage: 7500,
          price: 150000,
          discountPrice: 145000,
          power: 450,
          transmission: "PDK",
          condition: "Ottimo",
          fuelType: "Benzina",
          features: [
            "Porsche Communication Management (PCM)",
            "Pacchetto Sport Chrono",
            "Sistema di scarico sportivo",
            "Cerchi in lega da 20\"/21\"",
            "Porsche Dynamic Chassis Control (PDCC)",
            "Sedili sportivi adattivi Plus",
            "Sistema di navigazione con info traffico"
          ],
          badges: ["Sportiva", "Coupé", "Premium"],
          mainImage: "https://cdn.motor1.com/images/mgl/6ZZ9R/s1/porsche-911-carrera-t-2023.jpg",
          images: [
            "https://cdn.motor1.com/images/mgl/6ZZ9R/s1/porsche-911-carrera-t-2023.jpg"
          ],
          featured: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: "Volkswagen Golf GTI",
          brandId: brandMap.get('Volkswagen'),
          categoryId: categoryMap.get('Berlina'),
          model: "Golf GTI",
          year: 2023,
          color: "Bianco",
          description: "La Volkswagen Golf GTI combina prestazioni sportive con praticità quotidiana. L'ultima generazione offre tecnologia avanzata, design distintivo e l'inconfondibile piacere di guida GTI.",
          mileage: 1000,
          price: 45000,
          discountPrice: null,
          power: 245,
          transmission: "DSG",
          condition: "Nuovo",
          fuelType: "Benzina",
          features: [
            "Digital Cockpit Pro",
            "Sistema di navigazione Discover Pro",
            "Fari LED Matrix IQ.Light",
            "Differenziale a bloccaggio elettronico XDS",
            "App-Connect wireless",
            "Climatizzatore automatico a 3 zone",
            "Sistema audio Harman Kardon",
            "Sedili sportivi in tessuto GTI"
          ],
          badges: ["Sportiva", "Hot Hatch"],
          mainImage: "https://upload.wikimedia.org/wikipedia/commons/9/91/VW_Golf_GTI_VII_Facelift.jpg",
          images: [
            "https://upload.wikimedia.org/wikipedia/commons/9/91/VW_Golf_GTI_VII_Facelift.jpg"
          ],
          featured: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      for (const vehicle of vehiclesList) {
        const [newVehicle] = await db.insert(vehicles).values(vehicle).returning({ id: vehicles.id });
        
        // Aggiungiamo anche le opzioni di noleggio per questo veicolo
        if (newVehicle) {
          if (vehicle.title === "Audi A7 Sportback") {
            await db.insert(rentalOptions).values({
              vehicleId: newVehicle.id,
              type: "NLT",
              duration: 36,
              deposit: 8000,
              caution: 1500,
              setupFee: 350,
              monthlyPrice: 750,
              annualMileage: 15000,
              finalPayment: null,
              isDefault: true,
              includedServices: [
                "Manutenzione ordinaria e straordinaria",
                "Assicurazione RCA",
                "Assistenza clienti dedicata",
                "Soccorso stradale 24/7"
              ]
            });
            
            await db.insert(rentalOptions).values({
              vehicleId: newVehicle.id,
              type: "RTB",
              duration: 36,
              deposit: 9000,
              caution: 1800,
              setupFee: 350,
              monthlyPrice: 920,
              annualMileage: 15000,
              finalPayment: 37500,
              isDefault: false,
              includedServices: [
                "Manutenzione ordinaria",
                "Assicurazione RCA",
                "Assistenza clienti dedicata",
                "Possibilità di riscatto finale"
              ]
            });
          } else if (vehicle.title === "BMW Serie 5") {
            await db.insert(rentalOptions).values({
              vehicleId: newVehicle.id,
              type: "NLT",
              duration: 48,
              deposit: 7500,
              caution: 1500,
              setupFee: 350,
              monthlyPrice: 680,
              annualMileage: 15000,
              finalPayment: null,
              isDefault: true,
              includedServices: [
                "Manutenzione ordinaria e straordinaria",
                "Assicurazione RCA",
                "Assistenza clienti dedicata",
                "Soccorso stradale 24/7"
              ]
            });
          } else if (vehicle.title === "Mercedes-Benz GLE Coupé") {
            await db.insert(rentalOptions).values({
              vehicleId: newVehicle.id,
              type: "NLT",
              duration: 36,
              deposit: 10000,
              caution: 2000,
              setupFee: 350,
              monthlyPrice: 990,
              annualMileage: 15000,
              finalPayment: null,
              isDefault: true,
              includedServices: [
                "Manutenzione ordinaria e straordinaria",
                "Assicurazione RCA",
                "Assistenza clienti dedicata",
                "Soccorso stradale 24/7"
              ]
            });
            
            await db.insert(rentalOptions).values({
              vehicleId: newVehicle.id,
              type: "RTB",
              duration: 48,
              deposit: 12000,
              caution: 2500,
              setupFee: 350,
              monthlyPrice: 1200,
              annualMileage: 20000,
              finalPayment: 42000,
              isDefault: false,
              includedServices: [
                "Manutenzione ordinaria",
                "Assicurazione RCA",
                "Assistenza clienti dedicata",
                "Possibilità di riscatto finale"
              ]
            });
          }
        }
      }
      
      console.log('✅ Veicoli e opzioni di noleggio aggiunti');
    } else {
      console.log('⚠️ Veicoli già esistenti, salto la creazione');
    }

    console.log('✅ Seed completato con successo!');
  } catch (error) {
    console.error('❌ Errore durante il seeding:', error);
  }
}

// Esegui il seed immediatamente
seedDatabase()
  .then(() => {
    console.log('Seeding completato, uscita in corso...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Errore critico durante il seeding:', error);
    process.exit(1);
  });

export { seedDatabase };