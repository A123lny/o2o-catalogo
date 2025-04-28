import React, { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon, ChevronRight, MapPin, Calendar, Gauge, Zap, Fuel, BarChart2, Activity, Package2 } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import VehicleGallery from "@/components/vehicle-gallery";
import VehicleCard from "@/components/vehicle-card";
import RequestForm from "@/components/request-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Vehicle, RentalOption } from "@shared/schema";

// Estensione del tipo RentalOption per le opzioni raccomandate
interface EnhancedRentalOption extends RentalOption {
  recommendedForKm?: number;
  includedServices?: string[];
}

// Funzione per convertire i nomi dei colori comuni in esadecimali
function getColorHex(colorName: string): string | null {
  const colorMap: Record<string, string> = {
    // Colori base
    'nero': '#000000',
    'bianco': '#FFFFFF',
    'grigio': '#808080',
    'argento': '#C0C0C0',
    'rosso': '#FF0000',
    'blu': '#0000FF',
    'verde': '#008000',
    'giallo': '#FFFF00',
    'arancione': '#FFA500',
    'marrone': '#8B4513',
    'beige': '#F5F5DC',
    'viola': '#800080',
    'azzurro': '#007FFF',
    
    // Varianti specifiche
    'grigio chiaro': '#D3D3D3',
    'grigio scuro': '#696969',
    'blu scuro': '#00008B',
    'blu navy': '#000080',
    'rosso scuro': '#8B0000',
    'verde scuro': '#006400',
    'verde chiaro': '#90EE90',
    'verde oliva': '#808000',
    'bordeaux': '#800000',
    'nero metallizzato': '#2C2C2C',
    'bianco perla': '#F5F5F5',
    
    // Interni
    'pelle nera': '#1A1A1A',
    'pelle beige': '#E8E6D9',
    'pelle marrone': '#704214',
    'pelle grigia': '#9E9E9E',
    'tessuto nero': '#222222',
    'tessuto grigio': '#777777',
    'alcantara': '#383838'
  };
  
  // Case insensitive search
  const lowerColorName = colorName.toLowerCase();
  
  // Cerca corrispondenza esatta
  if (colorMap[lowerColorName]) {
    return colorMap[lowerColorName];
  }
  
  // Cerca corrispondenza parziale
  for (const [key, value] of Object.entries(colorMap)) {
    if (lowerColorName.includes(key)) {
      return value;
    }
  }
  
  // Nessuna corrispondenza trovata
  return null;
}

