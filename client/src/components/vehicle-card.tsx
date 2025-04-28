import { Link } from "wouter";
import { Vehicle } from "@shared/schema";
import { Calendar, Gauge, Fuel, ChevronRight } from "lucide-react";

interface VehicleCardProps {
  vehicle: Vehicle;
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  // Determina il tipo di noleggio - per demo usiamo semplice logica randomica
  const hasNLT = vehicle.id % 2 === 0;
  const isPromo = vehicle.id % 5 === 0;
  const price = 279; // Prezzo fisso per corrispondere all'esempio

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
        <div className="absolute top-0 right-0 mt-3 mr-3">
          <span className="bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded">
            €{price}/mese
          </span>
        </div>
        
        {/* Title overlay rimosso per corrispondere al design dell'esempio */}
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2">{vehicle.title}</h3>
        
        <div className="flex items-center text-sm text-neutral-600 mb-3">
          <div className="flex items-center mr-4">
            <Fuel className="h-4 w-4 mr-1 text-neutral-400" /> {vehicle.fuelType}
          </div>
          <div className="flex items-center mr-4">
            <span className="mr-1">🔄</span> Automatico
          </div>
          <div className="flex items-center">
            <Gauge className="h-4 w-4 mr-1 text-neutral-400" /> {vehicle.power} CV
          </div>
        </div>
        
        <div className="flex items-center text-sm text-neutral-600 mb-4">
          <div className="flex items-center mr-4">
            <span className="mr-1">🚗</span> {vehicle.mileage.toLocaleString()} km/anno
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
              €{price}/mese
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
