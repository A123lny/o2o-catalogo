import { db } from "./db";
import { provinces } from "@shared/schema";
import { sql } from "drizzle-orm";

// Mappa delle province con relativi codici (2 caratteri)
const provinceCodes: { [key: string]: string } = {
  "Agrigento": "AG",
  "Alessandria": "AL",
  "Ancona": "AN",
  "Aosta": "AO",
  "Arezzo": "AR",
  "Ascoli Piceno": "AP",
  "Asti": "AT",
  "Avellino": "AV",
  "Bari": "BA",
  "Barletta-Andria-Trani": "BT",
  "Belluno": "BL",
  "Benevento": "BN",
  "Bergamo": "BG",
  "Biella": "BI",
  "Bologna": "BO",
  "Bolzano": "BZ",
  "Brescia": "BS",
  "Brindisi": "BR",
  "Cagliari": "CA",
  "Caltanissetta": "CL",
  "Campobasso": "CB",
  "Caserta": "CE",
  "Catania": "CT",
  "Catanzaro": "CZ",
  "Chieti": "CH",
  "Como": "CO",
  "Cosenza": "CS",
  "Cremona": "CR",
  "Crotone": "KR",
  "Cuneo": "CN",
  "Enna": "EN",
  "Fermo": "FM",
  "Ferrara": "FE",
  "Firenze": "FI",
  "Foggia": "FG",
  "Forlì-Cesena": "FC",
  "Frosinone": "FR",
  "Genova": "GE",
  "Gorizia": "GO",
  "Grosseto": "GR",
  "Imperia": "IM",
  "Isernia": "IS",
  "L'Aquila": "AQ",
  "La Spezia": "SP",
  "Latina": "LT",
  "Lecce": "LE",
  "Lecco": "LC",
  "Livorno": "LI",
  "Lodi": "LO",
  "Lucca": "LU",
  "Macerata": "MC",
  "Mantova": "MN",
  "Massa Carrara": "MS",
  "Matera": "MT",
  "Messina": "ME",
  "Milano": "MI",
  "Modena": "MO",
  "Monza e Brianza": "MB",
  "Napoli": "NA",
  "Novara": "NO",
  "Nuoro": "NU",
  "Oristano": "OR",
  "Padova": "PD",
  "Palermo": "PA",
  "Parma": "PR",
  "Pavia": "PV",
  "Perugia": "PG",
  "Pesaro e Urbino": "PU",
  "Pescara": "PE",
  "Piacenza": "PC",
  "Pisa": "PI",
  "Pistoia": "PT",
  "Pordenone": "PN",
  "Potenza": "PZ",
  "Prato": "PO",
  "Ragusa": "RG",
  "Ravenna": "RA",
  "Reggio Calabria": "RC",
  "Reggio Emilia": "RE",
  "Rieti": "RI",
  "Rimini": "RN",
  "Roma": "RM",
  "Rovigo": "RO",
  "Salerno": "SA",
  "Sassari": "SS",
  "Savona": "SV",
  "Siena": "SI",
  "Siracusa": "SR",
  "Sondrio": "SO",
  "Sud Sardegna": "SU",
  "Taranto": "TA",
  "Teramo": "TE",
  "Terni": "TR",
  "Torino": "TO",
  "Trapani": "TP",
  "Trento": "TN",
  "Treviso": "TV",
  "Trieste": "TS",
  "Udine": "UD",
  "Varese": "VA",
  "Venezia": "VE",
  "Verbano-Cusio-Ossola": "VB",
  "Vercelli": "VC",
  "Verona": "VR",
  "Vibo Valentia": "VV",
  "Vicenza": "VI",
  "Viterbo": "VT"
};

async function addProvinceCodesColumn() {
  try {
    // Verifica se la colonna code esiste già
    const columns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'provinces' AND column_name = 'code'
    `);
    
    if (columns.rowCount === 0) {
      console.log("Aggiunta della colonna 'code' alla tabella provinces...");
      
      // Aggiungi la colonna code
      await db.execute(sql`ALTER TABLE provinces ADD COLUMN code TEXT`);
      
      // Assegna codici alle province esistenti
      const allProvinces = await db.select().from(provinces);
      
      for (const province of allProvinces) {
        const code = provinceCodes[province.name] || province.name.substring(0, 2).toUpperCase();
        await db.execute(sql`
          UPDATE provinces 
          SET code = ${code}
          WHERE id = ${province.id}
        `);
        console.log(`Provincia ${province.name} aggiornata con codice ${code}`);
      }
      
      // Aggiungi vincolo NOT NULL alla colonna code dopo aver aggiunto tutti i valori
      await db.execute(sql`ALTER TABLE provinces ALTER COLUMN code SET NOT NULL`);
      
      // Aggiungi vincolo UNIQUE alla colonna code
      await db.execute(sql`ALTER TABLE provinces ADD CONSTRAINT provinces_code_unique UNIQUE (code)`);
      
      console.log("Migrazione completata con successo!");
    } else {
      console.log("La colonna 'code' esiste già, nessuna migrazione necessaria.");
    }
  } catch (error) {
    console.error("Errore durante la migrazione:", error);
  }
}

// Esegui la funzione di migrazione
addProvinceCodesColumn().then(() => {
  console.log("Script di migrazione terminato");
  process.exit(0);
}).catch(error => {
  console.error("Errore durante l'esecuzione dello script:", error);
  process.exit(1);
});