import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon, Loader2 } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import VehicleGallery from "@/components/vehicle-gallery";
import RequestForm from "@/components/request-form";
import VehicleCard from "@/components/vehicle-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Vehicle, RentalOption } from "@shared/schema";

export default function VehicleDetailPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/vehicle/:id");
  const vehicleId = params?.id ? parseInt(params.id) : null;
  const [activeTab, setActiveTab] = useState("description");
  const [selectedRentalOption, setSelectedRentalOption] = useState<number | null>(null);

  const { data: vehicle, isLoading: isLoadingVehicle } = useQuery<Vehicle>({
    queryKey: [`/api/vehicles/${vehicleId}`],
    enabled: !!vehicleId,
  });

  const { data: rentalOptions, isLoading: isLoadingRentalOptions } = useQuery<RentalOption[]>({
    queryKey: [`/api/vehicles/${vehicleId}/rental-options`],
    enabled: !!vehicleId,
  });

  const { data: relatedVehicles, isLoading: isLoadingRelated } = useQuery<Vehicle[]>({
    queryKey: [`/api/vehicles/${vehicleId}/related`],
    enabled: !!vehicleId,
  });

  useEffect(() => {
    // Set the default rental option
    if (rentalOptions && rentalOptions.length > 0) {
      const defaultOption = rentalOptions.find(option => option.isDefault);
      setSelectedRentalOption(defaultOption ? defaultOption.id : rentalOptions[0].id);
    }
  }, [rentalOptions]);

  if (!vehicleId) {
    navigate("/");
    return null;
  }

  if (isLoadingVehicle || isLoadingRentalOptions || isLoadingRelated) {
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

  if (!vehicle) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-12 flex-1">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Veicolo non trovato</h1>
            <p className="mb-6">Il veicolo che stai cercando non è disponibile o è stato rimosso.</p>
            <Button onClick={() => navigate("/catalog")}>Torna al catalogo</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const selectedOption = rentalOptions?.find(option => option.id === selectedRentalOption);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Gallery Section */}
            <div className="lg:w-7/12">
              <VehicleGallery
                mainImage={vehicle.mainImage}
                images={vehicle.images as string[]}
                title={vehicle.title}
              />
            </div>
            
            {/* Vehicle Info Section */}
            <div className="lg:w-5/12">
              <div className="flex items-center mb-2">
                {vehicle.badges && (vehicle.badges as string[]).map((badge, index) => (
                  <span key={index} className={`vehicle-card-badge ${badge}`}>
                    {badge === 'promo' ? 'PROMO' : badge === 'new' ? 'NUOVO' : badge.toUpperCase()}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl font-bold mb-2">{vehicle.title}</h1>
              <p className="text-neutral-600 mb-4">{vehicle.model}</p>
              
              <div className="flex items-end mb-6">
                {vehicle.discountPrice ? (
                  <>
                    <div className="text-lg text-neutral-500 line-through mr-3">€ {vehicle.price.toLocaleString()}</div>
                    <div className="text-3xl font-bold text-primary">€ {vehicle.discountPrice.toLocaleString()}</div>
                  </>
                ) : (
                  <div className="text-3xl font-bold text-primary">€ {vehicle.price.toLocaleString()}</div>
                )}
              </div>
              
              <div className="bg-neutral-100 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-3">Specifiche Tecniche</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-500">Anno</p>
                    <p className="font-medium">{vehicle.year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Chilometraggio</p>
                    <p className="font-medium">{vehicle.mileage.toLocaleString()} km</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Alimentazione</p>
                    <p className="font-medium">{vehicle.fuelType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Potenza</p>
                    <p className="font-medium">{vehicle.power} CV / {Math.round(vehicle.power * 0.735)} kW</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Cambio</p>
                    <p className="font-medium">{vehicle.transmission}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Condizione</p>
                    <p className="font-medium">{vehicle.condition}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Colore</p>
                    <p className="font-medium">{vehicle.color}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Interni</p>
                    <p className="font-medium">{vehicle.interiorColor}</p>
                  </div>
                </div>
              </div>
              
              {rentalOptions && rentalOptions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Opzioni di Acquisto</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {rentalOptions.map((option) => (
                      <div 
                        key={option.id}
                        className={`border p-4 rounded-lg hover:border-primary transition-colors cursor-pointer ${selectedRentalOption === option.id ? 'border-primary' : 'border-neutral-200'}`}
                        onClick={() => setSelectedRentalOption(option.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{option.type === 'NLT' ? 'Noleggio a Lungo Termine' : 'Rent to Buy'}</h4>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedRentalOption === option.id ? 'border-primary' : 'border-neutral-300'}`}>
                            {selectedRentalOption === option.id && <div className="w-3 h-3 rounded-full bg-primary"></div>}
                          </div>
                        </div>
                        <p className="text-sm text-neutral-600 mb-2">
                          {option.duration} mesi{option.annualMileage ? ` / ${option.annualMileage.toLocaleString()} km` : ''}
                        </p>
                        <p className="text-xl font-bold text-primary">
                          € {option.monthlyPrice}<span className="text-sm font-normal text-neutral-500">/mese</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#request-info" className="flex-1 bg-primary hover:bg-primary/90 text-white text-center font-medium py-3 px-6 rounded-md transition duration-300">
                  Richiedi Informazioni
                </a>
                <a href="tel:+390123456789" className="flex-1 bg-white border border-primary text-primary hover:bg-primary/5 text-center font-medium py-3 px-6 rounded-md transition duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Chiama Ora
                </a>
              </div>
            </div>
          </div>
          
          {/* Description Section */}
          <div className="mt-12">
            <Tabs defaultValue="description" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="border-b border-neutral-200 w-full justify-start">
                <TabsTrigger value="description" className="tab-button">Descrizione</TabsTrigger>
                <TabsTrigger value="features" className="tab-button">Equipaggiamenti</TabsTrigger>
                <TabsTrigger value="options" className="tab-button">Opzioni Finanziarie</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="pt-6">
                <div className="prose max-w-none">
                  <p className="text-neutral-700 mb-4">{vehicle.description}</p>
                </div>
              </TabsContent>
              
              <TabsContent value="features" className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vehicle.features && (vehicle.features as string[]).map((feature, index) => (
                    <div key={index} className="feature-item">
                      <CheckIcon className="feature-icon h-5 w-5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="options" className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {rentalOptions?.map((option) => (
                    <div key={option.id} className="border border-neutral-200 rounded-lg p-6">
                      <h3 className="text-xl font-bold mb-4">
                        {option.type === 'NLT' ? 'Noleggio a Lungo Termine' : 'Rent to Buy'}
                      </h3>
                      <p className="text-neutral-700 mb-4">
                        {option.type === 'NLT'
                          ? 'La soluzione ideale per chi desidera un\'auto nuova senza pensieri, con un canone mensile fisso che include:'
                          : 'La formula flessibile che ti permette di decidere al termine del periodo di noleggio se acquistare il veicolo, restituirlo o sostituirlo.'}
                      </p>
                      <ul className="space-y-2 mb-4">
                        {option.type === 'NLT' ? (
                          <>
                            <li className="feature-item">
                              <CheckIcon className="feature-icon h-5 w-5" />
                              <span>Manutenzione ordinaria e straordinaria</span>
                            </li>
                            <li className="feature-item">
                              <CheckIcon className="feature-icon h-5 w-5" />
                              <span>Assicurazione RCA, Kasko, Furto e Incendio</span>
                            </li>
                            <li className="feature-item">
                              <CheckIcon className="feature-icon h-5 w-5" />
                              <span>Assistenza stradale 24/7</span>
                            </li>
                            <li className="feature-item">
                              <CheckIcon className="feature-icon h-5 w-5" />
                              <span>Auto sostitutiva in caso di guasto</span>
                            </li>
                          </>
                        ) : (
                          <>
                            <li className="feature-item">
                              <CheckIcon className="feature-icon h-5 w-5" />
                              <span>Canoni mensili più contenuti rispetto al NLT</span>
                            </li>
                            <li className="feature-item">
                              <CheckIcon className="feature-icon h-5 w-5" />
                              <span>Manutenzione ordinaria inclusa</span>
                            </li>
                            <li className="feature-item">
                              <CheckIcon className="feature-icon h-5 w-5" />
                              <span>Assicurazione RCA e assistenza stradale</span>
                            </li>
                            <li className="feature-item">
                              <CheckIcon className="feature-icon h-5 w-5" />
                              <span>Opzione di acquisto a fine contratto</span>
                            </li>
                          </>
                        )}
                      </ul>
                      <div className="pt-4 border-t border-neutral-200">
                        <div className="flex justify-between mb-2">
                          <span className="text-neutral-700">Anticipo</span>
                          <span className="font-medium">€ {option.deposit.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-neutral-700">Durata</span>
                          <span className="font-medium">{option.duration} mesi</span>
                        </div>
                        {option.annualMileage && (
                          <div className="flex justify-between mb-2">
                            <span className="text-neutral-700">Chilometraggio</span>
                            <span className="font-medium">{option.annualMileage.toLocaleString()} km/anno</span>
                          </div>
                        )}
                        {option.finalPayment && (
                          <div className="flex justify-between mb-2">
                            <span className="text-neutral-700">Rata finale</span>
                            <span className="font-medium">€ {option.finalPayment.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xl font-bold text-primary mt-3">
                          <span>Canone mensile</span>
                          <span>€ {option.monthlyPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Request Info Form */}
          <div id="request-info" className="mt-12 bg-neutral-100 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-6">Richiedi Informazioni</h2>
            <RequestForm vehicleId={vehicle.id} selectedRentalType={selectedOption?.type || 'NLT'} />
          </div>
          
          {/* Related Vehicles */}
          {relatedVehicles && relatedVehicles.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Veicoli Simili</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedVehicles.map(vehicle => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
