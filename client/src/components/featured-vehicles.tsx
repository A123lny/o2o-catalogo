import { Link } from "wouter";
import { RentalOption, Vehicle } from "@shared/schema";
import VehicleCard from "./vehicle-card";
import { useState } from "react";
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
      
      // Assicuriamoci che badges sia un array
      let badgesArray: string[] = [];
      
      if (typeof vehicle.badges === 'string') {
        try {
          badgesArray = JSON.parse(vehicle.badges as string);
        } catch (e) {
          console.error("Errore nel parsing dei badge:", e);
          return false;
        }
      } else if (Array.isArray(vehicle.badges)) {
        badgesArray = vehicle.badges as unknown as string[];
      }
      
      return badgesArray.includes(badgeName);
    };
    
    // Per i veicoli di tipo NLT/RTB, controlliamo le opzioni del veicolo
    const { data: allRentalOptions } = useQuery<RentalOption[]>({
      queryKey: ['/api/rental-options/all'],
      enabled: activeTab === "nlt" || activeTab === "rtb",
    });
    
    // Identificare i veicoli con opzioni NLT o RTB
    const vehiclesWithContractTypes = new Map<number, Set<string>>();
    
    if (allRentalOptions && Array.isArray(allRentalOptions)) {
      allRentalOptions.forEach((option: RentalOption) => {
        if (!vehiclesWithContractTypes.has(option.vehicleId)) {
          vehiclesWithContractTypes.set(option.vehicleId, new Set<string>());
        }
        const contractTypes = vehiclesWithContractTypes.get(option.vehicleId);
        if (contractTypes) {
          contractTypes.add(option.type);
        }
      });
    }
    
    switch (activeTab) {
      case "nlt":
        // Mostra veicoli con opzioni NLT
        return vehicles
          .filter(v => vehiclesWithContractTypes.has(v.id) && 
                     vehiclesWithContractTypes.get(v.id)?.has("NLT"))
          .slice(0, 8);
      case "rtb":
        // Mostra veicoli con opzioni RTB
        return vehicles
          .filter(v => vehiclesWithContractTypes.has(v.id) && 
                     vehiclesWithContractTypes.get(v.id)?.has("RTB"))
          .slice(0, 8);
      case "2life":
        // Mostra veicoli usati (2Life)
        return vehicles
          .filter(v => hasBadge(v, "2Life"))
          .slice(0, 8);
      case "featured":
      default:
        // Mostra veicoli in evidenza 
        // Non filtriamo perché questi veicoli sono già stati filtrati dal backend
        return vehicles.slice(0, 16);
    }
  })();

  return (
    <section className="py-12 bg-neutral-100">
      <div className="container mx-auto px-4">
        <div className="flex flex-col w-full mb-8">
          <h2 className="text-3xl font-bold mb-6 text-center">I Nostri Veicoli</h2>
          
          <div className="flex border-b border-neutral-200 max-w-6xl mx-auto w-full">
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
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
