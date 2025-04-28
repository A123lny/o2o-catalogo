import { db } from './db';
import { brands, categories, users, vehicles, rentalOptions } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Funzione per aggiungere veicoli usati (2Life)
async function addUsedVehicles() {
  try {
    console.log('Aggiunta veicoli 2Life...');
    
    // Recuperiamo gli ID dei marchi e delle categorie
    const brandsData = await db.select().from(brands);
    const categoriesData = await db.select().from(categories);
    
    const brandMap = new Map(brandsData.map(b => [b.name, b.id]));
    const categoryMap = new Map(categoriesData.map(c => [c.name, c.id]));
    
    // Lista dei veicoli 2Life da aggiungere
    const usedVehiclesList = [
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
    ];
    
    // Aggiungiamo i veicoli
    for (const vehicle of usedVehiclesList) {
      console.log(`Aggiungo veicolo: ${vehicle.title}`);
      const [newVehicle] = await db.insert(vehicles).values(vehicle).returning();
      
      if (newVehicle) {
        // Valore base per le opzioni di noleggio
        const baseMonthlyPrice = vehicle.power * 1.2;
        
        // Opzione NLT per alcune auto 2Life
        if (vehicle.mileage < 30000) {
          await db.insert(rentalOptions).values({
            vehicleId: newVehicle.id,
            type: "NLT",
            duration: 24,
            deposit: Math.round(baseMonthlyPrice * 2),
            caution: Math.round(baseMonthlyPrice * 0.5),
            setupFee: 250,
            monthlyPrice: Math.round(baseMonthlyPrice * 0.8),
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
          deposit: Math.round(baseMonthlyPrice * 2.5),
          caution: Math.round(baseMonthlyPrice * 0.5),
          setupFee: 250,
          monthlyPrice: Math.round(baseMonthlyPrice * 0.9),
          annualMileage: 15000,
          finalPayment: Math.round(baseMonthlyPrice * 12), // Valore di riscatto finale
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
    
    console.log('✅ Veicoli 2Life aggiunti con successo');

  } catch (error) {
    console.error('❌ Errore durante l\'aggiunta dei veicoli 2Life:', error);
  }
}

// Avvio dell'aggiunta dei veicoli usati
addUsedVehicles()
  .then(() => {
    console.log('✅ Operazione completata');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Errore critico:', error);
    process.exit(1);
  });