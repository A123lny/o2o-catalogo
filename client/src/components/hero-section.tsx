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
    brandIds: [] as string[],
    categoryIds: [] as string[],
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
      
      // Estrai modelli disponibili - modifica per supportare selezione multipla
      if (filters.brandIds && filters.brandIds.length === 1) {
        const brandId = parseInt(filters.brandIds[0]);
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
  }, [allVehicles, filters.brandIds]);

  const handleSearch = () => {
    // Convert filters to query params
    const queryParams = new URLSearchParams();
    
    // Gestisci diversamente array e valori singoli
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // Se è un array e ha elementi, aggiungi come stringa separata da virgole
        if (value.length > 0) {
          queryParams.append(key, value.join(','));
        }
      } else if (value && value !== "all") {
        // Per valori singoli
        queryParams.append(key, value);
      }
    });
    
    // Navigate to catalog with filters
    const queryString = queryParams.toString();
    setLocation(`/catalog${queryString ? `?${queryString}` : ''}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    // Gestione della selezione della marca (ora come array)
    if (key === 'brand') {
      if (value === "all") {
        setFilters(prev => ({ ...prev, brandIds: [], categoryIds: [] }));
      } else {
        setFilters(prev => ({ ...prev, brandIds: [value] }));
      }
    } 
    // Gestione della selezione della categoria (ora come array) 
    else if (key === 'category') {
      if (value === "all") {
        setFilters(prev => ({ ...prev, categoryIds: [] }));
      } else {
        setFilters(prev => ({ ...prev, categoryIds: [value] }));
      }
    }
    // Altri filtri non array
    else {
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
                  value={filters.brandIds.length === 1 ? filters.brandIds[0] : "all"}
                  onValueChange={(value) => handleFilterChange('brand', value)}
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
                <label className="block text-sm font-medium text-neutral-600 mb-1">Categoria</label>
                <Select
                  value={filters.categoryIds.length === 1 ? filters.categoryIds[0] : "all"}
                  onValueChange={(value) => handleFilterChange('category', value)}
                  disabled={filters.brandIds.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tutte le categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le categorie</SelectItem>
                    {activeCategories?.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
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
