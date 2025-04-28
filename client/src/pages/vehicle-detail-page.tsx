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
  Shield,
  ChevronRight,
} from "lucide-react";

// Interfaccia estesa per aggiungere proprietà specifiche per la visualizzazione
interface EnhancedRentalOption extends RentalOption {
  recommendedForKm?: number;
  includedServices: string[];
}

// Funzione di utilità per ottenere il colore esadecimale da un nome di colore
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
  
  // Stato locale
  const [activeTab, setActiveTab] = useState("description");
  const [selectedRentalOption, setSelectedRentalOption] = useState<number | null>(null);
  const [activeContractType, setActiveContractType] = useState<'NLT' | 'RTB'>('NLT');
  
  const vehicleId = parseInt(params?.id || "0");
  
  // Fetch dei dati
  const { data: vehicle, isLoading: isLoadingVehicle } = useQuery<Vehicle>({
    queryKey: [`/api/vehicles/${vehicleId}`],
    enabled: !!vehicleId,
  });
  
  const { data: dbRentalOptions, isLoading: isLoadingRentalOptions } = useQuery<RentalOption[]>({
    queryKey: [`/api/vehicles/${vehicleId}/rental-options`],
    enabled: !!vehicleId,
  });
  
  const { data: relatedVehicles, isLoading: isLoadingRelated } = useQuery<Vehicle[]>({
    queryKey: [`/api/vehicles/${vehicleId}/related`],
    enabled: !!vehicleId,
  });
  
  // Arricchimento delle opzioni di noleggio con dati aggiuntivi
  const enhancedRentalOptions = React.useMemo<EnhancedRentalOption[]>(() => {
    if (!dbRentalOptions || dbRentalOptions.length === 0) return [];
    
    // Recupero opzioni originali
    const originalNlt = dbRentalOptions.find(o => o.type === 'NLT');
    const originalRtb = dbRentalOptions.find(o => o.type === 'RTB');
    
    const result: EnhancedRentalOption[] = [];
    
    // Aggiungiamo le opzioni originali con servizi inclusi
    if (originalNlt) {
      result.push({
        ...originalNlt,
        includedServices: [
          "Manutenzione ordinaria e straordinaria",
          "Assicurazione RCA",
          "Copertura Kasko e Furto/Incendio",
          "Assistenza stradale 24/7",
          "Cambio pneumatici stagionali"
        ]
      });
      
      // Versione 24 mesi
      result.push({
        ...originalNlt,
        id: originalNlt.id + 1000, // ID fittizio per la demo
        duration: 24,
        deposit: Math.round(originalNlt.deposit * 0.8),
        caution: originalNlt.caution || 1200,
        setupFee: originalNlt.setupFee || 350,
        monthlyPrice: Math.round(originalNlt.monthlyPrice * 1.15),
        recommendedForKm: 15000,
        includedServices: [
          "Manutenzione ordinaria",
          "Assicurazione RCA",
          "Copertura Furto/Incendio",
          "Assistenza stradale"
        ]
      });
      
      // Versione 48 mesi
      result.push({
        ...originalNlt,
        id: originalNlt.id + 2000, // ID fittizio per la demo
        duration: 48,
        deposit: Math.round(originalNlt.deposit * 1.2),
        caution: originalNlt.caution || 1500,
        setupFee: originalNlt.setupFee || 350,
        monthlyPrice: Math.round(originalNlt.monthlyPrice * 0.85),
        annualMileage: 20000,
        recommendedForKm: 20000,
        includedServices: [
          "Manutenzione ordinaria e straordinaria",
          "Assicurazione RCA",
          "Copertura Kasko e Furto/Incendio",
          "Assistenza stradale 24/7",
          "Cambio pneumatici stagionali",
          "Auto sostitutiva"
        ]
      });
    }
    
    if (originalRtb) {
      result.push({
        ...originalRtb,
        includedServices: [
          "Manutenzione ordinaria per i primi 12 mesi",
          "Garanzia estesa per la durata del contratto",
          "Prima revisione gratuita"
        ]
      });
      
      // Versione 24 mesi
      result.push({
        ...originalRtb,
        id: originalRtb.id + 1000, // ID fittizio per la demo
        duration: 24,
        deposit: Math.round(originalRtb.deposit * 0.9),
        caution: originalRtb.caution || 1000,
        setupFee: originalRtb.setupFee || 350,
        monthlyPrice: Math.round(originalRtb.monthlyPrice * 1.2),
        finalPayment: Math.round((originalRtb.finalPayment || 0) * 1.1),
        includedServices: [
          "Manutenzione ordinaria per i primi 18 mesi",
          "Garanzia estesa per la durata del contratto",
          "Due tagliandi gratuiti"
        ]
      });
      
      // Versione 60 mesi
      result.push({
        ...originalRtb,
        id: originalRtb.id + 2000, // ID fittizio per la demo
        duration: 60,
        deposit: Math.round(originalRtb.deposit * 1.3),
        caution: originalRtb.caution || 1800,
        setupFee: originalRtb.setupFee || 350,
        monthlyPrice: Math.round(originalRtb.monthlyPrice * 0.75),
        finalPayment: Math.round((originalRtb.finalPayment || 0) * 0.9),
        includedServices: [
          "Manutenzione ordinaria per i primi 24 mesi",
          "Garanzia estesa per la durata del contratto",
          "Tre tagliandi gratuiti",
          "Prima immatricolazione inclusa"
        ]
      });
    }
    
    console.log("Opzioni di noleggio create:", result);
    return result;
  }, [dbRentalOptions]);
  
  // Seleziona l'opzione predefinita al caricamento delle opzioni
  useEffect(() => {
    if (enhancedRentalOptions && enhancedRentalOptions.length > 0) {
      // Trova opzione a 36 mesi del tipo selezionato (NLT di default)
      const defaultOption = enhancedRentalOptions.find(
        option => option.duration === 36 && option.type === activeContractType
      );
      
      if (defaultOption) {
        console.log("Selezionata opzione predefinita:", defaultOption);
        setSelectedRentalOption(defaultOption.id);
      } else {
        // Fallback alla prima opzione del tipo attivo
        const fallbackOption = enhancedRentalOptions.find(o => o.type === activeContractType);
        if (fallbackOption) {
          console.log("Selezionata opzione fallback:", fallbackOption);
          setSelectedRentalOption(fallbackOption.id);
        }
      }
    }
  }, [enhancedRentalOptions, activeContractType]);
  
  // Cambio del tipo di contratto
  const handleContractTypeChange = (type: 'NLT' | 'RTB') => {
    setActiveContractType(type);
    // Trova una nuova opzione del tipo selezionato
    const newOption = enhancedRentalOptions.find(o => o.type === type);
    if (newOption) {
      setSelectedRentalOption(newOption.id);
    }
  };
  
  // Gestisce il click sul pulsante "Richiedi informazioni"
  const handleRequestInfo = () => {
    if (selectedRentalOption === null) {
      toast({
        title: "Seleziona un'opzione",
        description: "Per procedere, seleziona prima una delle opzioni di contratto disponibili.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Richiesta informazioni per opzione:", selectedRentalOption);
    navigate(`/request-info/${vehicleId}/${selectedRentalOption}`);
  };
  
  // Reindirizza alla home se non c'è ID del veicolo
  if (!vehicleId) {
    navigate("/");
    return null;
  }
  
  // Mostra il caricamento durante il fetching dei dati
  if (isLoadingVehicle || isLoadingRentalOptions || isLoadingRelated) {
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
  
  // Mostra un messaggio se il veicolo non è stato trovato
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
  
  // Trova l'opzione selezionata dall'utente
  const selectedOption = enhancedRentalOptions.find(o => o.id === selectedRentalOption);
  
  // Prepara le immagini per la galleria
  const allImages = vehicle.mainImage 
    ? [vehicle.mainImage, ...(vehicle.images as string[] || [])] 
    : (vehicle.images as string[] || []);
  
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
            {/* Left Column - Gallery & Vehicle Details */}
            <div className="lg:col-span-7">
              {/* Image Gallery */}
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

              {/* Vehicle Details Tabs */}
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
                      value="features" 
                      className="px-4 py-3 text-gray-600 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 font-medium"
                    >
                      Equipaggiamenti
                    </TabsTrigger>
                    <TabsTrigger 
                      value="colors" 
                      className="px-4 py-3 text-gray-600 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 font-medium"
                    >
                      Colori
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
                  
                  <TabsContent value="features">
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(vehicle.features) && 
                        (vehicle.features as string[]).map((feature, index) => (
                          <div key={index} className="flex items-center bg-gray-50 rounded-full px-4 py-2">
                            <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="colors">
                    <div className="space-y-4">
                      <div className="flex justify-between p-3 rounded-lg bg-gray-50">
                        <span className="text-gray-600">Esterni</span>
                        <div className="flex items-center">
                          {vehicle.color && getColorHex(vehicle.color) ? (
                            <div 
                              className="w-6 h-6 rounded-full mr-2 border border-gray-300" 
                              style={{ backgroundColor: getColorHex(vehicle.color) || '#CCCCCC' }}
                            ></div>
                          ) : null}
                          <span className="font-medium">{vehicle.color || '-'}</span>
                        </div>
                      </div>
                      <div className="flex justify-between p-3 rounded-lg bg-gray-50">
                        <span className="text-gray-600">Interni</span>
                        <span className="font-medium">{vehicle.interiorColor || '-'}</span>
                      </div>
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
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              {/* Related Vehicles */}
              {relatedVehicles && relatedVehicles.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h2 className="text-2xl font-bold mb-6">Auto simili</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {relatedVehicles.map(relatedVehicle => (
                      <div 
                        key={relatedVehicle.id} 
                        className="bg-white rounded-lg shadow-sm overflow-hidden transition-transform hover:translate-y-[-5px] cursor-pointer"
                        onClick={() => navigate(`/vehicle/${relatedVehicle.id}`)}
                      >
                        {/* Image */}
                        <div className="relative h-44">
                          <img 
                            src={relatedVehicle.mainImage || "https://placehold.co/600x400?text=Immagine+non+disponibile"} 
                            alt={relatedVehicle.title} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            {relatedVehicle.badges && Array.isArray(relatedVehicle.badges) && (relatedVehicle.badges as string[]).map((badge, idx) => (
                              <span key={idx} className={`text-xs font-bold py-1 px-2 rounded uppercase ${
                                badge === 'nlt' ? 'bg-blue-500 text-white' : 
                                badge === 'rtb' ? 'bg-orange-500 text-white' : 
                                badge === 'promo' ? 'bg-red-500 text-white' : 
                                badge === 'new' ? 'bg-green-500 text-white' : 
                                'bg-gray-500 text-white'
                              }`}>
                                {badge === 'nlt' ? 'NLT' : 
                                badge === 'rtb' ? 'RTB' : 
                                badge === 'promo' ? 'PROMO' : 
                                badge === 'new' ? 'NUOVO' : 
                                badge.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {/* Details */}
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
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Column - Pricing and Options */}
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
                
                {/* Contract Type Selector */}
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
                
                {/* Contract Options */}
                {enhancedRentalOptions.length > 0 ? (
                  <div className="space-y-4">
                    {enhancedRentalOptions
                      .filter(option => option.type === activeContractType)
                      .sort((a, b) => {
                        // Prima le opzioni di 36 mesi (in genere raccomandate)
                        if (a.duration === 36 && b.duration !== 36) return -1;
                        if (a.duration !== 36 && b.duration === 36) return 1;
                        // Poi in ordine di durata
                        return a.duration - b.duration;
                      })
                      .map((option) => {
                        // Calcoliamo se mostrare o meno il badge "Consigliato"
                        const isRecommended = option.duration === 36;
                        const isRecommendedForKm = option.recommendedForKm === 20000;
                        const showRecommended = isRecommended || isRecommendedForKm;
                        
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
                            
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <span className="text-sm text-gray-500">Anticipo</span>
                                <p className="font-bold text-gray-900">€{option.deposit.toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500">Canone mensile</span>
                                <p className="font-bold text-gray-900">€{option.monthlyPrice.toLocaleString()}</p>
                              </div>
                              
                              {option.type === 'RTB' && option.finalPayment && (
                                <div>
                                  <span className="text-sm text-gray-500">Riscatto finale</span>
                                  <p className="font-bold text-gray-900">€{option.finalPayment.toLocaleString()}</p>
                                </div>
                              )}
                              
                              {option.annualMileage && (
                                <div>
                                  <span className="text-sm text-gray-500">Km/anno</span>
                                  <p className="font-bold text-gray-900">{option.annualMileage.toLocaleString()}</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Mostra i servizi inclusi se l'opzione è selezionata */}
                            {selectedRentalOption === option.id && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <h4 className="font-medium text-gray-700 mb-2">Inclusi nel canone:</h4>
                                <ul className="space-y-1">
                                  {option.includedServices.map((service, idx) => (
                                    <li key={idx} className="flex items-start text-sm">
                                      <Shield className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                                      <span>{service}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {showRecommended && (
                              <div className="w-full mt-2">
                                <span className="text-xs text-green-700 font-medium">
                                  {isRecommended ? "Offerta più scelta" : 
                                   isRecommendedForKm ? "Ideale per alti km" : 
                                   "Miglior rapporto qualità/prezzo"}
                                </span>
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
                
                {/* Request Information Button */}
                <div className="mt-6">
                  <Button 
                    onClick={handleRequestInfo}
                    className="w-full py-6 text-base bg-orange-500 hover:bg-orange-600"
                  >
                    Richiedi informazioni
                  </Button>
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