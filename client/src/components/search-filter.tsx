import { useState, useEffect } from "react";
import { Brand, Category, Vehicle } from "@shared/schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { useQuery } from "@tanstack/react-query";

interface SearchFilterProps {
  brands: Brand[];
  categories: Category[];
  filters: {
    brandIds: string[];
    categoryIds: string[];
    year: string;
    fuelType: string;
    condition: string;
    contractType: string;
  };
  onFilterChange: (filters: any) => void;
}

export default function SearchFilter({ brands, categories, filters, onFilterChange }: SearchFilterProps) {
  // Ottieni tutti i veicoli per creare filtri dinamici
  const { data: allVehicles } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
  });
  
  // Stati per i filtri disponibili
  const [availableFuelTypes, setAvailableFuelTypes] = useState<string[]>([]);
  const [availableConditions, setAvailableConditions] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableContractTypes, setAvailableContractTypes] = useState<string[]>([]);
  
  // Aggiorna i filtri disponibili quando cambiano i dati dei veicoli
  useEffect(() => {
    if (allVehicles && allVehicles.length > 0) {
      // Estrai tipi di carburante unici
      const fuelTypesSet = new Set<string>();
      allVehicles.forEach(v => {
        if (v.fuelType) fuelTypesSet.add(v.fuelType);
      });
      setAvailableFuelTypes(Array.from(fuelTypesSet).sort());
      
      // Estrai condizioni uniche
      const conditionsSet = new Set<string>();
      allVehicles.forEach(v => {
        if (v.condition) conditionsSet.add(v.condition);
      });
      setAvailableConditions(Array.from(conditionsSet).sort());
      
      // Estrai anni unici
      const yearsSet = new Set<number>();
      allVehicles.forEach(v => {
        if (v.year) yearsSet.add(v.year);
      });
      setAvailableYears(Array.from(yearsSet).sort((a, b) => b - a)); // Ordina più recenti prima
      
      // Per i tipi di contratto, dobbiamo ottenere anche i dati di rental-options
      // I tipi NLT/RTB vengono filtrati lato server
      setAvailableContractTypes(['NLT', 'RTB', 'NLTRTB']);
    }
  }, [allVehicles]);
  
  // Opzioni di filtro dinamiche
  const fuelTypes = [
    { value: "", label: "Tutti i tipi" },
    ...availableFuelTypes.map(type => ({ value: type, label: type }))
  ];
  
  // Opzioni di condizione dinamiche
  const conditions = [
    { value: "", label: "Tutte le condizioni" },
    ...availableConditions.map(cond => ({ 
      value: cond, 
      label: cond === "2Life" ? "2Life (Usato)" : cond 
    }))
  ];
  
  // Opzioni di contratto
  const contractTypes = [
    { value: "", label: "Tutti i contratti" },
    { value: "NLT", label: "Noleggio a Lungo Termine" },
    { value: "RTB", label: "Rent to Buy" },
    { value: "NLTRTB", label: "NLT e RTB" },
  ];
  
  // Opzioni anni dinamici
  const years = [
    { value: "", label: "Tutti gli anni" },
    ...availableYears.map(year => ({ 
      value: year.toString(), 
      label: year.toString() 
    }))
  ];

  return (
    <div className="space-y-6">
      <Accordion type="single" collapsible defaultValue="brands">
        {/* Brands Filter - Selezione multipla */}
        <AccordionItem value="brands">
          <AccordionTrigger className="text-sm font-medium">Marche</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="all-brands" 
                  checked={filters.brandIds.length === 0} 
                  onCheckedChange={() => onFilterChange({ brandIds: [] })}
                />
                <Label htmlFor="all-brands" className="text-sm">Tutte le marche</Label>
              </div>
              
              {brands.map(brand => (
                <div key={brand.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`brand-${brand.id}`} 
                    checked={filters.brandIds.includes(brand.id.toString())}
                    onCheckedChange={(checked) => {
                      const brandId = brand.id.toString();
                      let newBrandIds = [...filters.brandIds];
                      
                      if (checked) {
                        // Aggiungi il brand se non è già presente
                        if (!newBrandIds.includes(brandId)) {
                          newBrandIds.push(brandId);
                        }
                      } else {
                        // Rimuovi il brand se presente
                        newBrandIds = newBrandIds.filter(id => id !== brandId);
                      }
                      
                      onFilterChange({ brandIds: newBrandIds });
                    }}
                  />
                  <Label htmlFor={`brand-${brand.id}`} className="text-sm">{brand.name}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Categories Filter - Selezione multipla */}
        <AccordionItem value="categories">
          <AccordionTrigger className="text-sm font-medium">Categorie</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="all-categories" 
                  checked={filters.categoryIds.length === 0} 
                  onCheckedChange={() => onFilterChange({ categoryIds: [] })}
                />
                <Label htmlFor="all-categories" className="text-sm">Tutte le categorie</Label>
              </div>
              
              {categories.map(category => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`category-${category.id}`} 
                    checked={filters.categoryIds.includes(category.id.toString())}
                    onCheckedChange={(checked) => {
                      const categoryId = category.id.toString();
                      let newCategoryIds = [...filters.categoryIds];
                      
                      if (checked) {
                        // Aggiungi la categoria se non è già presente
                        if (!newCategoryIds.includes(categoryId)) {
                          newCategoryIds.push(categoryId);
                        }
                      } else {
                        // Rimuovi la categoria se presente
                        newCategoryIds = newCategoryIds.filter(id => id !== categoryId);
                      }
                      
                      onFilterChange({ categoryIds: newCategoryIds });
                    }}
                  />
                  <Label htmlFor={`category-${category.id}`} className="text-sm">{category.name}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        

        
        {/* Year Filter */}
        <AccordionItem value="year">
          <AccordionTrigger className="text-sm font-medium">Anno</AccordionTrigger>
          <AccordionContent>
            <RadioGroup 
              value={filters.year} 
              onValueChange={(value) => onFilterChange({ year: value })}
              className="space-y-2"
            >
              {years.map(year => (
                <div key={year.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={year.value} id={`year-${year.value || 'any'}`} />
                  <Label htmlFor={`year-${year.value || 'any'}`} className="text-sm">{year.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>
        
        {/* Fuel Type Filter */}
        <AccordionItem value="fuelType">
          <AccordionTrigger className="text-sm font-medium">Alimentazione</AccordionTrigger>
          <AccordionContent>
            <RadioGroup 
              value={filters.fuelType} 
              onValueChange={(value) => onFilterChange({ fuelType: value })}
              className="space-y-2"
            >
              {fuelTypes.map(type => (
                <div key={type.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={type.value} id={`fuel-${type.value || 'any'}`} />
                  <Label htmlFor={`fuel-${type.value || 'any'}`} className="text-sm">{type.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>
        
        {/* Condition Filter (Nuovo/2Life) */}
        <AccordionItem value="condition">
          <AccordionTrigger className="text-sm font-medium">Condizione</AccordionTrigger>
          <AccordionContent>
            <RadioGroup 
              value={filters.condition} 
              onValueChange={(value) => onFilterChange({ condition: value })}
              className="space-y-2"
            >
              {conditions.map(condition => (
                <div key={condition.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={condition.value} id={`condition-${condition.value || 'any'}`} />
                  <Label htmlFor={`condition-${condition.value || 'any'}`} className="text-sm">{condition.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>
        
        {/* Contract Type Filter */}
        <AccordionItem value="contractType">
          <AccordionTrigger className="text-sm font-medium">Tipo Contratto</AccordionTrigger>
          <AccordionContent>
            <RadioGroup 
              value={filters.contractType} 
              onValueChange={(value) => onFilterChange({ contractType: value })}
              className="space-y-2"
            >
              {contractTypes.map(type => (
                <div key={type.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={type.value} id={`contract-${type.value || 'any'}`} />
                  <Label htmlFor={`contract-${type.value || 'any'}`} className="text-sm">{type.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
