import { Link } from "wouter";
import { Vehicle } from "@shared/schema";
import VehicleCard from "./vehicle-card";
import { ChevronRight } from "lucide-react";

interface FeaturedVehiclesProps {
  vehicles: Vehicle[];
}

export default function FeaturedVehicles({ vehicles }: FeaturedVehiclesProps) {
  if (!vehicles || vehicles.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-neutral-100">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">I nostri veicoli in evidenza</h2>
          <Link href="/catalog" className="text-primary hover:text-primary-dark font-medium flex items-center">
            Vedi tutti <ChevronRight className="ml-1 h-5 w-5" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map(vehicle => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
        
        <div className="mt-10 text-center">
          <Link href="/catalog" className="inline-block px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-md transition duration-300">
            Scopri tutto il catalogo
          </Link>
        </div>
      </div>
    </section>
  );
}
