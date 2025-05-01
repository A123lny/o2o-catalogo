/**
 * Utility per la gestione delle immagini esterne con proxy 
 */

// Domini che richiedono il proxy
const PROXY_DOMAINS = [
  'www.audi.it',
  'media.mercedes-benz.it',
  'cdn.motor1.com',
  'upload.wikimedia.org',
  'images.unsplash.com'
];

/**
 * Verifica se un URL richiede l'uso del proxy
 * @param url URL dell'immagine
 * @returns true se l'URL richiede il proxy
 */
export function needsProxy(url: string): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return PROXY_DOMAINS.some(domain => urlObj.hostname.includes(domain));
  } catch (error) {
    // Non è un URL valido, probabilmente un percorso relativo
    return false;
  }
}

/**
 * Genera l'URL del proxy per un'immagine esterna
 * @param url URL dell'immagine originale
 * @returns URL del proxy
 */
export function getProxiedImageUrl(url: string): string {
  if (!url) return url;
  
  // Se è un URL assoluto esterno che deve usare il proxy
  if (url.startsWith('http') && needsProxy(url)) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  
  // URL relativo o già proxy
  return url;
}

/**
 * Utility che gestisce automaticamente le immagini, usando il proxy quando necessario
 * @param url URL dell'immagine
 * @returns URL processato (con proxy se necessario)
 */
export function processImageUrl(url: string): string {
  return getProxiedImageUrl(url);
}