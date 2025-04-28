import React, { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MailCheck, ChevronLeft, Phone, User, MapPin, Car, Calendar, Gauge, Zap, Fuel, Check, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insertRequestSchema, Vehicle, RentalOption } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Schema per il form di richiesta informazioni
const requestFormSchema = z.object({
  vehicleId: z.number(),
  fullName: z.string().min(3, "Inserisci il tuo nome completo"),
  email: z.string().email("Inserisci un'email valida"),
  phone: z.string().min(6, "Inserisci un numero di telefono valido"),
  province: z.string().min(2, "Seleziona una provincia"),
  isCompany: z.boolean().default(false),
  companyName: z.string().optional().refine((val) => {
    if (val === undefined) return true;
    return val.length > 0;
  }, {
    message: "Inserisci la ragione sociale dell'azienda"
  }),
  vatNumber: z.string().optional().refine((val) => {
    if (val === undefined) return true;
    return val.length > 0;
  }, {
    message: "Inserisci la P.IVA"
  }),
  interestType: z.string(),
  message: z.string().optional(),
  privacyConsent: z.boolean().refine(val => val === true, {
    message: "Devi accettare la privacy policy per continuare"
  }),
  termsConsent: z.boolean().refine(val => val === true, {
    message: "Devi accettare i termini e condizioni per continuare"
  })
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

// Lista province italiane
const provinces = [
  "Agrigento", "Alessandria", "Ancona", "Aosta", "Arezzo", "Ascoli Piceno", "Asti", "Avellino", "Bari", "Barletta-Andria-Trani", 
  "Belluno", "Benevento", "Bergamo", "Biella", "Bologna", "Bolzano", "Brescia", "Brindisi", "Cagliari", "Caltanissetta", 
  "Campobasso", "Caserta", "Catania", "Catanzaro", "Chieti", "Como", "Cosenza", "Cremona", "Crotone", "Cuneo", "Enna", 
  "Fermo", "Ferrara", "Firenze", "Foggia", "Forlì-Cesena", "Frosinone", "Genova", "Gorizia", "Grosseto", "Imperia", "Isernia", 
  "La Spezia", "L'Aquila", "Latina", "Lecce", "Lecco", "Livorno", "Lodi", "Lucca", "Macerata", "Mantova", "Massa-Carrara", 
  "Matera", "Messina", "Milano", "Modena", "Monza e Brianza", "Napoli", "Novara", "Nuoro", "Oristano", "Padova", "Palermo", 
  "Parma", "Pavia", "Perugia", "Pesaro e Urbino", "Pescara", "Piacenza", "Pisa", "Pistoia", "Pordenone", "Potenza", "Prato", 
  "Ragusa", "Ravenna", "Reggio Calabria", "Reggio Emilia", "Rieti", "Rimini", "Roma", "Rovigo", "Salerno", "Sassari", "Savona", 
  "Siena", "Siracusa", "Sondrio", "Sud Sardegna", "Taranto", "Teramo", "Terni", "Torino", "Trapani", "Trento", "Treviso", 
  "Trieste", "Udine", "Varese", "Venezia", "Verbano-Cusio-Ossola", "Vercelli", "Verona", "Vibo Valentia", "Vicenza", "Viterbo"
];

export default function RequestInfoPage() {
  const [, params] = useRoute("/request-info/:vehicleId/:rentalOptionId");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Recupera i parametri dell'URL
  const vehicleId = params ? parseInt(params.vehicleId) : 0;
  const rentalOptionId = params && params.rentalOptionId ? parseInt(params.rentalOptionId) : undefined;
  
  console.log("URL Params:", { vehicleId, rentalOptionId });
  
  // Query per recuperare il veicolo
  const { data: vehicle, isLoading: isLoadingVehicle } = useQuery({
    queryKey: [`/api/vehicles/${vehicleId}`],
    queryFn: () => apiRequest("GET", `/api/vehicles/${vehicleId}`).then(res => res.json()),
    enabled: vehicleId > 0,
  });
  
  // Query per recuperare le opzioni di noleggio
  const { data: rentalOptions, isLoading: isLoadingOptions } = useQuery({
    queryKey: [`/api/vehicles/${vehicleId}/rental-options`],
    queryFn: () => apiRequest("GET", `/api/vehicles/${vehicleId}/rental-options`).then(res => res.json()),
    enabled: vehicleId > 0,
  });
  
  // Determina l'opzione di noleggio selezionata
  const [selectedOption, setSelectedOption] = useState<RentalOption | null>(null);
  
  // Quando i dati sono disponibili, trova l'opzione corrispondente all'ID
  useEffect(() => {
    if (rentalOptions && rentalOptionId) {
      // Cerca l'opzione normale nel database
      let option = rentalOptions.find((o: RentalOption) => o.id === rentalOptionId);
      
      // Gestisci il caso di ID fittizi generati dalla pagina di dettaglio
      if (!option && rentalOptionId) {
        const baseId = rentalOptionId < 1000 ? rentalOptionId : rentalOptionId % 1000;
        const isNLT = rentalOptionId >= 1000 && rentalOptionId < 3000;
        const isRTB = rentalOptionId >= 3000;
        
        console.log(`Cercando opzione per baseId: ${baseId}, isNLT: ${isNLT}, isRTB: ${isRTB}`);
        
        // Prima cerchiamo per ID base
        let optionByBaseId = rentalOptions.find((o: RentalOption) => o.id === baseId);
        
        // Se non troviamo l'ID base, cerchiamo per tipo
        if (!optionByBaseId) {
          if (isNLT) {
            optionByBaseId = rentalOptions.find((o: RentalOption) => o.type === 'NLT');
          } else if (isRTB) {
            optionByBaseId = rentalOptions.find((o: RentalOption) => o.type === 'RTB');
          }
        }
        
        // Se abbiamo trovato un'opzione, utilizziamola
        if (optionByBaseId) {
          option = optionByBaseId;
          console.log("Trovata opzione alternativa:", option);
        }
      }
      
      if (option) {
        console.log("Opzione selezionata:", option);
        setSelectedOption(option);
      } else {
        console.log("Nessuna opzione trovata per ID:", rentalOptionId);
      }
    }
  }, [rentalOptions, rentalOptionId]);
  
  // Determiniamo se il cliente è un'azienda in base alla categoria del veicolo (categoria 2 = business)
  const isCompany = vehicle?.categoryId === 2;
  
  // Formatta il testo dell'opzione selezionata
  const selectedOptionText = selectedOption
    ? `${selectedOption.type === 'NLT' ? 'Noleggio a Lungo Termine' : 'Rent to Buy'} - ${selectedOption.duration} mesi`
    : '';
  
  // Setup del form con i valori predefiniti
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      vehicleId: vehicleId,
      fullName: "",
      email: "",
      phone: "",
      province: "",
      isCompany: isCompany,
      companyName: "",
      vatNumber: "",
      interestType: selectedOptionText,
      message: "",
      privacyConsent: false,
      termsConsent: false
    }
  });
  
  // Aggiorna il campo del tipo di interesse quando cambia l'opzione selezionata
  useEffect(() => {
    if (selectedOption && form) {
      form.setValue('interestType', selectedOptionText);
    }
  }, [selectedOption, selectedOptionText, form]);
  
  // Mutation per inviare la richiesta
  const requestMutation = useMutation({
    mutationFn: async (data: RequestFormValues) => {
      const toSubmit = {
        ...data,
        status: "pending",
      };
      console.log("Invio richiesta:", toSubmit);
      const res = await apiRequest("POST", "/api/requests", toSubmit);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Richiesta inviata con successo",
        description: "Ti contatteremo al più presto per discutere la tua soluzione di noleggio.",
      });
      // Dopo l'invio con successo, torna alla home page
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Errore durante l'invio della richiesta",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Gestisce l'invio del form
  function onSubmit(data: RequestFormValues) {
    requestMutation.mutate(data);
  }
  
  // Mostra il loader mentre si caricano i dati
  if (isLoadingVehicle || isLoadingOptions) {
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
  
  // Se il veicolo non esiste, reindirizza alla home
  if (!vehicle) {
    navigate("/");
    return null;
  }
  
  // Formatta i dettagli del veicolo
  const vehicleDetails = {
    title: vehicle.title,
    year: vehicle.year,
    fuelType: vehicle.fuelType,
    mileage: vehicle.mileage.toLocaleString(),
    price: vehicle.price.toLocaleString(),
    discountPrice: vehicle.discountPrice ? vehicle.discountPrice.toLocaleString() : null,
    image: vehicle.mainImage || (Array.isArray(vehicle.images) && vehicle.images.length > 0 ? vehicle.images[0] : null),
    color: vehicle.color
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb e torna indietro */}
          <div className="mb-6">
            <button
              onClick={() => navigate(`/vehicle/${vehicleId}`)}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Torna al veicolo
            </button>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Richiedi Informazioni</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form di contatto - Colonna sinistra */}
            <div className="lg:col-span-7 bg-white rounded-lg shadow-sm p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <h2 className="text-xl font-bold mb-4">I tuoi dati</h2>
                  
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome e Cognome</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="Mario Rossi" {...field} className="pl-10" />
                            <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input type="email" placeholder="mario.rossi@example.com" {...field} className="pl-10" />
                              <MailCheck className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefono</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input type="tel" placeholder="+39 123 456 7890" {...field} className="pl-10" />
                              <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="province"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provincia</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleziona una provincia" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {provinces.map((province) => (
                              <SelectItem key={province} value={province}>{province}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Campi aggiuntivi se cliente è un'azienda */}
                  {isCompany && (
                    <div className="space-y-5">
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ragione Sociale</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input placeholder="Denominazione Azienda" {...field} className="pl-10" />
                                <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="vatNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Partita IVA</FormLabel>
                            <FormControl>
                              <Input placeholder="IT01234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  {/* Campo per la soluzione di interesse */}
                  <FormField
                    control={form.control}
                    name="interestType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Soluzione di interesse</FormLabel>
                        {selectedOption ? (
                          <FormControl>
                            <div className="flex items-center px-4 py-2 rounded bg-gray-100 border border-gray-200 text-gray-700">
                              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                                selectedOption.type === 'NLT' ? 'bg-blue-500' : 'bg-orange-500'
                              }`}></span>
                              <div className="flex items-center w-full">
                                <input
                                  type="text"
                                  className="bg-transparent w-full focus:outline-none text-gray-700 disabled:cursor-not-allowed"
                                  value={field.value}
                                  disabled
                                  readOnly
                                />
                              </div>
                            </div>
                          </FormControl>
                        ) : (
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleziona il tipo di contratto" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="NLT">Noleggio a Lungo Termine (NLT)</SelectItem>
                              <SelectItem value="RTB">Rent to Buy (RTB)</SelectItem>
                              <SelectItem value="BOTH">Entrambe le soluzioni</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Campo messagio */}
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Messaggio (opzionale)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Scrivi qui eventuali domande o richieste specifiche..." 
                            {...field} 
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Consensi privacy e termini */}
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="privacyConsent"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange} 
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal">
                              Acconsento al trattamento dei miei dati personali in accordo con la <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="termsConsent"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange} 
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal">
                              Accetto i <a href="#" className="text-blue-600 hover:underline">Termini e Condizioni</a> del servizio
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Pulsante di invio */}
                  <Button 
                    type="submit" 
                    className="w-full py-6 text-base bg-orange-500 hover:bg-orange-600"
                    disabled={requestMutation.isPending}
                  >
                    {requestMutation.isPending ? (
                      <span className="flex items-center">
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Invio in corso...
                      </span>
                    ) : "Invia richiesta"}
                  </Button>
                </form>
              </Form>
            </div>
            
            {/* Dettagli veicolo e contratto - Colonna destra */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                <h2 className="text-xl font-bold mb-4">Dettagli del Veicolo</h2>
                
                {/* Dettagli veicolo */}
                <div className="mb-6">
                  {vehicleDetails.image && (
                    <div className="mb-4 h-48 overflow-hidden rounded-lg">
                      <img 
                        src={vehicleDetails.image} 
                        alt={vehicleDetails.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{vehicleDetails.title}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-600">{vehicleDetails.year}</span>
                    </div>
                    <div className="flex items-center">
                      <Fuel className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-600">{vehicleDetails.fuelType}</span>
                    </div>
                    <div className="flex items-center">
                      <Gauge className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-600">{vehicleDetails.mileage} km</span>
                    </div>
                    <div className="flex items-center">
                      <Car className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-600">{vehicleDetails.color}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    {vehicleDetails.discountPrice ? (
                      <div className="flex items-center">
                        <span className="line-through text-gray-400">€{vehicleDetails.price}</span>
                        <span className="text-lg font-bold text-blue-600 ml-2">€{vehicleDetails.discountPrice}</span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-blue-600">€{vehicleDetails.price}</span>
                    )}
                  </div>
                </div>
                
                <hr className="my-6 border-gray-200" />
                
                {/* Dettagli soluzione selezionata */}
                {selectedOption && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Dettagli Soluzione</h2>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center mb-3">
                        <span className={`inline-block w-4 h-4 rounded-full mr-2 ${
                          selectedOption.type === 'NLT' ? 'bg-blue-500' : 'bg-orange-500'
                        }`}></span>
                        <span className="font-medium text-gray-800">
                          {selectedOption.type === 'NLT' ? 'Noleggio a Lungo Termine' : 'Rent to Buy'}
                        </span>
                        <span className="text-sm bg-gray-200 px-2 py-0.5 rounded ml-auto">
                          {selectedOption.duration} mesi
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-sm text-gray-500">Anticipo</span>
                          <p className="font-bold text-gray-900">€{selectedOption.deposit.toLocaleString()}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {isCompany ? 'IVA esclusa' : 'IVA inclusa'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Canone mensile</span>
                          <p className="font-bold text-gray-900">€{selectedOption.monthlyPrice.toLocaleString()}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {isCompany ? 'IVA esclusa' : 'IVA inclusa'}
                          </p>
                        </div>
                        
                        {/* Mostra il deposito cauzionale (se presente) */}
                        {selectedOption.caution && (
                          <div>
                            <span className="text-sm text-gray-500">Deposito cauzionale</span>
                            <p className="font-bold text-gray-900">€{selectedOption.caution.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {isCompany ? 'IVA esclusa' : 'IVA inclusa'}
                            </p>
                          </div>
                        )}
                        
                        {/* Mostra le spese di istruttoria (se presente) */}
                        {selectedOption.setupFee && (
                          <div>
                            <span className="text-sm text-gray-500">Spese di istruttoria</span>
                            <p className="font-bold text-gray-900">€{selectedOption.setupFee.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {isCompany ? 'IVA esclusa' : 'IVA inclusa'}
                            </p>
                          </div>
                        )}
                        
                        {/* Mostra il riscatto finale (solo per RTB) */}
                        {selectedOption.type === 'RTB' && selectedOption.finalPayment && (
                          <div>
                            <span className="text-sm text-gray-500">Riscatto finale</span>
                            <p className="font-bold text-gray-900">€{selectedOption.finalPayment.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {isCompany ? 'IVA esclusa' : 'IVA inclusa'}
                            </p>
                          </div>
                        )}
                        
                        {/* Mostra il chilometraggio annuo (se presente) */}
                        {selectedOption.annualMileage && (
                          <div>
                            <span className="text-sm text-gray-500">Km/anno</span>
                            <p className="font-bold text-gray-900">{selectedOption.annualMileage.toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Lista dei servizi inclusi (se presenti) */}
                      {selectedOption.includedServices && Array.isArray(selectedOption.includedServices) && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Servizi inclusi:</h4>
                          <ul className="space-y-1">
                            {(selectedOption.includedServices as string[]).map((service, index) => (
                              <li key={index} className="flex items-start text-sm">
                                <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-600">{service}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    {/* Informazioni aggiuntive */}
                    <div className="text-sm text-gray-500">
                      <p className="mb-2">
                        Tutti i prezzi sono da intendersi {isCompany ? 'IVA esclusa' : 'IVA inclusa'}.
                      </p>
                      <p>
                        Inviando questa richiesta, il nostro team ti contatterà per fornirti tutti i dettagli sulla soluzione selezionata e personalizzare l'offerta in base alle tue esigenze.
                      </p>
                    </div>
                  </div>
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