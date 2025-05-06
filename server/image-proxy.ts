import axios from 'axios';
import { Request, Response } from 'express';
import { URL } from 'url';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const existsAsync = promisify(fs.exists);

// Ottieni il percorso assoluto del file corrente
const __filename = fileURLToPath(import.meta.url);
// Ottieni la directory del file corrente
const __dirname = path.dirname(__filename);

const IMAGE_CACHE_DIR = path.join(__dirname, '../public/image-cache');
const ALLOWED_DOMAINS = [
  'www.audi.it',
  'media.mercedes-benz.it',
  'cdn.motor1.com',
  'upload.wikimedia.org',
  'images.unsplash.com'
];

// Assicurati che la directory di cache esista
async function ensureCacheDir() {
  if (!await existsAsync(IMAGE_CACHE_DIR)) {
    await mkdirAsync(IMAGE_CACHE_DIR, { recursive: true });
    console.log(`Created image cache directory: ${IMAGE_CACHE_DIR}`);
  }
}

ensureCacheDir();

export async function setupImageProxy(req: Request, res: Response) {
  const { url } = req.query;
  
  if (!url || typeof url !== 'string') {
    return res.status(400).send('URL parametro mancante o non valido');
  }
  
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    return res.status(400).send('URL non valido');
  }
  
  // Verifica che il dominio sia consentito
  if (!ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
    return res.status(403).send(`Dominio non consentito: ${parsedUrl.hostname}`);
  }

  try {
    // Crea un hash dell'URL per usarlo come nome file
    const urlHash = crypto.createHash('md5').update(url).digest('hex');
    
    // Determina l'estensione del file dall'URL
    const urlPath = parsedUrl.pathname;
    const extension = path.extname(urlPath) || '.jpg'; // Default a .jpg se nessuna estensione
    
    const cacheFilePath = path.join(IMAGE_CACHE_DIR, `${urlHash}${extension}`);
    
    // Controlla se l'immagine è già in cache
    if (await existsAsync(cacheFilePath)) {
      console.log(`Serving cached image for: ${url}`);
      return res.sendFile(cacheFilePath);
    }
    
    console.log(`Fetching image from: ${url}`);
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5'
        },
        timeout: 5000 // 5 secondi di timeout
      });
      
      // Salva l'immagine in cache
      await writeFileAsync(cacheFilePath, response.data);
      console.log(`Cached image to: ${cacheFilePath}`);
      
      // Imposta il Content-Type corretto
      res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
      res.send(response.data);
    } catch (error: any) {
      console.error(`Errore nel recupero dell'immagine da ${url}:`, error.message);
      
      // Invece di un'immagine fallback, restituiamo un errore 404 che verrà gestito dal frontend
      console.log(`Serving 404 for image: ${url}`);
      return res.status(404).send('Immagine non trovata');
    }
    
  } catch (error) {
    console.error('Errore durante il recupero dell\'immagine:', error);
    res.status(500).send('Errore durante il recupero dell\'immagine');
  }
}