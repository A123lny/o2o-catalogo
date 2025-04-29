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

  // Filtra i veicoli in base al tab selezionato
  const filteredVehicles = (() => {
    switch (activeTab) {
      case "nlt":
        // Mostra veicoli che hanno opzioni NLT (mostreremo solo i primi 6)
        return vehicles.filter(v => 
          // Per semplicità, useremo alcuni veicoli specifici per questo tab
          [1, 3, 5, 7, 9].includes(v.id)
        ).slice(0, 6);
      case "rtb":
        // Mostra veicoli che hanno opzioni RTB (mostreremo solo i primi 6)
        return vehicles.filter(v => 
          // Per semplicità, useremo alcuni veicoli specifici per questo tab
          [2, 4, 6, 8, 10].includes(v.id)
        ).slice(0, 6);
      case "2life":
        // Mostra veicoli usati (2Life)
        return vehicles.filter(v => v.condition === "2Life").slice(0, 6);
      case "featured":
      default:
        // Mostra veicoli in evidenza
        return vehicles.filter(v => v.featured).slice(0, 6);
    }
  })();

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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVehicles.length > 0 ? (
            filteredVehicles.map(vehicle => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))
          ) : (
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-10">
              <p className="text-lg text-gray-600">Nessun veicolo disponibile in questa categoria.</p>
            </div>
          )}
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
