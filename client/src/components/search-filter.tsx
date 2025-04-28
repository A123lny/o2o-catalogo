import { useState } from "react";
import { Brand, Category } from "@shared/schema";
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

interface SearchFilterProps {
  brands: Brand[];
  categories: Category[];
  filters: {
    brandId: string;
    categoryId: string;
    maxPrice: string;
    year: string;
    fuelType: string;
  };
  onFilterChange: (filters: any) => void;
}

export default function SearchFilter({ brands, categories, filters, onFilterChange }: SearchFilterProps) {
  const [priceRange, setPriceRange] = useState<number[]>([0]);
  
  // Fuel type options
  const fuelTypes = [
    { value: "", label: "Tutti i tipi" },
    { value: "Benzina", label: "Benzina" },
    { value: "Diesel", label: "Diesel" },
    { value: "Ibrida", label: "Ibrida" },
    { value: "Elettrica", label: "Elettrica" },
  ];
  
  // Year options (current year down to 10 years ago)
  const currentYear = new Date().getFullYear();
  const years = [
    { value: "", label: "Tutti gli anni" },
    ...Array.from({ length: 10 }, (_, i) => ({ 
      value: (currentYear - i).toString(), 
      label: (currentYear - i).toString() 
    }))
  ];
  
  // Price ranges
  const priceRanges = [
    { value: "", label: "Qualsiasi prezzo" },
    { value: "30000", label: "Fino a €30.000" },
    { value: "50000", label: "Fino a €50.000" },
    { value: "100000", label: "Fino a €100.000" },
    { value: "200000", label: "Fino a €200.000" },
  ];

  const handlePriceChange = (value: number[]) => {
    setPriceRange(value);
    const maxPrice = value[0] * 10000;
    onFilterChange({ maxPrice: maxPrice > 0 ? maxPrice.toString() : "" });
  };

  return (
    <div className="space-y-6">
      <Accordion type="single" collapsible defaultValue="brands">
        {/* Brands Filter */}
        <AccordionItem value="brands">
          <AccordionTrigger className="text-sm font-medium">Marche</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="all-brands" 
                  checked={!filters.brandId} 
                  onCheckedChange={() => onFilterChange({ brandId: "" })}
                />
                <Label htmlFor="all-brands" className="text-sm">Tutte le marche</Label>
              </div>
              
              {brands.map(brand => (
                <div key={brand.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`brand-${brand.id}`} 
                    checked={filters.brandId === brand.id.toString()}
                    onCheckedChange={() => onFilterChange({ 
                      brandId: filters.brandId === brand.id.toString() ? "" : brand.id.toString()
                    })}
                  />
                  <Label htmlFor={`brand-${brand.id}`} className="text-sm">{brand.name}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Categories Filter */}
        <AccordionItem value="categories">
          <AccordionTrigger className="text-sm font-medium">Categorie</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="all-categories" 
                  checked={!filters.categoryId} 
                  onCheckedChange={() => onFilterChange({ categoryId: "" })}
                />
                <Label htmlFor="all-categories" className="text-sm">Tutte le categorie</Label>
              </div>
              
              {categories.map(category => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`category-${category.id}`} 
                    checked={filters.categoryId === category.id.toString()}
                    onCheckedChange={() => onFilterChange({ 
                      categoryId: filters.categoryId === category.id.toString() ? "" : category.id.toString()
                    })}
                  />
                  <Label htmlFor={`category-${category.id}`} className="text-sm">{category.name}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Price Filter */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-medium">Prezzo</AccordionTrigger>
          <AccordionContent>
            <RadioGroup 
              value={filters.maxPrice} 
              onValueChange={(value) => onFilterChange({ maxPrice: value })}
              className="space-y-2"
            >
              {priceRanges.map(range => (
                <div key={range.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={range.value} id={`price-${range.value || 'any'}`} />
                  <Label htmlFor={`price-${range.value || 'any'}`} className="text-sm">{range.label}</Label>
                </div>
              ))}
            </RadioGroup>
            
            <div className="mt-4 space-y-4">
              <Label className="text-sm">Prezzo massimo: {priceRange[0] > 0 ? `€${(priceRange[0] * 10000).toLocaleString()}` : 'Nessun limite'}</Label>
              <Slider
                defaultValue={[0]}
                max={30}
                step={1}
                value={priceRange}
                onValueChange={handlePriceChange}
              />
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
      </Accordion>
    </div>
  );
}