export default function VehicleDetailPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/vehicle/:id");
  const vehicleId = params?.id ? parseInt(params.id) : null;
  const [activeTab, setActiveTab] = useState("description");
  const [selectedRentalOption, setSelectedRentalOption] = useState<number | null>(null);
  const [clientType, setClientType] = useState<'privato' | 'azienda'>('privato');
  const [activeContractType, setActiveContractType] = useState<'NLT' | 'RTB'>('NLT');

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

  // Aggiungi più opzioni di noleggio e RTB manualmente per la dimostrazione
  const enhancedRentalOptions = React.useMemo<EnhancedRentalOption[]>(() => {
    if (!rentalOptions || rentalOptions.length === 0) return [];
    
    // Prendiamo le opzioni originali di NLT e RTB
    const originalNlt = rentalOptions.find(o => o.type === 'NLT');
    const originalRtb = rentalOptions.find(o => o.type === 'RTB');
    
    const result = [...rentalOptions];
    
    // Se esiste un'opzione NLT, ne creiamo altre con durate diverse
    if (originalNlt) {
      // Aggiungiamo servizi inclusi all'opzione originale
      const updatedOriginalNlt = {
        ...originalNlt,
        includedServices: [
          "Manutenzione ordinaria e straordinaria",
          "Assicurazione RCA",
          "Copertura Kasko e Furto/Incendio",
          "Assistenza stradale 24/7",
          "Cambio pneumatici stagionali"
        ]
      };
      
      // Aggiorniamo il primo elemento corrispondente a originalNlt
      const index = result.findIndex(o => o.id === originalNlt.id);
      if (index !== -1) {
        result[index] = updatedOriginalNlt;
      }
      
      // Versione 24 mesi
      result.push({
        ...originalNlt,
        id: 100, // ID fittizio per la demo
        duration: 24,
        deposit: Math.round(originalNlt.deposit * 0.8),
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
        id: 101, // ID fittizio per la demo
        duration: 48,
        deposit: Math.round(originalNlt.deposit * 1.2),
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
    
    // Se esiste un'opzione RTB, ne creiamo altre con durate diverse
    if (originalRtb) {
      // Aggiungiamo servizi inclusi all'opzione originale
      const updatedOriginalRtb = {
        ...originalRtb,
        includedServices: [
          "Manutenzione ordinaria per i primi 12 mesi",
          "Garanzia estesa per la durata del contratto",
          "Prima revisione gratuita"
        ]
      };
      
      // Aggiorniamo il primo elemento corrispondente a originalRtb
      const index = result.findIndex(o => o.id === originalRtb.id);
      if (index !== -1) {
        result[index] = updatedOriginalRtb;
      }
      
      // Versione 24 mesi
      result.push({
        ...originalRtb,
        id: 102, // ID fittizio per la demo
        duration: 24,
        deposit: Math.round(originalRtb.deposit * 0.9),
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
        id: 103, // ID fittizio per la demo
        duration: 60,
        deposit: Math.round(originalRtb.deposit * 1.3),
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
    
    return result;
  }, [rentalOptions]);

  useEffect(() => {
    // Set the default rental option
    if (enhancedRentalOptions && enhancedRentalOptions.length > 0) {
      // Trovia l'opzione consigliata (quella a 36 mesi)
      const recommendedOption = enhancedRentalOptions.find(option => 
        option.duration === 36 && option.type === 'NLT'
      );
      setSelectedRentalOption(recommendedOption ? recommendedOption.id : enhancedRentalOptions[0].id);
    }
  }, [enhancedRentalOptions]);

  if (!vehicleId) {
    navigate("/");
    return null;
  }

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

  const selectedOption = enhancedRentalOptions?.find(option => option.id === selectedRentalOption);
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
            {/* Left Column - Gallery */}
            <div className="lg:col-span-7">
              <div className="image-gallery bg-white rounded-lg overflow-hidden shadow-sm mb-6">
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

              {/* Dettagli veicolo in tabs */}
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
            </div>

            {/* Right Column - Info & Opzioni */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                {/* Badge */}
                <div className="flex flex-wrap mb-2">
                  {vehicle.badges && (vehicle.badges as string[]).map((badge, index) => (
                    <div key={index} className={`text-xs font-bold py-1 px-2 mr-2 mb-2 rounded uppercase ${
                      badge === 'promo' ? 'bg-red-500 text-white' : 
                      badge === 'new' ? 'bg-green-500 text-white' : 
                      badge === 'nlt' ? 'bg-blue-500 text-white' : 
                      badge === 'rtb' ? 'bg-purple-500 text-white' : 
                      badge === '2life' ? 'bg-emerald-500 text-white' : 
                      'bg-gray-500 text-white'
                    }`}>
                      {badge === 'promo' ? 'PROMO' : 
                      badge === 'new' ? 'NUOVO' : 
                      badge === 'nlt' ? 'NLT' : 
                      badge === 'rtb' ? 'RTB' : 
                      badge === '2life' ? '2LIFE' : 
                      badge.toUpperCase()}
                    </div>
                  ))}
                </div>

                {/* Titolo */}
                <h1 className="text-2xl font-bold text-gray-800 mb-1">{vehicle.title}</h1>
                <p className="text-gray-600 mb-4">{vehicle.model}</p>
                
                {/* Prezzo */}
                <div className="mb-6">
                  {vehicle.discountPrice ? (
                    <div className="flex items-baseline gap-2">
                      <span className="line-through text-gray-500 text-lg">€ {vehicle.price.toLocaleString()}</span>
                      <span className="text-3xl font-bold text-blue-600">€ {vehicle.discountPrice.toLocaleString()}</span>
                    </div>
                  ) : (
                    <span className="text-3xl font-bold text-blue-600">€ {vehicle.price.toLocaleString()}</span>
                  )}
                </div>

                {/* Specifiche in pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <div className="flex items-center px-3 py-2 bg-gray-50 rounded-full text-sm">
                    <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                    <span>{vehicle.year}</span>
                  </div>
                  <div className="flex items-center px-3 py-2 bg-gray-50 rounded-full text-sm">
                    <Gauge className="h-4 w-4 text-blue-500 mr-2" />
                    <span>{vehicle.mileage.toLocaleString()} km</span>
                  </div>
                  <div className="flex items-center px-3 py-2 bg-gray-50 rounded-full text-sm">
                    <Fuel className="h-4 w-4 text-blue-500 mr-2" />
                    <span>{vehicle.fuelType}</span>
                  </div>
                  <div className="flex items-center px-3 py-2 bg-gray-50 rounded-full text-sm">
                    <Zap className="h-4 w-4 text-blue-500 mr-2" />
                    <span>{vehicle.power} CV</span>
                  </div>
                  <div className="flex items-center px-3 py-2 bg-gray-50 rounded-full text-sm">
                    <BarChart2 className="h-4 w-4 text-blue-500 mr-2" />
                    <span>{vehicle.transmission}</span>
                  </div>
                </div>

                {/* Switcher Privati/Aziende */}
                <div className="mb-6">
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden mb-3">
                    <button 
                      className={`flex-1 py-3 px-4 font-medium text-center transition-colors ${clientType === 'privato' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => setClientType('privato')}
                    >
                      Clienti Privati
                    </button>
                    <button 
                      className={`flex-1 py-3 px-4 font-medium text-center transition-colors ${clientType === 'azienda' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => setClientType('azienda')}
                    >
                      Aziende / P.IVA
                    </button>
                  </div>
                </div>
                
                {/* Opzioni di Noleggio */}
                {enhancedRentalOptions && enhancedRentalOptions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-800">Le nostre Soluzioni</h3>
                    
                    {/* Filtro per tipo di contratto */}
                    <div className="flex border border-gray-200 rounded-lg mb-3 overflow-hidden">
                      <button 
                        className={`flex-1 py-1.5 px-2 text-sm font-medium text-center ${activeContractType === 'NLT' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        onClick={() => setActiveContractType('NLT')}
                      >
                        Noleggio (NLT)
                      </button>
                      <button 
                        className={`flex-1 py-1.5 px-2 text-sm font-medium text-center ${activeContractType === 'RTB' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        onClick={() => setActiveContractType('RTB')}
                      >
                        Rent to Buy
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {enhancedRentalOptions
                        .filter(option => option.type === activeContractType)
                        .sort((a, b) => {
                          // Prima ordinamento per "consigliato"
                          const aRecommended = (a.duration === 36) || ((a as EnhancedRentalOption).recommendedForKm === 20000);
                          const bRecommended = (b.duration === 36) || ((b as EnhancedRentalOption).recommendedForKm === 20000);
                          
                          if (aRecommended && !bRecommended) return -1;
                          if (!aRecommended && bRecommended) return 1;
                          
                          // Poi per durata (crescente)
                          return a.duration - b.duration;
                        })
                        .map(option => {
                        const isRecommended = option.duration === 36 && option.type === 'NLT';
                        const isRecommendedRTB = option.duration === 36 && option.type === 'RTB';
                        const isRecommendedForKm = (option as EnhancedRentalOption).recommendedForKm === 20000;
                        const showRecommended = (isRecommended || isRecommendedRTB || isRecommendedForKm);
                          
                        return (
                          <div 
                            key={option.id}
                            className={`p-3 border rounded-lg cursor-pointer ${
                              option.type === 'NLT' 
                              ? 'border-blue-200 bg-blue-50/50' 
                              : 'border-orange-200 bg-orange-50/50'
                            } ${selectedRentalOption === option.id ? 'ring-1 ring-offset-1 ring-blue-500' : ''}`}
                            onClick={() => setSelectedRentalOption(option.id)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex flex-wrap gap-1.5 mb-1.5">
                                  <span className={`inline-block text-xs font-medium text-white px-1.5 py-0.5 rounded ${option.type === 'NLT' ? 'bg-blue-500' : 'bg-orange-500'}`}>
                                    {option.type}
                                  </span>
                                  
                                  {showRecommended && (
                                    <span className="inline-block text-xs font-medium text-white px-1.5 py-0.5 rounded bg-green-500">
                                      Consigliato
                                    </span>
                                  )}
                                  
                                  {(option as EnhancedRentalOption).recommendedForKm && (
                                    <span className="inline-block text-xs font-medium bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-sm">
                                      {(option as EnhancedRentalOption).recommendedForKm?.toLocaleString()} km/anno
                                    </span>
                                  )}
                                </div>
                                
                                <h4 className="text-base font-bold">
                                  {option.type === 'NLT' ? 'Noleggio' : 'Rent to Buy'} {option.duration} mesi
                                </h4>
                                <p className="text-xs text-gray-600">
                                  {option.annualMileage ? `${option.annualMileage.toLocaleString()} km/anno` : ''} 
                                  <span className="text-xs text-gray-500 ml-1">{clientType === 'privato' ? 'Prezzo IVA incl.' : 'Prezzo IVA escl.'}</span>
                                </p>
                              </div>
                              <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${selectedRentalOption === option.id ? 'border-blue-500' : 'border-gray-300'}`}>
                                {selectedRentalOption === option.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>}
                              </div>
                            </div>
                            
                            {/* Servizi inclusi */}
                            {(option as EnhancedRentalOption).includedServices && (option as EnhancedRentalOption).includedServices?.length > 0 && (
                              <div className="mt-3 p-2 bg-blue-50 rounded-md">
                                <h5 className="text-xs font-semibold text-blue-700 mb-1.5">Inclusi nel canone:</h5>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                  {(option as EnhancedRentalOption).includedServices?.map((service, idx) => (
                                    <div key={idx} className="flex items-center text-xs text-gray-700">
                                      <CheckIcon className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                                      <span className="text-xs">{service}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="mt-3 space-y-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-600">Anticipo</span>
                                <span className="font-medium">
                                  € {clientType === 'privato' 
                                    ? option.deposit.toLocaleString() 
                                    : Math.round(option.deposit * 0.9).toLocaleString()}
                                </span>
                              </div>
                              
                              {option.finalPayment && (
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-600">Maxirata finale</span>
                                  <span className="font-medium">
                                    € {clientType === 'privato'
                                      ? option.finalPayment.toLocaleString()
                                      : Math.round(option.finalPayment * 0.9).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-3 pt-2 border-t border-gray-100">
                              <div className="flex flex-wrap items-baseline">
                                <span className={`text-xl font-bold ${option.type === 'NLT' ? 'text-blue-600' : 'text-orange-500'}`}>
                                  € {clientType === 'privato'
                                    ? option.monthlyPrice.toLocaleString()
                                    : Math.round(option.monthlyPrice * 0.85).toLocaleString()}
                                </span>
                                <span className="text-xs text-gray-500 ml-1">/mese</span>
                                
                                {clientType === 'privato' ? (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                    IVA incl.
                                  </span>
                                ) : (
                                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                                    IVA ded.
                                  </span>
                                )}
                                
                                {showRecommended && (
                                  <div className="w-full mt-1">
                                    <span className="text-xs text-green-700 font-medium">
                                      {isRecommended ? "Offerta più scelta" : 
                                       isRecommendedForKm ? "Ideale per alti km" : 
                                       "Miglior rapporto qualità/prezzo"}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {clientType === 'azienda' && (
                                <p className="text-xs text-gray-500 mt-1">* Prezzi IVA esclusa</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Pulsante "Richiedi informazioni" */}
                    <div className="mt-6">
                      <button 
                        className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                        onClick={() => {
                          // Per ora mostriamo solo un messaggio
                          alert(`Richiesta informazioni per ${vehicle.title}`);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Richiedi informazioni
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Sezione contatti - senza Auto simili */}
          <div className="mt-12 pt-10 border-t border-gray-200">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">Hai delle domande?</h2>
              <p className="text-gray-600 mb-6">
                Contattaci per ricevere maggiori informazioni su questo veicolo o sulle opzioni di noleggio e finanziamento disponibili.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Telefono</h3>
                    <p className="text-gray-600">+39 02 1234 5678</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Email</h3>
                    <p className="text-gray-600">info@o2omobility.it</p>
                  </div>
                </div>
              </div>
              
              <button 
                className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                onClick={() => {
                  // Apri un form di richiesta informazioni
                  alert(`Richiesta informazioni per ${vehicle.title}`);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Richiedi informazioni
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}