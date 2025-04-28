import React, { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Vehicle, RentalOption } from "@shared/schema";
import Header from "@/components/header";
import Footer from "@/components/footer";
import VehicleGallery from "@/components/vehicle-gallery";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  CheckIcon,
  Calendar,
  Fuel,
  Gauge,
  Activity,
  BarChart2,
  Zap,
  ChevronRight,
  Shield,
  Palette,
  Briefcase,
  User2,
  Star
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Funzione di utilità per ottenere il colore esadecimale
function getColorHex(colorName: string): string | null {
  const colorMap: Record<string, string> = {
    'Nero': '#000000',
    'Bianco': '#FFFFFF',
    'Grigio': '#808080',
    'Argento': '#C0C0C0',
    'Rosso': '#FF0000',
    'Blu': '#0000FF',
    'Verde': '#008000',
    'Giallo': '#FFFF00',
    'Arancione': '#FFA500',
    'Marrone': '#A52A2A',
    'Bordeaux': '#800000',
    'Azzurro': '#007FFF',
    'Beige': '#F5F5DC',
    'Oro': '#FFD700',
    'Bronzo': '#CD7F32',
  };
  
  return colorMap[colorName] || null;
}

export default function VehicleDetailPage() {
  const [, params] = useRoute("/vehicle/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Stati locali
  const [activeTab, setActiveTab] = useState("description");
  const [selectedRentalOption, setSelectedRentalOption] = useState<number | null>(null);
  const [activeContractType, setActiveContractType] = useState<'NLT' | 'RTB'>('NLT');
  const [clientType, setClientType] = useState<'private' | 'business'>('private');
  
  const vehicleId = params ? parseInt(params.id) : 0;
  
  // Fetch veicolo
  const { data: vehicle, isLoading: isLoadingVehicle } = useQuery<Vehicle>({
    queryKey: ["/api/vehicles", vehicleId],
    queryFn: () => apiRequest("GET", `/api/vehicles/${vehicleId}`).then(res => res.json()),
    enabled: vehicleId > 0
  });
  
  // Fetch opzioni noleggio
  const { data: rentalOptions, isLoading: isLoadingRentalOptions } = useQuery<RentalOption[]>({
    queryKey: ["/api/vehicles", vehicleId, "rental-options"],
    queryFn: () => apiRequest("GET", `/api/vehicles/${vehicleId}/rental-options`).then(res => res.json()),
    enabled: vehicleId > 0
  });
  
  // Fetch veicoli correlati
  const { data: relatedVehicles, isLoading: isLoadingRelated } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles", vehicleId, "related"],
    queryFn: () => apiRequest("GET", `/api/vehicles/${vehicleId}/related`).then(res => res.json()),
    enabled: vehicleId > 0
  });
  
  // Crea le opzioni di noleggio arricchite, se non ci sono opzioni nel DB
  const enhancedRentalOptions = React.useMemo(() => {
    if (!rentalOptions || rentalOptions.length === 0) return [];
    
    // Trova le opzioni esistenti nel database
    const dbOptions = [...rentalOptions];
    
    // Se abbiamo meno di 3 opzioni per tipo, generiamo le opzioni mancanti
    const result: RentalOption[] = [];
    
    // Durate richieste: 12, 24, 36, 48 mesi
    const requiredDurations = [12, 24, 36, 48];
    
    // Per tipo NLT
    const nltOptions = dbOptions.filter(o => o.type === 'NLT');
    for (const duration of requiredDurations) {
      // Cerca se esiste già un'opzione con questa durata
      const existingOption = nltOptions.find(o => o.duration === duration);
      
      if (existingOption) {
        // Aggiungi l'opzione esistente
        result.push(existingOption);
      } else if (nltOptions.length > 0) {
        // Crea una nuova opzione basata sulla prima opzione NLT
        const baseOption = nltOptions[0];
        const factor = duration / baseOption.duration;
        
        result.push({
          ...baseOption,
          id: baseOption.id + 1000 + duration, // ID fittizio
          duration: duration,
          deposit: Math.round(baseOption.deposit * (factor * 0.9)),
          monthlyPrice: Math.round(baseOption.monthlyPrice * (factor < 1 ? 1.2 : 0.9)),
          caution: baseOption.caution || 1500,
          setupFee: baseOption.setupFee || 350,
          annualMileage: duration <= 24 ? 15000 : 20000,
          includedServices: baseOption.includedServices || [
            "Manutenzione ordinaria e straordinaria",
            "Assicurazione RCA",
            "Copertura Furto/Incendio",
            "Assistenza stradale 24/7"
          ]
        });
      }
    }
    
    // Per tipo RTB
    const rtbOptions = dbOptions.filter(o => o.type === 'RTB');
    for (const duration of requiredDurations) {
      // Cerca se esiste già un'opzione con questa durata
      const existingOption = rtbOptions.find(o => o.duration === duration);
      
      if (existingOption) {
        // Aggiungi l'opzione esistente
        result.push(existingOption);
      } else if (rtbOptions.length > 0) {
        // Crea una nuova opzione basata sulla prima opzione RTB
        const baseOption = rtbOptions[0];
        const factor = duration / baseOption.duration;
        
        result.push({
          ...baseOption,
          id: baseOption.id + 2000 + duration, // ID fittizio per RTB
          duration: duration,
          deposit: Math.round(baseOption.deposit * (factor * 0.9)),
          monthlyPrice: Math.round(baseOption.monthlyPrice * (factor < 1 ? 1.15 : 0.85)),
          caution: baseOption.caution || 1000,
          setupFee: baseOption.setupFee || 350,
          finalPayment: baseOption.finalPayment 
            ? Math.round(baseOption.finalPayment * (factor < 1 ? 1.1 : 0.9))
            : Math.round(vehicle?.price || 0) * 0.3,
          includedServices: baseOption.includedServices || [
            "Manutenzione ordinaria per i primi 12 mesi",
            "Garanzia estesa",
            "Prima revisione gratuita"
          ]
        });
      }
    }
    
    // Se non abbiamo opzioni nel database, creiamo opzioni fittizie
    if (result.length === 0) {
      // Opzioni NLT base
      const basePrice = vehicle?.price || 30000;
      
      // Aggiungi le opzioni NLT
      for (const duration of requiredDurations) {
        const factor = duration / 36; // Base = 36 mesi
        
        result.push({
          id: 1000 + duration,
          vehicleId: vehicleId,
          type: 'NLT',
          duration: duration,
          deposit: Math.round(basePrice * 0.15 * (factor * 0.9)),
          monthlyPrice: Math.round(basePrice * 0.02 * (factor < 1 ? 1.2 : 0.9)),
          caution: 1500,
          setupFee: 350,
          annualMileage: duration <= 24 ? 15000 : 20000,
          finalPayment: null,
          isDefault: duration === 36,
          includedServices: [
            "Manutenzione ordinaria e straordinaria",
            "Assicurazione RCA",
            "Copertura Furto/Incendio",
            "Assistenza stradale 24/7"
          ]
        });
      }
      
      // Aggiungi le opzioni RTB
      for (const duration of requiredDurations) {
        const factor = duration / 36; // Base = 36 mesi
        
        result.push({
          id: 2000 + duration,
          vehicleId: vehicleId,
          type: 'RTB',
          duration: duration,
          deposit: Math.round(basePrice * 0.1 * (factor * 0.9)),
          monthlyPrice: Math.round(basePrice * 0.015 * (factor < 1 ? 1.15 : 0.85)),
          caution: 1000,
          setupFee: 350,
          annualMileage: null,
          finalPayment: Math.round(basePrice * 0.4 * (factor < 1 ? 1.1 : 0.9)),
          isDefault: duration === 36,
          includedServices: [
            "Manutenzione ordinaria per i primi 12 mesi",
            "Garanzia estesa",
            "Prima revisione gratuita"
          ]
        });
      }
    }
    
    return result;
  }, [rentalOptions, vehicleId, vehicle]);
  
  // Seleziona l'opzione predefinita al caricamento delle opzioni
  useEffect(() => {
    if (enhancedRentalOptions && enhancedRentalOptions.length > 0) {
      // Trova le opzioni del tipo attivo
      const typeOptions = enhancedRentalOptions.filter(option => option.type === activeContractType);
      
      if (typeOptions.length > 0) {
        // Preferisci l'opzione di 36 mesi, se esiste
        const option36Months = typeOptions.find(o => o.duration === 36);
        
        if (option36Months) {
          setSelectedRentalOption(option36Months.id);
        } else {
          // Altrimenti, prendi la prima opzione
          setSelectedRentalOption(typeOptions[0].id);
        }
      }
    }
  }, [enhancedRentalOptions, activeContractType]);
  
  // Cambia tipo di contratto
  const handleContractTypeChange = (type: 'NLT' | 'RTB') => {
    setActiveContractType(type);
    
    // Trova le opzioni per il nuovo tipo
    const options = enhancedRentalOptions.filter(option => option.type === type);
    
    // Seleziona l'opzione di 36 mesi o la prima disponibile
    const option36Months = options.find(o => o.duration === 36);
    if (option36Months) {
      setSelectedRentalOption(option36Months.id);
    } else if (options.length > 0) {
      setSelectedRentalOption(options[0].id);
    } else {
      setSelectedRentalOption(null);
    }
  };
  
  // Gestisce il click su "Richiedi informazioni"
  const handleRequestInfo = () => {
    if (selectedRentalOption) {
      console.log("Richiesta informazioni per opzione:", selectedRentalOption);
      navigate(`/request-info/${vehicleId}/${selectedRentalOption}`);
    } else {
      toast({
        title: "Seleziona un'opzione",
        description: "Per procedere, seleziona prima una delle opzioni di contratto disponibili.",
        variant: "destructive",
      });
    }
  };
  
  // Mostra il caricamento durante il fetching dei dati
  if (isLoadingVehicle || isLoadingRentalOptions) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
        <Footer />
      </div>
    );
  }
  
  // Reindirizza alla home se il veicolo non esiste
  if (!vehicle) {
    navigate("/");
    return null;
  }
  
  // Prepara le immagini per la galleria
  const allImages = vehicle.mainImage 
    ? [vehicle.mainImage, ...(Array.isArray(vehicle.images) ? vehicle.images : [])] 
    : (Array.isArray(vehicle.images) ? vehicle.images : []);
  
  // Filtra le opzioni per il tipo corrente
  const filteredOptions = enhancedRentalOptions.filter(option => option.type === activeContractType);
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="flex mb-4 text-sm">
            <a href="/" className="text-blue-500 hover:text-blue-700">Home</a>
            <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
            <a href="/catalog" className="text-blue-500 hover:text-blue-700">Catalogo</a>
            <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{vehicle.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Colonna sinistra - Galleria e dettagli veicolo */}
            <div className="lg:col-span-7">
              {/* Galleria immagini */}
              <div className="bg-white rounded-lg overflow-hidden shadow-sm mb-6">
                {allImages.length > 0 ? (
                  <VehicleGallery 
                    mainImage={vehicle.mainImage || allImages[0]} 
                    images={allImages.slice(1)} 
                    title={vehicle.title}
                  />
                ) : (
                  <div className="h-[400px] bg-gray-100 flex items-center justify-center">
                    <p className="text-gray-400">Nessuna immagine disponibile</p>
                  </div>
                )}
              </div>

              {/* Tabs dettagli veicolo */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <Tabs defaultValue="description" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="border-b border-gray-200 w-full justify-start bg-transparent mb-6">
                    <TabsTrigger 
                      value="description" 
                      className="px-4 py-3 text-gray-600 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 font-medium"
                    >
                      Descrizione
                    </TabsTrigger>
                    <TabsTrigger 
                      value="colors" 
                      className="px-4 py-3 text-gray-600 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 font-medium"
                    >
                      Colore
                    </TabsTrigger>
                    <TabsTrigger 
                      value="features" 
                      className="px-4 py-3 text-gray-600 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 font-medium"
                    >
                      Equipaggiamenti
                    </TabsTrigger>
                    <TabsTrigger 
                      value="details" 
                      className="px-4 py-3 text-gray-600 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 font-medium"
                    >
                      Specifiche
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="description" className="text-gray-600 leading-relaxed">
                    <p className="whitespace-pre-line">{vehicle.description}</p>
                  </TabsContent>
                  
                  <TabsContent value="colors">
                    <div className="space-y-4">
                      <div className="flex justify-between p-3 rounded-lg bg-gray-50">
                        <span className="text-gray-600">Colore esterno</span>
                        <div className="flex items-center">
                          {vehicle.color && (
                            <div 
                              className="w-6 h-6 rounded-full mr-2 border border-gray-300" 
                              style={{ 
                                backgroundColor: getColorHex(vehicle.color) || '#CCCCCC',
                                boxShadow: getColorHex(vehicle.color) === '#FFFFFF' ? 'inset 0 0 0 1px #e5e7eb' : 'none' 
                              }}
                            ></div>
                          )}
                          <span className="font-medium">{vehicle.color || '-'}</span>
                        </div>
                      </div>
                      <div className="flex justify-between p-3 rounded-lg bg-gray-50">
                        <span className="text-gray-600">Colore interno</span>
                        <div className="flex items-center">
                          {vehicle.interiorColor && (
                            <div 
                              className="w-6 h-6 rounded-full mr-2 border border-gray-300" 
                              style={{ 
                                backgroundColor: getColorHex(vehicle.interiorColor) || '#CCCCCC',
                                boxShadow: getColorHex(vehicle.interiorColor) === '#FFFFFF' ? 'inset 0 0 0 1px #e5e7eb' : 'none' 
                              }}
                            ></div>
                          )}
                          <span className="font-medium">{vehicle.interiorColor || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="features">
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(vehicle.features) && 
                        vehicle.features.map((feature, index) => (
                          <div key={index} className="flex items-center bg-gray-50 rounded-full px-4 py-2">
                            <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="details">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center mb-1">
                          <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                          <span className="font-medium">Anno</span>
                        </div>
                        <p className="pl-7 text-gray-600">{vehicle.year}</p>
                      </div>
                      
                      <div className="p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center mb-1">
                          <Gauge className="h-5 w-5 text-blue-500 mr-2" />
                          <span className="font-medium">Kilometraggio</span>
                        </div>
                        <p className="pl-7 text-gray-600">{vehicle.mileage.toLocaleString()} km</p>
                      </div>
                      
                      <div className="p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center mb-1">
                          <Fuel className="h-5 w-5 text-blue-500 mr-2" />
                          <span className="font-medium">Alimentazione</span>
                        </div>
                        <p className="pl-7 text-gray-600">{vehicle.fuelType}</p>
                      </div>
                      
                      <div className="p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center mb-1">
                          <BarChart2 className="h-5 w-5 text-blue-500 mr-2" />
                          <span className="font-medium">Cambio</span>
                        </div>
                        <p className="pl-7 text-gray-600">{vehicle.transmission}</p>
                      </div>
                      
                      <div className="p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center mb-1">
                          <Zap className="h-5 w-5 text-blue-500 mr-2" />
                          <span className="font-medium">Potenza</span>
                        </div>
                        <p className="pl-7 text-gray-600">{vehicle.power} CV</p>
                      </div>
                      
                      <div className="p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center mb-1">
                          <Activity className="h-5 w-5 text-blue-500 mr-2" />
                          <span className="font-medium">Condizione</span>
                        </div>
                        <p className="pl-7 text-gray-600">{vehicle.condition}</p>
                      </div>
                      
                      <div className="p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center mb-1">
                          <Palette className="h-5 w-5 text-blue-500 mr-2" />
                          <span className="font-medium">Colore</span>
                        </div>
                        <p className="pl-7 text-gray-600">{vehicle.color}</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              {/* Veicoli correlati */}
              {relatedVehicles && relatedVehicles.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-2xl font-bold mb-6">Auto simili</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {relatedVehicles.map(relatedVehicle => (
                      <div 
                        key={relatedVehicle.id} 
                        className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => navigate(`/vehicle/${relatedVehicle.id}`)}
                      >
                        {/* Immagine */}
                        <div className="h-48 overflow-hidden">
                          <img 
                            src={relatedVehicle.mainImage || "https://placehold.co/600x400?text=Immagine+non+disponibile"} 
                            alt={relatedVehicle.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Dettagli */}
                        <div className="p-4">
                          <h3 className="text-lg font-bold text-gray-800 mb-1">{relatedVehicle.title}</h3>
                          <div className="flex items-center text-sm text-gray-500 mb-2">
                            <span>{relatedVehicle.year}</span>
                            <span className="mx-1">•</span>
                            <span>{relatedVehicle.fuelType}</span>
                            <span className="mx-1">•</span>
                            <span>{relatedVehicle.mileage.toLocaleString()} km</span>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <div>
                              {relatedVehicle.discountPrice ? (
                                <>
                                  <span className="line-through text-gray-400">€{relatedVehicle.price.toLocaleString()}</span>
                                  <span className="text-lg font-bold text-blue-600 ml-2">€{relatedVehicle.discountPrice.toLocaleString()}</span>
                                </>
                              ) : (
                                <span className="text-lg font-bold text-blue-600">€{relatedVehicle.price.toLocaleString()}</span>
                              )}
                            </div>
                            <Button variant="outline" size="sm">Dettagli</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Colonna destra - Prezzi e opzioni */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{vehicle.title}</h1>
                
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <span>{vehicle.year}</span>
                  <span className="mx-1">•</span>
                  <span>{vehicle.fuelType}</span>
                  <span className="mx-1">•</span>
                  <span>{vehicle.mileage.toLocaleString()} km</span>
                </div>
                
                <div className="mb-6">
                  {vehicle.discountPrice ? (
                    <div className="flex items-center">
                      <span className="line-through text-gray-400 text-lg">€{vehicle.price.toLocaleString()}</span>
                      <span className="text-2xl font-bold text-blue-600 ml-3">€{vehicle.discountPrice.toLocaleString()}</span>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-blue-600">€{vehicle.price.toLocaleString()}</span>
                  )}
                </div>
                
                <Separator className="my-6" />
                
                <h2 className="text-xl font-bold mb-4">Le nostre Soluzioni</h2>
                
                {/* Selettore tipo cliente */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Tipo cliente:</h3>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setClientType('private')}
                      className={`flex items-center px-3 py-1.5 rounded-md text-sm ${
                        clientType === 'private' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <User2 className="w-4 h-4 mr-1.5" />
                      Privato
                      {clientType === 'private' && <Star className="w-3.5 h-3.5 ml-1.5 text-blue-500" />}
                    </button>
                    <button 
                      onClick={() => setClientType('business')}
                      className={`flex items-center px-3 py-1.5 rounded-md text-sm ${
                        clientType === 'business' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <Briefcase className="w-4 h-4 mr-1.5" />
                      Azienda/P.IVA
                      {clientType === 'business' && <Star className="w-3.5 h-3.5 ml-1.5 text-blue-500" />}
                    </button>
                  </div>
                </div>
                
                {/* Selettore tipo contratto */}
                <div className="flex space-x-4 mb-6">
                  <Button
                    variant={activeContractType === 'NLT' ? "default" : "outline"}
                    className={`flex-1 ${activeContractType === 'NLT' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                    onClick={() => handleContractTypeChange('NLT')}
                  >
                    Noleggio a Lungo Termine
                  </Button>
                  <Button
                    variant={activeContractType === 'RTB' ? "default" : "outline"}
                    className={`flex-1 ${activeContractType === 'RTB' ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                    onClick={() => handleContractTypeChange('RTB')}
                  >
                    Rent to Buy
                  </Button>
                </div>
                
                {/* Opzioni contratto */}
                {filteredOptions.length > 0 ? (
                  <div className="space-y-4">
                    {filteredOptions
                      .sort((a, b) => a.duration - b.duration) // Ordina per durata
                      .map((option) => {
                        // Determina se questa è l'opzione consigliata per la durata (36 mesi)
                        const isRecommended = option.duration === 36;
                        
                        return (
                          <div 
                            key={option.id}
                            onClick={() => setSelectedRentalOption(option.id)}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              selectedRentalOption === option.id 
                                ? `border-2 ${option.type === 'NLT' ? 'border-blue-400' : 'border-orange-400'} bg-gray-50` 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex justify-between mb-2">
                              <h3 className="font-bold text-gray-800">{option.duration} mesi</h3>
                              <div className="flex items-center">
                                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                                  option.type === 'NLT' ? 'bg-blue-500' : 'bg-orange-500'
                                }`}></span>
                                <span className="text-sm font-medium text-gray-600">
                                  {option.type === 'NLT' ? 'Noleggio' : 'Rent to Buy'}
                                </span>
                              </div>
                            </div>
                            
                            {isRecommended && (
                              <div className="mb-2">
                                <span className="inline-block text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                  Soluzione consigliata
                                </span>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <span className="text-sm text-gray-500">Anticipo</span>
                                <p className="font-bold text-gray-900">€{option.deposit.toLocaleString()}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {clientType === 'private' ? 'IVA inclusa' : 'IVA esclusa'}
                                </p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500">Canone mensile</span>
                                <p className="font-bold text-gray-900">€{option.monthlyPrice.toLocaleString()}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {clientType === 'private' ? 'IVA inclusa' : 'IVA esclusa'}
                                </p>
                              </div>
                              
                              {/* Mostra il deposito cauzionale se presente */}
                              {option.caution !== null && option.caution !== undefined && (
                                <div>
                                  <span className="text-sm text-gray-500">Deposito cauzionale</span>
                                  <p className="font-bold text-gray-900">€{option.caution.toLocaleString()}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {clientType === 'private' ? 'IVA inclusa' : 'IVA esclusa'}
                                  </p>
                                </div>
                              )}
                              
                              {/* Mostra le spese di istruttoria se presenti */}
                              {option.setupFee !== null && option.setupFee !== undefined && (
                                <div>
                                  <span className="text-sm text-gray-500">Spese istruttoria</span>
                                  <p className="font-bold text-gray-900">€{option.setupFee.toLocaleString()}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {clientType === 'private' ? 'IVA inclusa' : 'IVA esclusa'}
                                  </p>
                                </div>
                              )}
                              
                              {/* Mostra il riscatto finale solo per RTB */}
                              {option.type === 'RTB' && option.finalPayment && (
                                <div>
                                  <span className="text-sm text-gray-500">Riscatto finale</span>
                                  <p className="font-bold text-gray-900">€{option.finalPayment.toLocaleString()}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {clientType === 'private' ? 'IVA inclusa' : 'IVA esclusa'}
                                  </p>
                                </div>
                              )}
                              
                              {/* Mostra il chilometraggio annuo per NLT */}
                              {option.type === 'NLT' && option.annualMileage && (
                                <div>
                                  <span className="text-sm text-gray-500">Km/anno</span>
                                  <p className="font-bold text-gray-900">{option.annualMileage.toLocaleString()}</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Mostra i servizi inclusi se l'opzione è selezionata */}
                            {selectedRentalOption === option.id && option.includedServices && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <h4 className="font-medium text-gray-700 mb-2">Inclusi nel canone:</h4>
                                <ul className="space-y-1">
                                  {Array.isArray(option.includedServices) && option.includedServices.map((service, idx) => (
                                    <li key={idx} className="flex items-start text-sm">
                                      <Shield className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                                      <span>{service}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nessuna opzione di noleggio disponibile per questo veicolo.</p>
                  </div>
                )}
                
                {/* Pulsante richiedi informazioni */}
                <div className="mt-6">
                  <Button 
                    onClick={handleRequestInfo}
                    className="w-full py-6 text-base bg-orange-500 hover:bg-orange-600"
                  >
                    Richiedi informazioni
                  </Button>
                </div>
                
                {/* Nota sull'IVA */}
                <div className="mt-4 text-xs text-gray-500 text-center">
                  Tutti i prezzi sono da intendersi {clientType === 'private' ? 'IVA inclusa' : 'IVA esclusa'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}