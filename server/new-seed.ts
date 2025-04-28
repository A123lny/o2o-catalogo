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
      { name: 'Porsche', logo: 'porsche_logo.jpg' },
      { name: 'Fiat', logo: 'fiat_logo.jpg' },
      { name: 'Ford', logo: 'ford_logo.jpg' },
      { name: 'Toyota', logo: 'toyota_logo.jpg' },
      { name: 'Renault', logo: 'renault_logo.jpg' },
      { name: 'Volvo', logo: 'volvo_logo.jpg' }
    ];

    const brandsExist = await db.select().from(brands);
    
    if (brandsExist.length < brandsList.length) {
      for (const brand of brandsList) {
        const existing = brandsExist.find(b => b.name === brand.name);
        if (!existing) {
          await db.insert(brands).values(brand);
        }
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
      { name: 'Cabriolet', image: 'convertible_category.jpg' },
      { name: 'Citycar', image: 'citycar_category.jpg' },
      { name: 'Van', image: 'van_category.jpg' },
      { name: 'Crossover', image: 'crossover_category.jpg' }
    ];

    const categoriesExist = await db.select().from(categories);
    
    if (categoriesExist.length < categoriesList.length) {
      for (const category of categoriesList) {
        const existing = categoriesExist.find(c => c.name === category.name);
        if (!existing) {
          await db.insert(categories).values(category);
        }
      }
      console.log('✅ Categorie aggiunte');
    } else {
      console.log('⚠️ Categorie già esistenti, salto la creazione');
    }

    // Recuperiamo gli ID dei marchi e delle categorie
    const brandsData = await db.select().from(brands);
    const categoriesData = await db.select().from(categories);
    
    const brandMap = new Map(brandsData.map(b => [b.name, b.id]));
    const categoryMap = new Map(categoriesData.map(c => [c.name, c.id]));

    // Eliminiamo i veicoli esistenti per evitare duplicati
    const vehiclesExist = await db.select().from(vehicles);
    
    if (vehiclesExist.length > 0) {
      // Elimina prima le opzioni di noleggio associate
      for (const vehicle of vehiclesExist) {
        await db.delete(rentalOptions).where(eq(rentalOptions.vehicleId, vehicle.id));
      }
      
      // Poi elimina i veicoli
      await db.delete(vehicles);
      console.log('✅ Veicoli e opzioni di noleggio esistenti rimossi');
    }
    
    // Lista di 20 veicoli diversi (nuovi e 2Life)
    const vehiclesList = [
      // Auto Nuove
      {
        title: "Audi A7 Sportback",
        brandId: brandMap.get('Audi'),
        categoryId: categoryMap.get('Berlina'),
        model: "A7",
        year: 2023,
        color: "Nero Metallizzato",
        interiorColor: "Pelle Nera",
        description: "Berlina sportiva dal design accattivante e prestazioni eccezionali. L'Audi A7 Sportback combina eleganza e potenza in un'unica auto. Dotata delle più recenti tecnologie di assistenza alla guida e di intrattenimento, offre un'esperienza di guida senza pari.",
        mileage: 0,
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
        year: 2023,
        color: "Blu Metallizzato",
        interiorColor: "Pelle Beige",
        description: "La BMW Serie 5 è l'emblema dell'eleganza sportiva. Con il suo design raffinato e le prestazioni eccezionali, questa berlina di lusso offre il massimo in termini di comfort e tecnologia.",
        mileage: 0,
        price: 75000,
        discountPrice: null,
        power: 320,
        transmission: "Automatico",
        condition: "Nuovo",
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
        interiorColor: "Pelle Nera",
        description: "Il Mercedes-Benz GLE Coupé unisce l'eleganza di una coupé con la robustezza di un SUV. Con interni lussuosi e tecnologie all'avanguardia, offre un'esperienza di guida impareggiabile.",
        mileage: 0,
        price: 95000,
        discountPrice: 92000,
        power: 380,
        transmission: "Automatico",
        condition: "Nuovo",
        fuelType: "Ibrida",
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
        title: "Volkswagen ID.4",
        brandId: brandMap.get('Volkswagen'),
        categoryId: categoryMap.get('SUV'),
        model: "ID.4",
        year: 2023,
        color: "Bianco",
        interiorColor: "Grigio",
        description: "Il Volkswagen ID.4 è un SUV completamente elettrico che combina tecnologia all'avanguardia, spaziosità e autonomia elettrica impressionante. Perfetto per chi cerca una mobilità sostenibile senza compromessi.",
        mileage: 0,
        price: 55000,
        discountPrice: 52000,
        power: 204,
        transmission: "Automatico",
        condition: "Nuovo",
        fuelType: "Elettrica",
        features: [
          "Display touch da 12\"",
          "ID. Light",
          "Travel Assist",
          "Ricarica rapida DC",
          "Climatizzatore automatico a 3 zone",
          "Sistema audio premium",
          "Head-up display AR",
          "Cerchi in lega da 20\""
        ],
        badges: ["Elettrico", "SUV", "Zero Emissioni"],
        mainImage: "https://cdn.motor1.com/images/mgl/vRe3Z/s1/4x3/volkswagen-id.4-gtx.webp",
        images: [
          "https://cdn.motor1.com/images/mgl/vRe3Z/s1/4x3/volkswagen-id.4-gtx.webp"
        ],
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Porsche 911 Carrera",
        brandId: brandMap.get('Porsche'),
        categoryId: categoryMap.get('Coupé'),
        model: "911 Carrera",
        year: 2023,
        color: "Rosso",
        interiorColor: "Pelle Nera",
        description: "L'iconica Porsche 911 Carrera rappresenta l'apice dell'ingegneria automobilistica tedesca. Con prestazioni straordinarie e un design senza tempo, continua a stabilire lo standard per le auto sportive di lusso.",
        mileage: 0,
        price: 150000,
        discountPrice: 145000,
        power: 450,
        transmission: "PDK",
        condition: "Nuovo",
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
        interiorColor: "Tessuto Nero/Rosso",
        description: "La Volkswagen Golf GTI combina prestazioni sportive con praticità quotidiana. L'ultima generazione offre tecnologia avanzata, design distintivo e l'inconfondibile piacere di guida GTI.",
        mileage: 0,
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
      },
      {
        title: "Toyota RAV4",
        brandId: brandMap.get('Toyota'),
        categoryId: categoryMap.get('SUV'),
        model: "RAV4",
        year: 2023,
        color: "Verde Scuro",
        interiorColor: "Tessuto Nero",
        description: "Il Toyota RAV4 è un SUV versatile e affidabile con tecnologia ibrida avanzata. Offre un'ottima economia di carburante, spazio interno generoso e caratteristiche di sicurezza all'avanguardia.",
        mileage: 0,
        price: 42000,
        discountPrice: 39500,
        power: 222,
        transmission: "Automatico",
        condition: "Nuovo",
        fuelType: "Ibrida",
        features: [
          "Toyota Safety Sense 2.0",
          "Display touch da 9\"",
          "Apple CarPlay e Android Auto wireless",
          "Trazione integrale intelligente",
          "Sedili riscaldati",
          "Portellone posteriore elettrico",
          "Sistema audio JBL"
        ],
        badges: ["SUV", "Ibrido", "Economico"],
        mainImage: "https://cdn.wheel-size.com/uploads/2022/10/Toyota-RAV4-2023.jpg",
        images: [
          "https://cdn.wheel-size.com/uploads/2022/10/Toyota-RAV4-2023.jpg"
        ],
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Ford Kuga",
        brandId: brandMap.get('Ford'),
        categoryId: categoryMap.get('SUV'),
        model: "Kuga",
        year: 2023,
        color: "Argento",
        interiorColor: "Tessuto Grigio",
        description: "La Ford Kuga è un SUV moderno con opzioni di motorizzazione ibrida plug-in. Offre un'eccellente combinazione di efficienza, spazio e tecnologia.",
        mileage: 0,
        price: 38000,
        discountPrice: 36000,
        power: 225,
        transmission: "Automatico",
        condition: "Nuovo",
        fuelType: "Ibrida Plug-in",
        features: [
          "SYNC 4 con display touch da 13,2\"",
          "Ford Co-Pilot360",
          "Ricarica wireless per smartphone",
          "Portellone posteriore hands-free",
          "Sistema audio B&O",
          "Tetto panoramico apribile"
        ],
        badges: ["SUV", "Ibrido Plug-in"],
        mainImage: "https://www.ford.it/content/dam/guxeu/rhd/central/cars/2023-kuga/launch/gallery/exterior/ford-kuga-eu-CGN_8528-16x9-2160x1215-moondust-silver.jpg",
        images: [
          "https://www.ford.it/content/dam/guxeu/rhd/central/cars/2023-kuga/launch/gallery/exterior/ford-kuga-eu-CGN_8528-16x9-2160x1215-moondust-silver.jpg"
        ],
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Volvo XC60",
        brandId: brandMap.get('Volvo'),
        categoryId: categoryMap.get('SUV'),
        model: "XC60",
        year: 2023,
        color: "Blu Scuro",
        interiorColor: "Pelle Beige",
        description: "Il Volvo XC60 è un SUV di lusso che combina eleganza scandinava, sicurezza avanzata e motorizzazioni ibride efficienti. Un'auto premium per chi non vuole rinunciare a comfort, tecnologia e sostenibilità.",
        mileage: 0,
        price: 62000,
        discountPrice: 59000,
        power: 340,
        transmission: "Automatico",
        condition: "Nuovo",
        fuelType: "Ibrida Plug-in",
        features: [
          "Sistema di infotainment Google integrato",
          "Quadro strumenti digitale da 12,3\"",
          "Impianto audio premium Bowers & Wilkins",
          "Tetto panoramico",
          "Sedili anteriori ventilati e riscaldati",
          "City Safety",
          "Pilot Assist"
        ],
        badges: ["SUV", "Premium", "Ibrido Plug-in"],
        mainImage: "https://www.volvocars.com/images/v/-/media/applications/pdpspecificationpage/xc60-hybrid/xc60-recharge-phev-my22-campaigns-pdp-gallery-1-16x9.jpg",
        images: [
          "https://www.volvocars.com/images/v/-/media/applications/pdpspecificationpage/xc60-hybrid/xc60-recharge-phev-my22-campaigns-pdp-gallery-1-16x9.jpg"
        ],
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Fiat 500e",
        brandId: brandMap.get('Fiat'),
        categoryId: categoryMap.get('Citycar'),
        model: "500e",
        year: 2023,
        color: "Verde Chiaro",
        interiorColor: "Tessuto Eco",
        description: "La Fiat 500e è una city car completamente elettrica che combina lo stile iconico della 500 con una tecnologia a zero emissioni. Perfetta per la mobilità urbana sostenibile.",
        mileage: 0,
        price: 35000,
        discountPrice: 33500,
        power: 118,
        transmission: "Automatico",
        condition: "Nuovo",
        fuelType: "Elettrica",
        features: [
          "Display touch da 10,25\"",
          "Caricatore wireless per smartphone",
          "Sistemi di assistenza alla guida",
          "Tetto in vetro",
          "Climatizzatore automatico",
          "Fari full LED"
        ],
        badges: ["Elettrica", "City Car", "Design"],
        mainImage: "https://cdn.motor1.com/images/mgl/Wb6m9/s3/nuova-fiat-500e-2021.jpg",
        images: [
          "https://cdn.motor1.com/images/mgl/Wb6m9/s3/nuova-fiat-500e-2021.jpg"
        ],
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Auto 2Life (Usate)
      {
        title: "Audi Q5 2Life",
        brandId: brandMap.get('Audi'),
        categoryId: categoryMap.get('SUV'),
        model: "Q5",
        year: 2021,
        color: "Grigio Metallizzato",
        interiorColor: "Pelle Nera",
        description: "Audi Q5 in eccellenti condizioni, con storico manutenzioni completo. Questo SUV di lusso offre un perfetto equilibrio tra comfort, prestazioni e praticità. Completamente controllato e garantito.",
        mileage: 25000,
        price: 46000,
        discountPrice: 44000,
        power: 286,
        transmission: "Automatico",
        condition: "2Life",
        fuelType: "Diesel",
        features: [
          "Navigatore MMI",
          "Sensori di parcheggio anteriori e posteriori",
          "Sedili riscaldati",
          "Portellone elettrico",
          "Cerchi in lega da 19\"",
          "Fari full LED",
          "Telecamera posteriore"
        ],
        badges: ["SUV", "2Life", "Premium"],
        mainImage: "https://www.audi.it/content/dam/nemo/models/q5/q5/my-2022/nemo-derivate-startpage/stage/1920x1080-q5_2020_1937.jpg",
        images: [
          "https://www.audi.it/content/dam/nemo/models/q5/q5/my-2022/nemo-derivate-startpage/stage/1920x1080-q5_2020_1937.jpg"
        ],
        featured: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "BMW X3 2Life",
        brandId: brandMap.get('BMW'),
        categoryId: categoryMap.get('SUV'),
        model: "X3",
        year: 2020,
        color: "Nero",
        interiorColor: "Pelle Marrone",
        description: "BMW X3 in perfette condizioni, con chilometraggio certificato. Questo SUV di lusso offre prestazioni sportive, tecnologia avanzata e ampio spazio interno. Completamente revisionato e con garanzia estesa.",
        mileage: 32000,
        price: 43000,
        discountPrice: 41000,
        power: 265,
        transmission: "Automatico",
        condition: "2Life",
        fuelType: "Diesel",
        features: [
          "Sistema di navigazione professionale",
          "Head-up Display",
          "Sedili sportivi in pelle",
          "Tetto panoramico",
          "Cerchi in lega da 20\"",
          "Assistente alla guida Plus",
          "Harman Kardon surround sound system"
        ],
        badges: ["SUV", "2Life", "Premium"],
        mainImage: "https://imgd.aeplcdn.com/1200x900/n/cw/ec/51909/bmw-x3-right-front-three-quarter8.jpeg",
        images: [
          "https://imgd.aeplcdn.com/1200x900/n/cw/ec/51909/bmw-x3-right-front-three-quarter8.jpeg"
        ],
        featured: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Mercedes-Benz Classe C 2Life",
        brandId: brandMap.get('Mercedes-Benz'),
        categoryId: categoryMap.get('Berlina'),
        model: "Classe C",
        year: 2020,
        color: "Argento",
        interiorColor: "Pelle Nera",
        description: "Mercedes-Benz Classe C in ottime condizioni, con un solo proprietario e manutenzione presso rete ufficiale. Elegante berlina che combina comfort, tecnologia e prestazioni. Certificata e garantita.",
        mileage: 40000,
        price: 39000,
        discountPrice: 36500,
        power: 220,
        transmission: "Automatico",
        condition: "2Life",
        fuelType: "Diesel",
        features: [
          "Navigatore COMAND",
          "Pacchetto luci ambiente",
          "Sedili anteriori riscaldati",
          "KEYLESS-GO",
          "Cerchi in lega AMG",
          "Fari MULTIBEAM LED",
          "Pacchetto parcheggio con telecamera 360°"
        ],
        badges: ["Berlina", "2Life", "Premium"],
        mainImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/2021_Mercedes-Benz_C_200_AMG_Line_Premium_Plus_Edition_1.5_Front.jpg/1200px-2021_Mercedes-Benz_C_200_AMG_Line_Premium_Plus_Edition_1.5_Front.jpg",
        images: [
          "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/2021_Mercedes-Benz_C_200_AMG_Line_Premium_Plus_Edition_1.5_Front.jpg/1200px-2021_Mercedes-Benz_C_200_AMG_Line_Premium_Plus_Edition_1.5_Front.jpg"
        ],
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Volkswagen Golf 2Life",
        brandId: brandMap.get('Volkswagen'),
        categoryId: categoryMap.get('Berlina'),
        model: "Golf",
        year: 2021,
        color: "Blu",
        interiorColor: "Tessuto Nero",
        description: "Volkswagen Golf in eccellenti condizioni, con pacchetto tecnologico completo. Questa compatta offre un perfetto equilibrio tra comfort di guida, tecnologia e praticità. Revisionata e garantita.",
        mileage: 22000,
        price: 28000,
        discountPrice: 27000,
        power: 150,
        transmission: "DSG",
        condition: "2Life",
        fuelType: "Benzina",
        features: [
          "Navigatore Discover Pro",
          "Digital Cockpit",
          "App-Connect",
          "ACC - Adaptive Cruise Control",
          "Front Assist",
          "Cerchi in lega da 17\"",
          "Fari LED"
        ],
        badges: ["Compatta", "2Life", "Economica"],
        mainImage: "https://cdn.motor1.com/images/mgl/nOl7O/s3/volkswagen-golf-2020.jpg",
        images: [
          "https://cdn.motor1.com/images/mgl/nOl7O/s3/volkswagen-golf-2020.jpg"
        ],
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Fiat 500X 2Life",
        brandId: brandMap.get('Fiat'),
        categoryId: categoryMap.get('Crossover'),
        model: "500X",
        year: 2020,
        color: "Rosso",
        interiorColor: "Tessuto Nero",
        description: "Fiat 500X in ottime condizioni, perfetta come prima auto o per la famiglia. Questo crossover compatto combina stile italiano, praticità e bassi costi di gestione. Completamente controllata e garantita.",
        mileage: 28000,
        price: 20000,
        discountPrice: 18500,
        power: 120,
        transmission: "Manuale",
        condition: "2Life",
        fuelType: "Benzina",
        features: [
          "Sistema Uconnect con touchscreen da 7\"",
          "Apple CarPlay e Android Auto",
          "Sensori di parcheggio",
          "Clima automatico",
          "Cerchi in lega da 17\"",
          "Cruise control"
        ],
        badges: ["Crossover", "2Life", "Economica"],
        mainImage: "https://cdn.motor1.com/images/mgl/WBLJl/s3/fiat-500x-sport-2019.jpg",
        images: [
          "https://cdn.motor1.com/images/mgl/WBLJl/s3/fiat-500x-sport-2019.jpg"
        ],
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Toyota Yaris 2Life",
        brandId: brandMap.get('Toyota'),
        categoryId: categoryMap.get('Citycar'),
        model: "Yaris",
        year: 2021,
        color: "Bianco",
        interiorColor: "Tessuto Grigio",
        description: "Toyota Yaris Hybrid in perfette condizioni, ideale per la città grazie alla sua efficienza eccezionale. Una city car ibrida che combina bassi consumi, affidabilità Toyota e facilità di parcheggio. Controllata e garantita.",
        mileage: 18000,
        price: 20000,
        discountPrice: 19000,
        power: 116,
        transmission: "Automatico",
        condition: "2Life",
        fuelType: "Ibrida",
        features: [
          "Toyota Touch 2",
          "Smart Entry & Start",
          "Sistema audio JBL",
          "Toyota Safety Sense",
          "Cerchi in lega da 16\"",
          "Retrovisori ripiegabili elettricamente"
        ],
        badges: ["City Car", "2Life", "Ibrida"],
        mainImage: "https://cdn.motor1.com/images/mgl/kbyre/s1/toyota-yaris-hybrid-2020.jpg",
        images: [
          "https://cdn.motor1.com/images/mgl/kbyre/s1/toyota-yaris-hybrid-2020.jpg"
        ],
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Ford Focus SW 2Life",
        brandId: brandMap.get('Ford'),
        categoryId: categoryMap.get('Station Wagon'),
        model: "Focus",
        year: 2020,
        color: "Grigio",
        interiorColor: "Tessuto Nero",
        description: "Ford Focus Station Wagon in eccellenti condizioni, perfetta per famiglie che cercano spazio e versatilità. Questa station wagon offre guida sportiva, ampio bagagliaio e tecnologia avanzata. Revisionata e garantita.",
        mileage: 35000,
        price: 22000,
        discountPrice: 20500,
        power: 150,
        transmission: "Manuale",
        condition: "2Life",
        fuelType: "Diesel",
        features: [
          "SYNC 3 con touchscreen da 8\"",
          "Apple CarPlay e Android Auto",
          "Assistente di parcheggio",
          "Portellone hands-free",
          "Cerchi in lega da 17\"",
          "Fari automatici"
        ],
        badges: ["Station Wagon", "2Life", "Spazio"],
        mainImage: "https://cdn.motor1.com/images/mgl/LrX2y/s3/ford-focus-active-wagon-2018.jpg",
        images: [
          "https://cdn.motor1.com/images/mgl/LrX2y/s3/ford-focus-active-wagon-2018.jpg"
        ],
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Renault Captur 2Life",
        brandId: brandMap.get('Renault'),
        categoryId: categoryMap.get('Crossover'),
        model: "Captur",
        year: 2020,
        color: "Arancione/Nero",
        interiorColor: "Tessuto Grigio",
        description: "Renault Captur in ottime condizioni, un crossover urbano versatile e stiloso. Offre un abitacolo modulare, tecnologia intuitiva e consumi contenuti. Controllata e garantita.",
        mileage: 30000,
        price: 19000,
        discountPrice: 17500,
        power: 130,
        transmission: "Automatico",
        condition: "2Life",
        fuelType: "Benzina",
        features: [
          "EASY LINK con touchscreen da 9,3\"",
          "Multi-Sense con 3 modalità di guida",
          "Sedili scorrevoli",
          "Parking camera",
          "Cerchi in lega da 17\"",
          "Frenata di emergenza attiva"
        ],
        badges: ["Crossover", "2Life", "Compatto"],
        mainImage: "https://cdn.motor1.com/images/mgl/JYpGO/s3/nuova-renault-captur-2020.jpg",
        images: [
          "https://cdn.motor1.com/images/mgl/JYpGO/s3/nuova-renault-captur-2020.jpg"
        ],
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Volvo V60 2Life",
        brandId: brandMap.get('Volvo'),
        categoryId: categoryMap.get('Station Wagon'),
        model: "V60",
        year: 2020,
        color: "Blu Scuro",
        interiorColor: "Pelle Beige",
        description: "Volvo V60 in eccellenti condizioni, una station wagon premium con il massimo della sicurezza. Combina eleganza scandinava, tecnologia avanzata e generoso spazio di carico. Certificata e garantita.",
        mileage: 35000,
        price: 34000,
        discountPrice: 32000,
        power: 190,
        transmission: "Automatico",
        condition: "2Life",
        fuelType: "Diesel",
        features: [
          "Sensus Navigation",
          "Volvo On Call",
          "City Safety",
          "Sedili anteriori riscaldati",
          "Portellone elettrico",
          "Cerchi in lega da 18\"",
          "Sistema audio Harman Kardon"
        ],
        badges: ["Station Wagon", "2Life", "Premium"],
        mainImage: "https://cdn.motor1.com/images/mgl/YAqGP/s3/volvo-v60-2018.jpg",
        images: [
          "https://cdn.motor1.com/images/mgl/YAqGP/s3/volvo-v60-2018.jpg"
        ],
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Ford Mustang 2Life",
        brandId: brandMap.get('Ford'),
        categoryId: categoryMap.get('Coupé'),
        model: "Mustang",
        year: 2019,
        color: "Rosso",
        interiorColor: "Pelle Nera",
        description: "Ford Mustang in condizioni impeccabili, un'icona americana di potenza e stile. Questa muscle car offre prestazioni entusiasmanti, sound inconfondibile e presenza scenica. Completamente revisionata e garantita.",
        mileage: 40000,
        price: 45000,
        discountPrice: 42000,
        power: 450,
        transmission: "Automatico",
        condition: "2Life",
        fuelType: "Benzina",
        features: [
          "SYNC 3 con touchscreen da 8\"",
          "Quadro strumenti digitale da 12\"",
          "Modalità di guida selezionabili",
          "Sedili sportivi in pelle",
          "Impianto audio premium",
          "Cerchi in lega da 19\""
        ],
        badges: ["Sportiva", "2Life", "Americana"],
        mainImage: "https://cdn.motor1.com/images/mgl/xWJJq/s3/ford-mustang.jpg",
        images: [
          "https://cdn.motor1.com/images/mgl/xWJJq/s3/ford-mustang.jpg"
        ],
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Porsche Macan 2Life",
        brandId: brandMap.get('Porsche'),
        categoryId: categoryMap.get('SUV'),
        model: "Macan",
        year: 2020,
        color: "Grigio Metallizzato",
        interiorColor: "Pelle Nera",
        description: "Porsche Macan in eccellenti condizioni, un SUV sportivo che offre il DNA Porsche in un formato versatile. Combina prestazioni entusiasmanti, maneggevolezza da auto sportiva e praticità quotidiana. Certificata e garantita Porsche Approved.",
        mileage: 28000,
        price: 65000,
        discountPrice: 62000,
        power: 354,
        transmission: "PDK",
        condition: "2Life",
        fuelType: "Benzina",
        features: [
          "PCM con navigazione",
          "BOSE Surround Sound System",
          "Tetto panoramico",
          "Sospensioni pneumatiche",
          "Sedili sportivi riscaldati",
          "Cerchi da 20\" Macan Turbo",
          "Pacchetto Sport Chrono"
        ],
        badges: ["SUV", "2Life", "Premium", "Sportivo"],
        mainImage: "https://cdn.motor1.com/images/mgl/0x4KW/s3/porsche-macan-2022.jpg",
        images: [
          "https://cdn.motor1.com/images/mgl/0x4KW/s3/porsche-macan-2022.jpg"
        ],
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Aggiungiamo i veicoli
    for (const vehicle of vehiclesList) {
      const [newVehicle] = await db.insert(vehicles).values(vehicle).returning({ id: vehicles.id });
      
      if (newVehicle) {
        // Per ogni veicolo, aggiungiamo opzioni di noleggio NLT e/o RTB appropriate
        // Auto nuove - più opzioni e prezzi più alti
        if (vehicle.condition === "Nuovo") {
          // Opzione NLT per auto nuove (tutti i veicoli nuovi)
          await db.insert(rentalOptions).values({
            vehicleId: newVehicle.id,
            type: "NLT",
            duration: 36,
            deposit: Math.round(vehicle.price * 0.1),
            caution: Math.round(vehicle.price * 0.02),
            setupFee: 350,
            monthlyPrice: Math.round(vehicle.price / 70),
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
          
          // Seconda opzione NLT per durata diversa
          await db.insert(rentalOptions).values({
            vehicleId: newVehicle.id,
            type: "NLT",
            duration: 48,
            deposit: Math.round(vehicle.price * 0.09),
            caution: Math.round(vehicle.price * 0.02),
            setupFee: 350,
            monthlyPrice: Math.round(vehicle.price / 80),
            annualMileage: 15000,
            finalPayment: null,
            isDefault: false,
            includedServices: [
              "Manutenzione ordinaria e straordinaria",
              "Assicurazione RCA",
              "Assistenza clienti dedicata",
              "Soccorso stradale 24/7",
              "Cambio pneumatici stagionali"
            ]
          });
          
          // Opzione RTB per alcuni veicoli nuovi (non per tutti)
          if (["Benzina", "Diesel"].includes(vehicle.fuelType)) {
            await db.insert(rentalOptions).values({
              vehicleId: newVehicle.id,
              type: "RTB",
              duration: 36,
              deposit: Math.round(vehicle.price * 0.12),
              caution: Math.round(vehicle.price * 0.03),
              setupFee: 350,
              monthlyPrice: Math.round(vehicle.price / 55),
              annualMileage: 20000,
              finalPayment: Math.round(vehicle.price * 0.45),
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
        // Auto 2Life - meno opzioni e prezzi più bassi
        else if (vehicle.condition === "2Life") {
          // Opzione NLT per alcune auto 2Life
          if (vehicle.mileage < 30000) {
            await db.insert(rentalOptions).values({
              vehicleId: newVehicle.id,
              type: "NLT",
              duration: 24,
              deposit: Math.round(vehicle.price * 0.08),
              caution: Math.round(vehicle.price * 0.02),
              setupFee: 250,
              monthlyPrice: Math.round(vehicle.price / 55),
              annualMileage: 15000,
              finalPayment: null,
              isDefault: true,
              includedServices: [
                "Manutenzione ordinaria",
                "Assicurazione RCA",
                "Assistenza clienti dedicata",
                "Soccorso stradale 24/7"
              ]
            });
          }
          
          // Opzione RTB per tutte le auto 2Life
          await db.insert(rentalOptions).values({
            vehicleId: newVehicle.id,
            type: "RTB",
            duration: 24,
            deposit: Math.round(vehicle.price * 0.1),
            caution: Math.round(vehicle.price * 0.02),
            setupFee: 250,
            monthlyPrice: Math.round(vehicle.price / 45),
            annualMileage: 15000,
            finalPayment: Math.round(vehicle.price * 0.35),
            isDefault: vehicle.mileage >= 30000,
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
    
    console.log('✅ 20 veicoli e relative opzioni di noleggio aggiunti');

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