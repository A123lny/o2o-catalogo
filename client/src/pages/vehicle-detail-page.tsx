import React, { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Vehicle, RentalOption } from "@shared/schema";
import Header from "@/components/header";
import Footer from "@/components/footer";
import VehicleGallery from "@/components/vehicle-gallery";
import VehicleCard from "@/components/vehicle-card";
import PageTitle from "@/components/page-title";
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
    queryKey: [`/api/vehicles/${vehicleId}`],
    enabled: vehicleId > 0
  });
  
  // Verifica se il veicolo è assegnato
  const isVehicleAssigned = vehicle && 
    vehicle.badges && 
    (Array.isArray(vehicle.badges) ? 
      vehicle.badges.includes("Assegnato") : 
      JSON.parse(vehicle.badges as string).includes("Assegnato"));
  
  // Fetch opzioni noleggio
  const { data: rentalOptions, isLoading: isLoadingRentalOptions } = useQuery<RentalOption[]>({
    queryKey: [`/api/vehicles/${vehicleId}/rental-options`],
    enabled: vehicleId > 0 && !isVehicleAssigned
  });
  
  // Fetch veicoli correlati
  const { data: relatedVehicles, isLoading: isLoadingRelated } = useQuery<Vehicle[]>({
    queryKey: [`/api/vehicles/${vehicleId}/related`],
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
            : 0,
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
      // Opzioni NLT base con valore di riferimento
      const basePrice = 30000;
      
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
      // Verifica se esistono opzioni del tipo attivo
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
      } else {
        // Se non ci sono opzioni per il tipo selezionato, cambia automaticamente al tipo disponibile
        const alternativeType = activeContractType === 'NLT' ? 'RTB' : 'NLT';
        const alternativeOptions = enhancedRentalOptions.filter(option => option.type === alternativeType);
        
        if (alternativeOptions.length > 0) {
          setActiveContractType(alternativeType);
          // L'opzione verrà selezionata quando l'effetto verrà richiamato con il nuovo tipo di contratto
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
      // Passa anche il tipo di cliente (privato o azienda) come parametro URL
      navigate(`/request-info/${vehicleId}/${selectedRentalOption}?clientType=${clientType}`);
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
  
  // Prepara le immagini per la galleria e correggi i percorsi
  const fixImagePath = (imagePath: string) => {
    if (!imagePath) return "";
    if (imagePath.startsWith('http')) return imagePath;
    return imagePath.startsWith('/uploads/') ? imagePath : `/uploads/${imagePath}`;
  };
  
  const vehicleMainImage = vehicle.mainImage ? fixImagePath(vehicle.mainImage) : "";
  const vehicleImages = Array.isArray(vehicle.images) 
    ? vehicle.images.map(img => typeof img === 'string' ? fixImagePath(img) : "") 
    : [];
  
  const allImages = vehicleMainImage 
    ? [vehicleMainImage, ...vehicleImages.filter(img => img !== "" && img !== vehicleMainImage)] 
    : vehicleImages.filter(img => img !== "");
  
  // Filtra le opzioni per il tipo corrente
  const filteredOptions = enhancedRentalOptions.filter(option => option.type === activeContractType);
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageTitle title={vehicle.title} />
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
          
          {/* Messaggio se il veicolo è assegnato */}
          {isVehicleAssigned && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6 mb-8">
              <div className="flex flex-col items-center text-center">
                <div className="bg-red-100 p-3 rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Veicolo non disponibile</h2>
                <p className="text-lg mb-4">Questo veicolo è stato assegnato e non è più disponibile per il noleggio.</p>
                <div className="flex space-x-4">
                  <Button onClick={() => navigate("/catalog")} className="bg-red-600 hover:bg-red-700">
                    Torna al catalogo
                  </Button>
                  <Button onClick={() => navigate("/")} variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
                    Vai alla home
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Colonna sinistra - Galleria e dettagli veicolo */}
            <div className="lg:col-span-7">
              {/* Galleria immagini */}
              <div className="bg-white rounded-lg overflow-hidden shadow-sm mb-6">
                <VehicleGallery 
                  mainImage={vehicleMainImage} 
                  images={vehicleImages} 
                  title={vehicle.title}
                />
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
              
              {/* Veicoli correlati - visualizzati solo su desktop e tablet */}
              {relatedVehicles && relatedVehicles.length > 0 && (
                <div className="mt-8 hidden sm:block">
                  <h2 className="text-2xl font-bold mb-6">Auto simili</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {relatedVehicles.slice(0, 3).map(relatedVehicle => (
                      <VehicleCard key={relatedVehicle.id} vehicle={relatedVehicle} />
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
                
                {/* Mostro il resto della sezione solo se il veicolo non è assegnato */}
                {!isVehicleAssigned && (
                  <>
                    {/* Il blocco dei prezzi di vendita è stato rimosso, dato che mostriamo solo le opzioni di noleggio */}
                    <div className="mb-6">
                      {enhancedRentalOptions.length > 0 && (
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-blue-600">
                            A partire da €{Math.min(...enhancedRentalOptions.map(o => o.monthlyPrice))}/mese
                          </span>
                        </div>
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
                
                    {/* Selettore tipo contratto - mostra solo i tipi di contratto disponibili */}
                    {enhancedRentalOptions.length > 0 && (
                      <div className="flex space-x-4 mb-6">
                        {/* Verifica se esistono opzioni NLT */}
                        {enhancedRentalOptions.some(option => option.type === 'NLT') && (
                          <Button
                            variant={activeContractType === 'NLT' ? "default" : "outline"}
                            className={`flex-1 ${activeContractType === 'NLT' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                            onClick={() => handleContractTypeChange('NLT')}
                          >
                            Noleggio a Lungo Termine
                          </Button>
                        )}
                        
                        {/* Verifica se esistono opzioni RTB */}
                        {enhancedRentalOptions.some(option => option.type === 'RTB') && (
                          <Button
                            variant={activeContractType === 'RTB' ? "default" : "outline"}
                            className={`flex-1 ${activeContractType === 'RTB' ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                            onClick={() => handleContractTypeChange('RTB')}
                          >
                            Rent to Buy
                          </Button>
                        )}
                      </div>
                    )}
                
                    {/* Opzioni contratto */}
                    {filteredOptions.length > 0 ? (
                      <div className="space-y-6">
                        {filteredOptions
                          // Mette 36 mesi all'inizio, poi ordina il resto per durata
                          .sort((a, b) => {
                            if (a.duration === 36) return -1;
                            if (b.duration === 36) return 1;
                            return a.duration - b.duration;
                          })
                          .map((option) => {
                        // Determina se questa è l'opzione consigliata
                        const isRecommended = option.duration === 36;
                        
                        // Calcola i prezzi con/senza IVA (assumendo che i prezzi nel DB sono senza IVA)
                        const vatMultiplier = 1.22; // IVA al 22%
                        const monthlyPrice = clientType === 'private' 
                          ? Math.round(option.monthlyPrice * vatMultiplier) 
                          : option.monthlyPrice;
                        const deposit = clientType === 'private'
                          ? Math.round(option.deposit * vatMultiplier)
                          : option.deposit;
                        
                        // Nome dell'opzione (es. Smart 24)
                        const optionName = `${option.type === 'NLT' ? 'Smart' : 'Flex'} ${option.duration}`;
                        
                        return (
                          <div 
                            key={option.id}
                            className={`border rounded-xl overflow-hidden transition-all ${
                              selectedRentalOption === option.id 
                                ? `border-2 ${option.type === 'NLT' ? 'border-blue-500' : 'border-orange-500'}` 
                                : 'border-gray-200'
                            }`}
                          >
                            {/* Header con bordo colorato - l'intero div è cliccabile */}
                            <div 
                              className="relative cursor-pointer"
                              style={{ 
                                borderLeft: `4px solid ${option.type === 'NLT' ? '#3b82f6' : '#f97316'}`
                              }}
                              onClick={() => setSelectedRentalOption(option.id)}
                            >
                              {/* Badge "Popolare" o "Consigliato" */}
                              {isRecommended && (
                                <div className="absolute right-3 top-3">
                                  <span className="inline-block text-xs font-medium bg-blue-500 text-white px-3 py-1 rounded-full">
                                    Popolare
                                  </span>
                                </div>
                              )}
                              
                              <div className="p-4">
                                <div className="flex items-center mb-2">
                                  {/* Radio button per la selezione */}
                                  <div 
                                    className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                                      selectedRentalOption === option.id 
                                        ? option.type === 'NLT' ? 'border-blue-500' : 'border-orange-500' 
                                        : 'border-gray-300'
                                    }`}
                                  >
                                    {selectedRentalOption === option.id && (
                                      <div className={`w-3 h-3 rounded-full ${
                                        option.type === 'NLT' ? 'bg-blue-500' : 'bg-orange-500'
                                      }`}></div>
                                    )}
                                  </div>
                                  
                                  {/* Nome dell'opzione */}
                                  <h3 className="text-xl font-bold text-gray-800">{optionName}</h3>
                                </div>
                                
                                {/* Prezzo mensile in evidenza */}
                                <div className="mt-3">
                                  <div className="flex items-baseline">
                                    <span className="text-3xl font-bold text-blue-600">€{monthlyPrice}</span>
                                    <span className="text-gray-500 ml-1">/mese {clientType === 'private' ? '(IVA incl.)' : '(IVA escl.)'}</span>
                                  </div>
                                </div>
                                
                                {/* Dettagli veloci */}
                                <div className="flex flex-wrap mt-4 text-gray-600 text-sm">
                                  <div className="flex items-center mr-6 mb-2">
                                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                    <span>Durata: {option.duration} mesi</span>
                                  </div>
                                  
                                  {option.annualMileage && (
                                    <div className="flex items-center mb-2">
                                      <Gauge className="h-4 w-4 mr-2 text-gray-500" />
                                      <span>{option.annualMileage.toLocaleString()} km/anno</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Anticipo */}
                                <div className="mt-3 text-gray-600 text-sm">
                                  <span className="inline-block mr-1">€</span>
                                  <span>Anticipo: {deposit.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Dettagli servizi inclusi */}
                            {selectedRentalOption === option.id && (
                              <div className="border-t border-gray-200 p-4 bg-gray-50">
                                <h4 className="font-medium text-gray-700 mb-2">Inclusi nel canone:</h4>
                                {Array.isArray(option.includedServices) && option.includedServices.length > 0 ? (
                                  <p className="text-sm text-gray-600">
                                    {option.includedServices.join(', ')}
                                  </p>
                                ) : (
                                  <p className="text-sm text-gray-500 italic">Informazioni non disponibili</p>
                                )}
                                
                                {/* Altri dettagli */}
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                  {option.caution !== null && option.caution !== undefined && (
                                    <div>
                                      <span className="text-xs text-gray-500 block">Deposito cauzionale</span>
                                      <p className="text-sm font-medium">
                                        €{(clientType === 'private' 
                                           ? Math.round(option.caution * vatMultiplier) 
                                           : option.caution).toLocaleString()}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {option.setupFee !== null && option.setupFee !== undefined && (
                                    <div>
                                      <span className="text-xs text-gray-500 block">Spese istruttoria</span>
                                      <p className="text-sm font-medium">
                                        €{(clientType === 'private' 
                                           ? Math.round(option.setupFee * vatMultiplier) 
                                           : option.setupFee).toLocaleString()}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {option.type === 'RTB' && option.finalPayment && (
                                    <div>
                                      <span className="text-xs text-gray-500 block">Riscatto finale</span>
                                      <p className="text-sm font-medium">
                                        €{(clientType === 'private' 
                                           ? Math.round(option.finalPayment * vatMultiplier) 
                                           : option.finalPayment).toLocaleString()}
                                      </p>
                                    </div>
                                  )}
                                </div>
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
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}