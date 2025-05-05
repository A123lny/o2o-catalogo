import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Ottieni il percorso corrente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Percorso del file da modificare
const filePath = path.join(__dirname, 'server/routes.ts');

// Leggi il contenuto del file
let content = fs.readFileSync(filePath, 'utf8');

// Sostituisci tutte le occorrenze di `storage.` con `dbStorage.`
content = content.replace(/(?<!import { )storage\./g, 'dbStorage.');

// Scrivi il file aggiornato
fs.writeFileSync(filePath, content, 'utf8');

console.log('File aggiornato con successo!');
