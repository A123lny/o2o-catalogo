import { Link } from "wouter";
import { Vehicle } from "@shared/schema";
import { Calendar, Gauge, Fuel, ChevronRight } from "lucide-react";

interface VehicleCardProps {
  vehicle: Vehicle;
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
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
        
        {/* Badges */}
        {vehicle.badges && (vehicle.badges as string[]).length > 0 && (
          <div className="absolute top-0 right-0 mt-3 mr-3 flex flex-col gap-2">
            {(vehicle.badges as string[]).includes('promo') && (
              <span className="bg-secondary text-white text-xs font-semibold px-2 py-1 rounded">PROMO</span>
            )}
            {(vehicle.badges as string[]).includes('new') && (
              <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">NUOVO</span>
            )}
          </div>
        )}
        
        {/* Title and price overlay */}
        <div className="vehicle-image-overlay">
          <div className="flex justify-between items-end">
            <h3 className="font-bold text-xl">{vehicle.title}</h3>
            <div className="text-right">
              {vehicle.discountPrice ? (
                <>
                  <div className="text-sm line-through">€ {vehicle.price.toLocaleString()}</div>
                  <div className="font-bold text-xl">€ {vehicle.discountPrice.toLocaleString()}</div>
                </>
              ) : (
                <div className="font-bold text-xl">€ {vehicle.price.toLocaleString()}</div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center text-sm text-neutral-600 mb-3">
          <div className="flex items-center mr-4">
            <Calendar className="h-4 w-4 mr-1 text-neutral-400" /> {vehicle.year}
          </div>
          <div className="flex items-center mr-4">
            <Gauge className="h-4 w-4 mr-1 text-neutral-400" /> {vehicle.mileage.toLocaleString()} km
          </div>
          <div className="flex items-center">
            <Fuel className="h-4 w-4 mr-1 text-neutral-400" /> {vehicle.fuelType}
          </div>
        </div>
        
        <p className="mb-4 text-sm text-neutral-600 line-clamp-2">
          {vehicle.description}
        </p>
        
        <div className="flex justify-between items-center">
          <div>
            {/* Rental options tag */}
            <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded">
              {(vehicle as any).rentalOption || "Contattaci per opzioni"}
            </span>
          </div>
          <Link href={`/vehicle/${vehicle.id}`} className="text-primary hover:text-primary-dark font-medium flex items-center">
            Dettagli <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
