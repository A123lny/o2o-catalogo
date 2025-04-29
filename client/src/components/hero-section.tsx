import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Brand, Category, Vehicle } from "@shared/schema";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function HeroSection() {
  const [location, setLocation] = useLocation();
  const [filters, setFilters] = useState({
    brandId: "",
    modelId: "",
    contractType: "",
    year: ""
  });
  
  const [uniqueYears, setUniqueYears] = useState<number[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // Utilizziamo le API per ottenere solo marchi attivi
  const { data: activeBrands } = useQuery<Brand[]>({
    queryKey: ['/api/brands/active'],
  });

  const { data: activeCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories/active'],
  });
  
  // Otteniamo i veicoli per sapere gli anni disponibili
  const { data: allVehicles } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
  });
  
  // Estrai gli anni unici dai veicoli disponibili
  useEffect(() => {
    if (allVehicles) {
      // Utilizziamo Array.from invece di spread operator per compatibilità
      const yearsSet = new Set<number>();
      allVehicles.forEach(vehicle => {
        yearsSet.add(vehicle.year);
      });
      const years = Array.from(yearsSet);
      setUniqueYears(years.sort((a, b) => b - a)); // Ordina dal più recente
      
      // Estrai modelli disponibili 
      if (filters.brandId && filters.brandId !== "all") {
        const brandId = parseInt(filters.brandId);
        const modelsSet = new Set<string>();
        
        allVehicles
          .filter(v => v.brandId === brandId)
          .forEach(v => {
            modelsSet.add(v.model);
          });
          
        setAvailableModels(Array.from(modelsSet).sort());
      } else {
        setAvailableModels([]);
      }
    }
  }, [allVehicles, filters.brandId]);

  const handleSearch = () => {
    // Convert filters to query params
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all") {
        queryParams.append(key, value);
      }
    });
    
    // Navigate to catalog with filters
    const queryString = queryParams.toString();
    setLocation(`/catalog${queryString ? `?${queryString}` : ''}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    // Se stiamo cambiando marca, resettiamo il modello
    if (key === 'brandId') {
      setFilters(prev => ({ ...prev, [key]: value, modelId: "" }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  // Opzioni per i tipi di contratto
  const contractTypeOptions = [
    { value: "all", label: "Tutti i contratti" },
    { value: "NLT", label: "Solo Noleggio a Lungo Termine" },
    { value: "RTB", label: "Solo Rent to Buy" },
    { value: "NLTRTB", label: "NLT e RTB" }
  ];

  // Year options basati sui veicoli disponibili
  const yearOptions = [
    { value: "", label: "Tutti gli anni" },
    ...uniqueYears.map(year => ({ 
      value: year.toString(), 
      label: year.toString() 
    }))
  ];

  return (
    <section className="bg-gradient-to-r from-primary to-primary-dark text-white py-16 relative">
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1583121274602-3e2820c69888?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1950&q=80" 
          alt="Luxury cars" 
          className="w-full h-full object-cover opacity-30"
        />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Trova l'auto dei tuoi sogni</h1>
          <p className="text-xl mb-8">Dalla selezione alla consegna, la tua esperienza automobilistica premium inizia qui.</p>
          
          {/* Search Form - Centered */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-neutral-800 max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold mb-4">Cerca il tuo veicolo ideale</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">Marca</label>
                <Select
                  value={filters.brandId || "all"}
                  onValueChange={(value) => handleFilterChange('brandId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tutte le marche" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le marche</SelectItem>
                    {activeBrands?.map(brand => (
                      <SelectItem key={brand.id} value={brand.id.toString()}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">Modello</label>
                <Select
                  value={filters.modelId || "all"}
                  onValueChange={(value) => handleFilterChange('modelId', value)}
                  disabled={!filters.brandId || filters.brandId === "all" || availableModels.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti i modelli" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i modelli</SelectItem>
                    {availableModels.map(model => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">Anno</label>
                <Select
                  value={filters.year || ""}
                  onValueChange={(value) => handleFilterChange('year', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti gli anni" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(option => (
                      <SelectItem key={option.value || "default-year"} value={option.value || "all"}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">Tipo Contratto</label>
                <Select
                  value={filters.contractType || "all"}
                  onValueChange={(value) => handleFilterChange('contractType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti i contratti" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4">
              <Button 
                onClick={handleSearch}
                className="w-full bg-secondary hover:bg-secondary-dark text-white font-medium py-2"
              >
                <Search className="h-4 w-4 mr-2" /> Cerca
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
