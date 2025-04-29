import { Link } from "wouter";
import { Vehicle } from "@shared/schema";
import VehicleCard from "./vehicle-card";
import { ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

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
    // Funzione per verificare se un veicolo ha il badge specificato
    const hasBadge = (vehicle: Vehicle, badgeName: string) => {
      if (!vehicle.badges) return false;
      
      const badges = typeof vehicle.badges === 'string'
        ? JSON.parse(vehicle.badges as string)
        : vehicle.badges;
        
      return Array.isArray(badges) && badges.includes(badgeName);
    };
    
    // Ottieni i veicoli di tipo NLT o RTB
    const getVehiclesByContract = (vehicleList: Vehicle[], contractType: string) => {
      return vehicleList
        .filter(v => {
          // Verifica se il veicolo ha il badge del tipo di contratto desiderato
          const hasContractType = v.badges && hasBadge(v, contractType);
          return hasContractType;
        })
        .slice(0, 8);
    };
    
    switch (activeTab) {
      case "nlt":
        // Mostra veicoli con badge NLT
        return getVehiclesByContract(vehicles, "NLT").slice(0, 8);
      case "rtb":
        // Mostra veicoli con badge RTB
        return getVehiclesByContract(vehicles, "RTB").slice(0, 8);
      case "2life":
        // Mostra veicoli usati (2Life)
        return vehicles
          .filter(v => hasBadge(v, "2Life"))
          .slice(0, 8);
      case "featured":
      default:
        // Mostra veicoli in evidenza (Promo)
        return vehicles
          .filter(v => hasBadge(v, "Promo"))
          .slice(0, 16);
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
          <Link 
            href={activeTab === "featured" ? "/catalog?isPromo=true" : "/catalog"}
            className="inline-block px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-md transition duration-300"
          >
            Scopri tutto il catalogo
          </Link>
        </div>
      </div>
    </section>
  );
}
