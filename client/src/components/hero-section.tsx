import { useState } from "react";
import { useNavigate } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Brand, Category } from "@shared/schema";
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
  const [location, navigate] = useNavigate();
  const [filters, setFilters] = useState({
    brandId: "",
    modelId: "",
    categoryId: "",
    maxPrice: "",
    year: ""
  });

  const { data: brands } = useQuery<Brand[]>({
    queryKey: ['/api/brands'],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const handleSearch = () => {
    // Convert filters to query params
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value);
      }
    });
    
    // Navigate to catalog with filters
    navigate(`/catalog?${queryParams.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Price options
  const priceOptions = [
    { value: "", label: "Nessun limite" },
    { value: "30000", label: "€ 30.000" },
    { value: "50000", label: "€ 50.000" },
    { value: "100000", label: "€ 100.000" },
    { value: "200000", label: "€ 200.000" }
  ];

  // Year options
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: "", label: "Tutti gli anni" },
    ...Array.from({ length: 5 }, (_, i) => ({ 
      value: (currentYear - i).toString(), 
      label: (currentYear - i).toString() 
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
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Trova l'auto dei tuoi sogni</h1>
          <p className="text-xl mb-8">Dalla selezione alla consegna, la tua esperienza automobilistica premium inizia qui.</p>
          
          {/* Search Form */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-neutral-800">
            <h3 className="text-xl font-semibold mb-4">Cerca il tuo veicolo ideale</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">Marca</label>
                <Select
                  value={filters.brandId}
                  onValueChange={(value) => handleFilterChange('brandId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tutte le marche" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutte le marche</SelectItem>
                    {brands?.map(brand => (
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
                  value={filters.modelId}
                  onValueChange={(value) => handleFilterChange('modelId', value)}
                  disabled={!filters.brandId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti i modelli" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutti i modelli</SelectItem>
                    {/* Would populate with models based on selected brand */}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">Categoria</label>
                <Select
                  value={filters.categoryId}
                  onValueChange={(value) => handleFilterChange('categoryId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tutte le categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutte le categorie</SelectItem>
                    {categories?.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">Prezzo Massimo</label>
                <Select
                  value={filters.maxPrice}
                  onValueChange={(value) => handleFilterChange('maxPrice', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nessun limite" />
                  </SelectTrigger>
                  <SelectContent>
                    {priceOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">Anno</label>
                <Select
                  value={filters.year}
                  onValueChange={(value) => handleFilterChange('year', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti gli anni" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleSearch}
                  className="w-full bg-secondary hover:bg-secondary-dark text-white font-medium"
                >
                  <Search className="h-4 w-4 mr-2" /> Cerca
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
