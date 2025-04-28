import { Link } from "wouter";
import { Vehicle } from "@shared/schema";
import VehicleCard from "./vehicle-card";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

interface FeaturedVehiclesProps {
  vehicles: Vehicle[];
}

export default function FeaturedVehicles({ vehicles }: FeaturedVehiclesProps) {
  const [activeTab, setActiveTab] = useState("featured");
  
  if (!vehicles || vehicles.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-neutral-100">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">I Nostri Veicoli</h2>
          
          <div className="flex space-x-2 md:space-x-4 overflow-x-auto py-2 md:py-0">
            <button 
              onClick={() => setActiveTab("featured")}
              className={`px-3 py-2 md:px-4 md:py-2 text-sm md:text-base rounded-md transition-colors duration-300 whitespace-nowrap ${
                activeTab === "featured" 
                  ? "bg-primary text-white" 
                  : "bg-white hover:bg-neutral-200 text-neutral-700"
              }`}
            >
              In evidenza
            </button>
            <button 
              onClick={() => setActiveTab("nlt")}
              className={`px-3 py-2 md:px-4 md:py-2 text-sm md:text-base rounded-md transition-colors duration-300 whitespace-nowrap ${
                activeTab === "nlt" 
                  ? "bg-primary text-white" 
                  : "bg-white hover:bg-neutral-200 text-neutral-700"
              }`}
            >
              NLT
            </button>
            <button 
              onClick={() => setActiveTab("rtb")}
              className={`px-3 py-2 md:px-4 md:py-2 text-sm md:text-base rounded-md transition-colors duration-300 whitespace-nowrap ${
                activeTab === "rtb" 
                  ? "bg-primary text-white" 
                  : "bg-white hover:bg-neutral-200 text-neutral-700"
              }`}
            >
              RTB
            </button>
            <button 
              onClick={() => setActiveTab("2life")}
              className={`px-3 py-2 md:px-4 md:py-2 text-sm md:text-base rounded-md transition-colors duration-300 whitespace-nowrap ${
                activeTab === "2life" 
                  ? "bg-primary text-white" 
                  : "bg-white hover:bg-neutral-200 text-neutral-700"
              }`}
            >
              2 Life
            </button>
          </div>
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
