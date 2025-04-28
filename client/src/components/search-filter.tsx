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
    year: string;
    fuelType: string;
    condition: string;
  };
  onFilterChange: (filters: any) => void;
}

export default function SearchFilter({ brands, categories, filters, onFilterChange }: SearchFilterProps) {
  
  // Fuel type options
  const fuelTypes = [
    { value: "", label: "Tutti i tipi" },
    { value: "Benzina", label: "Benzina" },
    { value: "Diesel", label: "Diesel" },
    { value: "Ibrida", label: "Ibrida" },
    { value: "Elettrica", label: "Elettrica" },
  ];
  
  // Condition options
  const conditions = [
    { value: "", label: "Tutte le condizioni" },
    { value: "Nuovo", label: "Nuovo" },
    { value: "2Life", label: "2Life (Usato)" },
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
      </Accordion>
    </div>
  );
}
