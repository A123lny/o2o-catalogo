import React, { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon, ChevronRight, MapPin, Calendar, Gauge, Zap, Fuel, BarChart2, Activity, Package2 } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import RequestForm from "@/components/request-form";
import VehicleCard from "@/components/vehicle-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Vehicle, RentalOption } from "@shared/schema";

// Estensione del tipo RentalOption per le opzioni raccomandate
interface EnhancedRentalOption extends RentalOption {
  recommendedForKm?: number;
  includedServices?: string[];
}

export default function VehicleDetailPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/vehicle/:id");
  const vehicleId = params?.id ? parseInt(params.id) : null;
  const [activeTab, setActiveTab] = useState("description");
  const [selectedRentalOption, setSelectedRentalOption] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
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

  const selectedOption = rentalOptions?.find(option => option.id === selectedRentalOption);
  const allImages = vehicle.mainImage 
    ? [vehicle.mainImage, ...(vehicle.images as string[] || [])] 
    : (vehicle.images as string[] || []);

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

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
                <div className="relative">
                  <img 
                    src={allImages[currentImageIndex] || "https://placehold.co/600x400?text=Immagine+non+disponibile"} 
                    alt={vehicle.title} 
                    className="w-full h-[400px] object-cover" 
                  />
                  <button 
                    onClick={() => openLightbox(currentImageIndex)}
                    className="absolute bottom-4 right-4 bg-white/80 hover:bg-white p-2 rounded-full shadow-md text-blue-500"
                    aria-label="Visualizza a schermo intero"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" />
                    </svg>
                  </button>
                  {allImages.length > 1 && (
                    <>
                      <button 
                        onClick={handlePrevImage}
                        className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md text-blue-500"
                        aria-label="Immagine precedente"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button 
                        onClick={handleNextImage}
                        className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md text-blue-500"
                        aria-label="Immagine successiva"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>

                {allImages.length > 0 && (
                  <div className="bg-gray-50 p-3 border-t border-gray-100">
                    <div className="flex space-x-2 overflow-x-auto">
                      {allImages.map((image, index) => (
                        <div 
                          key={index}
                          className={`flex-shrink-0 cursor-pointer transition-opacity ${
                            index === currentImageIndex ? 'ring-2 ring-blue-500 opacity-100' : 'opacity-60 hover:opacity-100'
                          }`}
                          onClick={() => setCurrentImageIndex(index)}
                          style={{ width: '80px', height: '60px' }}
                        >
                          <img 
                            src={image} 
                            alt={`${vehicle.title} - Vista ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
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
                      value="details" 
                      className="px-4 py-3 text-gray-600 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 font-medium"
                    >
                      Dettagli Tecnici
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="description" className="pt-2">
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed">{vehicle.description || 'Nessuna descrizione disponibile per questo veicolo.'}</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="features" className="pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {vehicle.features && (vehicle.features as string[]).length > 0 ? 
                        (vehicle.features as string[]).map((feature, index) => (
                          <div key={index} className="flex items-center bg-gray-50 rounded-full px-4 py-2">
                            <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                            <span className="text-gray-700 text-sm">{feature}</span>
                          </div>
                        )) : 
                        <p className="text-gray-500 italic">Nessun equipaggiamento specificato.</p>
                      }
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="details" className="pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex justify-between p-3 rounded-lg bg-gray-50">
                        <span className="text-gray-600">Marca</span>
                        <span className="font-medium">{vehicle.brandId || '-'}</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-lg bg-gray-50">
                        <span className="text-gray-600">Modello</span>
                        <span className="font-medium">{vehicle.model || '-'}</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-lg bg-gray-50">
                        <span className="text-gray-600">Anno</span>
                        <span className="font-medium">{vehicle.year || '-'}</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-lg bg-gray-50">
                        <span className="text-gray-600">Chilometraggio</span>
                        <span className="font-medium">{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : '-'}</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-lg bg-gray-50">
                        <span className="text-gray-600">Alimentazione</span>
                        <span className="font-medium">{vehicle.fuelType || '-'}</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-lg bg-gray-50">
                        <span className="text-gray-600">Potenza</span>
                        <span className="font-medium">{vehicle.power ? `${vehicle.power} CV / ${Math.round(vehicle.power * 0.735)} kW` : '-'}</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-lg bg-gray-50">
                        <span className="text-gray-600">Cambio</span>
                        <span className="font-medium">{vehicle.transmission || '-'}</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-lg bg-gray-50">
                        <span className="text-gray-600">Condizione</span>
                        <span className="font-medium">{vehicle.condition || '-'}</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-lg bg-gray-50">
                        <span className="text-gray-600">Colore</span>
                        <span className="font-medium">{vehicle.color || '-'}</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-lg bg-gray-50">
                        <span className="text-gray-600">Interni</span>
                        <span className="font-medium">{vehicle.interiorColor || '-'}</span>
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
                    <span key={index} className={`car-badge badge-${badge}`}>
                      {badge === 'promo' ? 'PROMO' : 
                      badge === 'new' ? 'NUOVO' : 
                      badge === 'nlt' ? 'NLT' : 
                      badge === 'rtb' ? 'RTB' : 
                      badge === '2life' ? '2LIFE' : 
                      badge.toUpperCase()}
                    </span>
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
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Le nostre Soluzioni</h3>
                    
                    {/* Filtro per tipo di contratto */}
                    <div className="flex border border-gray-200 rounded-lg mb-4 overflow-hidden">
                      <button 
                        className={`flex-1 py-2 px-3 text-sm font-medium text-center ${activeContractType === 'NLT' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        onClick={() => setActiveContractType('NLT')}
                      >
                        Noleggio (NLT)
                      </button>
                      <button 
                        className={`flex-1 py-2 px-3 text-sm font-medium text-center ${activeContractType === 'RTB' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        onClick={() => setActiveContractType('RTB')}
                      >
                        Rent to Buy
                      </button>
                    </div>
                    
                    <div className="space-y-4">
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
                        .map((enhancedOption) => {
                        const option = enhancedOption as EnhancedRentalOption;
                        const isRecommended = option.duration === 36 && option.type === 'NLT';
                        const isRecommendedRTB = option.duration === 36 && option.type === 'RTB';
                        const isRecommendedForKm = option.recommendedForKm === 20000;
                        const showRecommended = (isRecommended || isRecommendedRTB || isRecommendedForKm);
                          
                        return (
                          <div 
                            key={option.id}
                            className={`contract-card ${option.type === 'NLT' ? 'contract-nlt' : 'contract-rtb'} cursor-pointer ${selectedRentalOption === option.id ? 'ring-1 ring-offset-1 ring-blue-500' : ''} ${showRecommended ? 'border border-blue-200' : ''}`}
                            onClick={() => setSelectedRentalOption(option.id)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  <span className={`inline-block text-xs font-semibold text-white px-2 py-1 rounded ${option.type === 'NLT' ? 'bg-blue-500' : 'bg-orange-500'}`}>
                                    {option.type}
                                  </span>
                                  
                                  {showRecommended && (
                                    <span className="inline-block text-xs font-semibold text-white px-2 py-1 rounded bg-green-500">
                                      Consigliato
                                    </span>
                                  )}
                                  
                                  {option.recommendedForKm && (
                                    <span className="inline-block text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      {option.recommendedForKm.toLocaleString()} km/anno
                                    </span>
                                  )}
                                </div>
                                
                                <h4 className="text-lg font-bold">
                                  {option.type === 'NLT' ? 'Noleggio a Lungo Termine' : 'Rent to Buy'}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {option.duration} mesi {option.annualMileage ? `• ${option.annualMileage.toLocaleString()} km/anno` : ''}
                                </p>
                                <div className="mt-1 inline-block px-2 py-1 bg-gray-100 text-xs rounded text-gray-700">
                                  {clientType === 'privato' ? 'Prezzo per privati' : 'Prezzo per aziende'}
                                </div>
                              </div>
                              <div className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center ${selectedRentalOption === option.id ? 'border-blue-500' : 'border-gray-300'}`}>
                                {selectedRentalOption === option.id && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                              </div>
                            </div>
                            
                            {/* Servizi inclusi */}
                            {option.includedServices && option.includedServices.length > 0 && (
                              <div className="mt-3 p-2 bg-blue-50 rounded-md">
                                <h5 className="text-xs font-semibold text-blue-700 mb-1.5">Inclusi nel canone:</h5>
                                <div className="grid grid-cols-1 gap-1">
                                  {option.includedServices.map((service, idx) => (
                                    <div key={idx} className="flex items-center text-xs text-gray-700">
                                      <CheckIcon className="h-3.5 w-3.5 text-green-500 mr-1.5 flex-shrink-0" />
                                      <span>{service}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="mt-4 space-y-2">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Anticipo</span>
                                <span className="font-medium">
                                  € {clientType === 'privato' 
                                    ? option.deposit.toLocaleString() 
                                    : Math.round(option.deposit * 0.9).toLocaleString()}
                                </span>
                              </div>
                              
                              {option.finalPayment && (
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">Maxirata finale</span>
                                  <span className="font-medium">
                                    € {clientType === 'privato'
                                      ? option.finalPayment.toLocaleString()
                                      : Math.round(option.finalPayment * 0.9).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-gray-100">
                              <div className="flex flex-wrap items-baseline">
                                <span className={`text-2xl font-bold ${option.type === 'NLT' ? 'text-blue-600' : 'text-orange-500'}`}>
                                  € {clientType === 'privato'
                                    ? option.monthlyPrice.toLocaleString()
                                    : Math.round(option.monthlyPrice * 0.85).toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-500 ml-1">/mese</span>
                                
                                {clientType === 'privato' ? (
                                  <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                    IVA inclusa
                                  </span>
                                ) : (
                                  <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                    IVA deducibile
                                  </span>
                                )}
                                
                                {showRecommended && (
                                  <div className="w-full mt-1">
                                    <span className="text-xs text-green-700 font-medium">
                                      {isRecommended ? "Offerta più scelta dai nostri clienti" : 
                                       isRecommendedForKm ? "Ideale per chi percorre molti km" : 
                                       "Soluzione con il miglior rapporto durata/prezzo"}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {clientType === 'azienda' && (
                                <p className="text-xs text-gray-500 mt-1">* I prezzi sono da intendersi IVA esclusa</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}


              </div>


            </div>
          </div>


          
          {/* Veicoli Simili */}
          {relatedVehicles && relatedVehicles.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Veicoli Simili</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedVehicles.map(vehicle => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Lightbox per la galleria immagini */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" 
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative w-full max-w-4xl p-4">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handlePrevImage();
              }}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 p-2 rounded-full text-white z-10"
              aria-label="Immagine precedente"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <img 
              src={allImages[currentImageIndex]} 
              alt={`${vehicle.title} - Vista estesa ${currentImageIndex + 1}`}
              className="max-h-[80vh] max-w-full mx-auto object-contain"
            />
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleNextImage();
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 p-2 rounded-full text-white z-10"
              aria-label="Immagine successiva"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <div className="inline-block bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                {currentImageIndex + 1} / {allImages.length}
              </div>
            </div>
            
            <button 
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full text-white"
              aria-label="Chiudi galleria"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}