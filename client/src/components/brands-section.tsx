import { Link } from "wouter";
import { Brand } from "@shared/schema";

interface BrandsSectionProps {
  brands: Brand[];
}

export default function BrandsSection({ brands }: BrandsSectionProps) {
  if (!brands || brands.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-neutral-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">Sfoglia per Produttore</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 justify-items-center max-w-6xl mx-auto">
          {brands.map((brand) => (
            <Link 
              key={brand.id} 
              href={`/catalog?brandIds=${brand.id}`} 
              className="text-center group"
            >
              <div className="brand-circle bg-white shadow-sm rounded-full w-24 h-24 mx-auto flex items-center justify-center p-4 hover:shadow-md transition-shadow duration-300">
                {brand.logo ? (
                  <img 
                    src={brand.logo} 
                    className="max-w-full max-h-full object-contain" 
                    alt={brand.name} 
                  />
                ) : (
                  <div className="text-2xl font-bold text-primary">{brand.name.charAt(0)}</div>
                )}
              </div>
              <h3 className="mt-3 font-medium group-hover:text-primary transition-colors duration-300">
                {brand.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}