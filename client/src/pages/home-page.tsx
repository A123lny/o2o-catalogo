import Header from "@/components/header";
import Footer from "@/components/footer";
import HeroSection from "@/components/hero-section";
import CategoriesSection from "@/components/categories-section";
import BrandsSection from "@/components/brands-section";
import FeaturedVehicles from "@/components/featured-vehicles";
import PageTitle from "@/components/page-title";
import { useQuery } from "@tanstack/react-query";
import { Category, Vehicle, Brand } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  // Utilizziamo le nuove API per ottenere solo marchi e categorie con veicoli disponibili
  const { data: activeCategories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories/active'],
  });

  const { data: activeBrands, isLoading: isLoadingBrands } = useQuery<Brand[]>({
    queryKey: ['/api/brands/active'],
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
      <PageTitle suffix="Noleggio e Rent to Buy" />
      <Header />
      <main className="flex-1">
        <HeroSection />
        {/* Mostriamo le sezioni solo se ci sono elementi da visualizzare */}
        {activeBrands && activeBrands.length > 0 && (
          <BrandsSection brands={activeBrands} />
        )}
        {activeCategories && activeCategories.length > 0 && (
          <CategoriesSection categories={activeCategories} />
        )}
        {featuredVehicles && featuredVehicles.length > 0 && (
          <FeaturedVehicles vehicles={featuredVehicles} />
        )}
      </main>
      <Footer />
    </div>
  );
}