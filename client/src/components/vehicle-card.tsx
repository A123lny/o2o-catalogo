import { Link } from "wouter";
import { Vehicle } from "@shared/schema";
import { Calendar, Gauge, Fuel, Settings, Car } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { RentalOption } from "@shared/schema";

interface VehicleCardProps {
  vehicle: Vehicle;
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  // Otteniamo le opzioni di noleggio dal database
  const { data: rentalOptions } = useQuery<RentalOption[]>({
    queryKey: [`/api/vehicles/${vehicle.id}/rental-options`],
    enabled: !!vehicle.id,
  });
  
  // Determina il tipo di noleggio in base alle opzioni disponibili
  const hasNLT = rentalOptions?.some(option => option.type === 'NLT');
  const hasRTB = rentalOptions?.some(option => option.type === 'RTB');
  const isPromo = vehicle.id % 5 === 0; // Simuliamo la promo per la demo
  
  // Calcola il prezzo mensile più basso dalle opzioni di noleggio disponibili
  const lowestPrice = rentalOptions?.length 
    ? Math.min(...rentalOptions.map(option => option.monthlyPrice))
    : null;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <Link href={`/vehicle/${vehicle.id}`}>
          <img 
            src={vehicle.mainImage || "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80"} 
            alt={vehicle.title} 
            className="w-full h-48 object-cover"
          />
        </Link>
        
        {/* Badge NLT e PROMO sul lato sinistro */}
        <div className="absolute top-0 left-0 mt-3 ml-3 flex flex-col gap-2">
          {hasNLT && (
            <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded">NLT</span>
          )}
          {isPromo && (
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded">PROMO</span>
          )}
        </div>
        
        {/* Badge prezzo mensile in alto a destra */}
        {lowestPrice && (
          <div className="absolute top-0 right-0 mt-3 mr-3">
            <span className="bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded">
              €{lowestPrice}/mese
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2">{vehicle.title}</h3>
        
        <div className="flex items-center text-sm text-neutral-600 mb-3">
          <div className="flex items-center mr-4">
            <Fuel className="h-4 w-4 mr-1 text-neutral-400" /> {vehicle.fuelType}
          </div>
          <div className="flex items-center mr-4">
            <Settings className="h-4 w-4 mr-1 text-neutral-400" /> {vehicle.transmission}
          </div>
          <div className="flex items-center">
            <Gauge className="h-4 w-4 mr-1 text-neutral-400" /> {vehicle.power} CV
          </div>
        </div>
        
        <div className="flex items-center text-sm text-neutral-600 mb-4">
          <div className="flex items-center mr-4">
            <Car className="h-4 w-4 mr-1 text-neutral-400" /> {vehicle.mileage.toLocaleString()} km/anno
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-neutral-400" /> 36 mesi
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <Link 
            href={`/vehicle/${vehicle.id}`} 
            className="bg-primary text-white px-4 py-2 rounded-md font-medium text-sm flex items-center hover:bg-primary-dark transition-colors"
          >
            Dettagli
          </Link>
          <div className="text-right">
            <div className="font-bold text-primary text-lg">
              {lowestPrice ? `€${lowestPrice}/mese` : "Contattaci"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
