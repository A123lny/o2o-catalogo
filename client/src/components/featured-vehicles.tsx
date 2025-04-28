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
        <div className="flex flex-col w-full mb-8">
          <h2 className="text-3xl font-bold mb-6">I Nostri Veicoli</h2>
          
          <div className="flex border-b border-neutral-200">
            <button 
              onClick={() => setActiveTab("featured")}
              className={`px-4 py-2 text-base font-medium transition-colors duration-300 ${
                activeTab === "featured" 
                  ? "text-primary border-b-2 border-primary" 
                  : "text-neutral-600 hover:text-primary"
              }`}
            >
              In Evidenza
            </button>
            <button 
              onClick={() => setActiveTab("nlt")}
              className={`px-4 py-2 text-base font-medium transition-colors duration-300 ${
                activeTab === "nlt" 
                  ? "text-primary border-b-2 border-primary" 
                  : "text-neutral-600 hover:text-primary"
              }`}
            >
              NLT
            </button>
            <button 
              onClick={() => setActiveTab("rtb")}
              className={`px-4 py-2 text-base font-medium transition-colors duration-300 ${
                activeTab === "rtb" 
                  ? "text-primary border-b-2 border-primary" 
                  : "text-neutral-600 hover:text-primary"
              }`}
            >
              RTB
            </button>
            <button 
              onClick={() => setActiveTab("2life")}
              className={`px-4 py-2 text-base font-medium transition-colors duration-300 ${
                activeTab === "2life" 
                  ? "text-primary border-b-2 border-primary" 
                  : "text-neutral-600 hover:text-primary"
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
