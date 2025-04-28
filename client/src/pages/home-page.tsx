import Header from "@/components/header";
import Footer from "@/components/footer";
import HeroSection from "@/components/hero-section";
import CategoriesSection from "@/components/categories-section";
import BrandsSection from "@/components/brands-section";
import FeaturedVehicles from "@/components/featured-vehicles";
import { useQuery } from "@tanstack/react-query";
import { Category, Vehicle, Brand } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: brands, isLoading: isLoadingBrands } = useQuery<Brand[]>({
    queryKey: ['/api/brands'],
  });

  const { data: featuredVehicles, isLoading: isLoadingVehicles } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles/featured'],
  });

  // Loading state for initial data fetch
  if (isLoadingCategories || isLoadingVehicles || isLoadingBrands) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <CategoriesSection categories={categories || []} />
        <BrandsSection brands={brands || []} />
        <FeaturedVehicles vehicles={featuredVehicles || []} />
      </main>
      <Footer />
    </div>
  );
}
