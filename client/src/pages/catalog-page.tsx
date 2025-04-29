import { useState, useEffect } from "react";
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
  }, [location]);
  
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
  
  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
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
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {vehicles.map(vehicle => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                  ))}
                </div>
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
