import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Menu, X, User, Settings, Loader2 } from "lucide-react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  // Fetch general settings to get site name
  const { data: generalSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/settings/general'],
    queryFn: async () => {
      const response = await fetch('/api/settings/general');
      if (!response.ok) throw new Error('Errore nel recupero delle impostazioni generali');
      return response.json();
    }
  });

  const siteName = generalSettings?.siteName || "o2o Mobility";
  
  // Divide il nome in due parti per applicare colori diversi (se contiene uno spazio)
  const nameParts = siteName.split(' ');
  const firstPart = nameParts[0];
  const secondPart = nameParts.slice(1).join(' ');

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="bg-white shadow-md relative z-10">
      <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            {isLoadingSettings ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="font-bold text-2xl">Caricamento...</span>
              </div>
            ) : (
              <span className="text-primary font-bold text-2xl">
                {firstPart} {secondPart && <span className="text-secondary">{secondPart}</span>}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile menu button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden rounded-md p-2 text-neutral-500 hover:bg-neutral-100"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Main navigation - Solo Home, Catalogo e Contatti */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/" className={`font-medium py-1 ${isActive('/') ? 'text-primary-dark border-b-2 border-primary' : 'text-neutral-600 hover:text-primary hover:border-b-2 hover:border-primary'}`}>
            Home
          </Link>
          <Link href="/catalog" className={`font-medium py-1 ${isActive('/catalog') ? 'text-primary-dark border-b-2 border-primary' : 'text-neutral-600 hover:text-primary hover:border-b-2 hover:border-primary'}`}>
            Catalogo
          </Link>
          <Link href="#contact" className="text-neutral-600 hover:text-primary font-medium py-1 hover:border-b-2 hover:border-primary">
            Contatti
          </Link>
          {/* Aggiungiamo il link Admin sempre visibile per facilitare l'accesso */}
          <Link href="/admin" className="text-neutral-600 hover:text-primary font-medium py-1 hover:border-b-2 hover:border-primary flex items-center">
            <Settings className="h-4 w-4 mr-1" />
            Admin
          </Link>
        </nav>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              <Link href="/logout">
                <Button variant="outline" size="sm">Logout</Button>
              </Link>
            </>
          ) : (
            <Link href="/auth">
              <Button variant="outline" size="sm">Login</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile menu - Solo Home, Catalogo e Contatti */}
      <div className={`md:hidden bg-white px-4 py-2 shadow-md absolute top-full left-0 w-full ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <nav className="flex flex-col space-y-3 py-3">
          <Link href="/" className={`font-medium py-2 px-2 rounded ${isActive('/') ? 'text-primary-dark bg-neutral-100' : 'text-neutral-600 hover:bg-neutral-100'}`}>
            Home
          </Link>
          <Link href="/catalog" className={`font-medium py-2 px-2 rounded ${isActive('/catalog') ? 'text-primary-dark bg-neutral-100' : 'text-neutral-600 hover:bg-neutral-100'}`}>
            Catalogo
          </Link>
          <Link href="#contact" className="text-neutral-600 font-medium py-2 px-2 rounded hover:bg-neutral-100">
            Contatti
          </Link>
          
          {/* Aggiungiamo Admin anche al menu mobile */}
          <Link href="/admin" className="text-neutral-600 font-medium py-2 px-2 rounded hover:bg-neutral-100 flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Admin
          </Link>
          
          {/* Auth mobile menu items */}
          {user ? (
            <Link href="/logout" className="text-neutral-600 font-medium py-2 px-2 rounded hover:bg-neutral-100">
              Logout
            </Link>
          ) : (
            <Link href="/auth" className="text-neutral-600 font-medium py-2 px-2 rounded hover:bg-neutral-100">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
