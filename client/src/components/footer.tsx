import { Link } from "wouter";
import { 
  Facebook, 
  Instagram, 
  Linkedin, 
  Youtube, 
  MapPin, 
  Phone, 
  Mail, 
  Clock 
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-neutral-800 text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4">AUTO<span className="text-secondary">PRESTIGE</span></h3>
            <p className="text-neutral-400 mb-4">L'eccellenza automobilistica a portata di mano. Offriamo soluzioni di acquisto, noleggio e finanziamento personalizzate per le migliori auto di lusso.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-400 hover:text-white">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Servizi</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-neutral-400 hover:text-white">Vendita auto nuove</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">Vendita auto usate</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">Noleggio a lungo termine</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">Rent to Buy</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">Finanziamenti</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">Servizi post-vendita</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Marche</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-neutral-400 hover:text-white">Audi</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">BMW</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">Mercedes</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">Porsche</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">Ferrari</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">Tutte le marche</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Contatti</h4>
            <ul className="space-y-2 text-neutral-400">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mt-1 mr-3 text-secondary flex-shrink-0" />
                <span>Via del Lusso, 123<br />20100 Milano (MI)</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-3 text-secondary flex-shrink-0" />
                <span>+39 02 1234567</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-secondary flex-shrink-0" />
                <span>info@autoprestige.it</span>
              </li>
              <li className="flex items-center">
                <Clock className="h-5 w-5 mr-3 text-secondary flex-shrink-0" />
                <span>Lun-Sab: 9:00-19:00</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-700 pt-6 mt-6">
          <div className="flex flex-col md:flex-row md:justify-between">
            <p className="text-neutral-500 text-sm mb-4 md:mb-0">© {new Date().getFullYear()} Auto Prestige. Tutti i diritti riservati.</p>
            <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Termini e Condizioni</a>
              <a href="#" className="hover:text-white">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
