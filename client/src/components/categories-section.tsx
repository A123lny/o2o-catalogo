import { Link } from "wouter";
import { Category } from "@shared/schema";

interface CategoriesSectionProps {
  categories: Category[];
}

export default function CategoriesSection({ categories }: CategoriesSectionProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">Sfoglia per Tipo</h2>
        <div className="flex justify-center">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
            {categories.map((category) => (
              <Link 
                key={category.id} 
                href={`/catalog?categoryIds=${category.id}`} 
                className="text-center group flex flex-col items-center"
              >
                <div className="category-circle mx-auto">
                  <div className="category-overlay"></div>
                  <img 
                    src={category.image || `https://images.unsplash.com/photo-1583121274602-3e2820c69888?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80`} 
                    className="object-cover w-full h-full" 
                    alt={category.name} 
                  />
                </div>
                <h3 className="font-medium group-hover:text-primary transition-colors duration-300 mt-2">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
