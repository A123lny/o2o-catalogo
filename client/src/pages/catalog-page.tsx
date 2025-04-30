import { useState, useEffect, useRef, useCallback } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SearchFilter from "@/components/search-filter";
import VehicleCard from "@/components/vehicle-card";
import PageTitle from "@/components/page-title";
import { useQuery } from "@tanstack/react-query";
import { Vehicle, Brand, Category } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function CatalogPage() {
  const [location] = useLocation();
  const [filters, setFilters] = useState({
    brandIds: [] as string[],
    categoryIds: [] as string[],
    year: "",
    fuelType: "",
    condition: "",
    contractType: "",
    isPromo: false,
  });
  
  // Stato per il lazy loading
  const [visibleItems, setVisibleItems] = useState(12); // Numero iniziale di veicoli da mostrare
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Leggi i parametri URL quando la pagina viene caricata
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const initialFilters: any = {
      brandIds: [],
      categoryIds: [],
      year: "",
      fuelType: "",
      condition: "",
      contractType: "",
    };
    
    // Leggi tutti i parametri disponibili nell'URL
    searchParams.forEach((value, key) => {
      if (value) {
        // Gestisci parametri array come brandIds e categoryIds
        if (key === 'brandIds' || key === 'categoryIds') {
          initialFilters[key] = value.split(',');
        } else {
          initialFilters[key] = value;
        }
      }
    });
    
    // Aggiorna i filtri solo se ci sono parametri nell'URL
    if (Object.values(initialFilters).some(v => Array.isArray(v) ? v.length > 0 : v !== "")) {
      setFilters(initialFilters);
    }
    
    // Reset visibleItems quando cambiano i filtri
    setVisibleItems(12);
  }, [location]);
  
  // Query per caricare i veicoli
  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles', filters],
  });
  
  // Utilizzare i brand e le categorie attive, che hanno veicoli associati
  const { data: brands } = useQuery<Brand[]>({
    queryKey: ['/api/brands/active'],
  });
  
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories/active'],
  });
  
  // Funzione di callback per gestire l'intersection observer per infinite scroll
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && vehicles) {
      // Se ci sono ancora più veicoli da mostrare, aumenta il numero di elementi visibili
      if (visibleItems < vehicles.length) {
        // Aggiungi un piccolo ritardo per dare tempo al browser di renderizzare i veicoli attuali
        setTimeout(() => {
          setVisibleItems(prev => Math.min(prev + 6, vehicles.length)); // Carica altri 6 veicoli
        }, 300);
      }
    }
  }, [vehicles, visibleItems]);
  
  // Configurazione dell'intersection observer per l'infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '20px',
      threshold: 0.1
    });
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [handleObserver]);
  
  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Reset del numero di elementi visibili quando cambiano i filtri
    setVisibleItems(12);
  };
  
  const clearFilters = () => {
    setFilters({
      brandIds: [],
      categoryIds: [],
      year: "",
      fuelType: "",
      condition: "",
      contractType: "",
      isPromo: false,
    });
    // Reset del numero di elementi visibili quando vengono cancellati i filtri
    setVisibleItems(12);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PageTitle title="Catalogo Veicoli" />
      <Header />
      <main className="flex-1 py-12 bg-neutral-100">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Catalogo Veicoli</h1>
            <div className="text-neutral-600">
              {vehicles && `${vehicles.length} veicoli disponibili`}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Filtri</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearFilters}
                  disabled={!Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v !== "")}
                >
                  Cancella
                </Button>
              </div>
              
              <SearchFilter 
                brands={brands || []}
                categories={categories || []}
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>
            
            {/* Vehicles Grid */}
            <div className="lg:col-span-3">
              {isLoadingVehicles ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : vehicles && vehicles.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vehicles.slice(0, visibleItems).map(vehicle => (
                      <VehicleCard key={vehicle.id} vehicle={vehicle} />
                    ))}
                  </div>
                  
                  {/* Elemento osservatore per l'infinite scroll */}
                  {visibleItems < (vehicles?.length || 0) && (
                    <div 
                      ref={observerTarget}
                      className="flex justify-center my-8 py-4"
                    >
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                  
                  {/* Pulsante "Carica altri" alternativo */}
                  {visibleItems < (vehicles?.length || 0) && (
                    <div className="flex justify-center mt-4 mb-8">
                      <Button 
                        variant="outline"
                        onClick={() => setVisibleItems(prev => Math.min(prev + 6, vehicles.length))}
                      >
                        Carica altri veicoli ({vehicles.length - visibleItems} rimanenti)
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center bg-white p-12 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-2">Nessun veicolo trovato</h3>
                  <p className="text-neutral-600 text-center mb-6">
                    Non abbiamo trovato veicoli corrispondenti ai filtri selezionati.
                  </p>
                  <Button onClick={clearFilters}>Cancella tutti i filtri</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
