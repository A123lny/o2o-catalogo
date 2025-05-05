const fs = require('fs');
const path = require('path');

// Percorso del file da modificare
const filePath = path.join(process.cwd(), 'server/routes.ts');

// Leggi il contenuto del file
let content = fs.readFileSync(filePath, 'utf8');

// Sostituisci tutte le occorrenze di `storage.` con `dbStorage.`
// ma non modificare `storage as dbStorage` nel codice di importazione
content = content.replace(/(?<!import { )storage\./g, 'dbStorage.');

// Scrivi il file aggiornato
fs.writeFileSync(filePath, content, 'utf8');

console.log('File aggiornato con successo!');
