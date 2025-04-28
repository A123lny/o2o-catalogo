import React, { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
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
import { MailCheck, ChevronLeft, Phone, User, MapPin, Car, Calendar, Gauge, Zap, Fuel, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insertRequestSchema, Vehicle, RentalOption } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Schema per il form di richiesta informazioni
const requestFormSchema = z.object({
  vehicleId: z.number(),
  fullName: z.string().min(3, "Inserisci il tuo nome completo"),
  email: z.string().email("Inserisci un'email valida"),
  phone: z.string().min(6, "Inserisci un numero di telefono valido"),
  province: z.string().min(2, "Seleziona una provincia"),
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
  const [, params] = useRoute("/request-info/:vehicleId/:rentalOptionId?");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const vehicleId = parseInt(params?.vehicleId || "0");
  const rentalOptionId = params?.rentalOptionId ? parseInt(params.rentalOptionId) : undefined;
  
  // Recupera i dati del veicolo
  const { data: vehicle, isLoading: isLoadingVehicle } = useQuery({
    queryKey: ["/api/vehicles", vehicleId],
    queryFn: () => apiRequest("GET", `/api/vehicles/${vehicleId}`).then(res => res.json()),
    enabled: vehicleId > 0
  });
  
  // Recupera i dati delle opzioni di noleggio
  const { data: rentalOptions, isLoading: isLoadingOptions } = useQuery({
    queryKey: ["/api/vehicles", vehicleId, "rental-options"],
    queryFn: () => apiRequest("GET", `/api/vehicles/${vehicleId}/rental-options`).then(res => res.json()),
    enabled: vehicleId > 0
  });
  
  // Trova l'opzione di noleggio selezionata
  const selectedOption = rentalOptions?.find((option: RentalOption) => option.id === rentalOptionId);
  
  // Prepariamo il testo dell'opzione selezionata
  const selectedOptionText = selectedOption 
    ? `${selectedOption.type === 'NLT' ? 'Noleggio a Lungo Termine' : 'Rent to Buy'} - ${selectedOption.duration} mesi`
    : '';
    
  // Form di richiesta informazioni
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      vehicleId: vehicleId,
      fullName: "",
      email: "",
      phone: "",
      province: "",
      interestType: selectedOptionText || (rentalOptionId ? selectedOption?.type || "NLT" : "NLT"),
      message: "",
      privacyConsent: false,
      termsConsent: false
    }
  });
  
  // Assicuriamoci che il form visualizzi il valore corretto
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
        vehicleId: vehicleId,
      };
      const res = await apiRequest("POST", "/api/requests", toSubmit);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Richiesta inviata con successo",
        description: "Ti contatteremo al più presto.",
      });
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
  
  // Gestione del submit del form
  function onSubmit(data: RequestFormValues) {
    requestMutation.mutate(data);
  }
  
  // Loading state durante il caricamento dei dati
  if (isLoadingVehicle || isLoadingOptions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Redirect se il veicolo non esiste
  if (!vehicle && !isLoadingVehicle) {
    navigate("/");
    return null;
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb e pulsante indietro */}
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
            {/* Form di contatto - colonna sinistra */}
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
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Messaggio (opzionale)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Scrivi qui per aggiungere informazioni o richieste specifiche..." 
                            {...field} 
                            className="resize-none h-24"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4 pt-4">
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
                              Acconsento al trattamento dei miei dati personali come indicato nella{" "}
                              <a href="/privacy-policy" className="text-blue-600 hover:underline" target="_blank">
                                Privacy Policy
                              </a>
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
                              Accetto i{" "}
                              <a href="/terms" className="text-blue-600 hover:underline" target="_blank">
                                Termini e Condizioni
                              </a>{" "}
                              del servizio
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={requestMutation.isPending}
                  >
                    {requestMutation.isPending ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Invio in corso...
                      </>
                    ) : (
                      "Invia Richiesta"
                    )}
                  </Button>
                </form>
              </Form>
            </div>
            
            {/* Riepilogo veicolo - colonna destra */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="relative h-48 md:h-64">
                  <img 
                    src={vehicle?.mainImage || "https://placehold.co/600x400?text=Immagine+non+disponibile"} 
                    alt={vehicle?.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-2">{vehicle?.title}</h2>
                  
                  <div className="flex flex-wrap gap-2 my-4">
                    <div className="flex items-center px-3 py-1.5 bg-gray-50 rounded-full text-sm">
                      <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                      <span>{vehicle?.year}</span>
                    </div>
                    <div className="flex items-center px-3 py-1.5 bg-gray-50 rounded-full text-sm">
                      <Gauge className="h-4 w-4 text-blue-500 mr-2" />
                      <span>{vehicle?.mileage.toLocaleString()} km</span>
                    </div>
                    <div className="flex items-center px-3 py-1.5 bg-gray-50 rounded-full text-sm">
                      <Fuel className="h-4 w-4 text-blue-500 mr-2" />
                      <span>{vehicle?.fuelType}</span>
                    </div>
                    <div className="flex items-center px-3 py-1.5 bg-gray-50 rounded-full text-sm">
                      <Zap className="h-4 w-4 text-blue-500 mr-2" />
                      <span>{vehicle?.power} CV</span>
                    </div>
                  </div>
                  
                  {selectedOption && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      selectedOption.type === 'NLT' 
                      ? 'bg-blue-50 border border-blue-100' 
                      : 'bg-orange-50 border border-orange-100'
                    }`}>
                      <div className="flex items-center mb-2">
                        <span className={`px-2 py-0.5 text-xs font-bold text-white rounded ${
                          selectedOption.type === 'NLT' ? 'bg-blue-500' : 'bg-orange-500'
                        }`}>
                          {selectedOption.type === 'NLT' ? 'Noleggio a Lungo Termine' : 'Rent to Buy'}
                        </span>
                        
                        {selectedOption.isDefault && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 rounded">
                            Consigliato
                          </span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-gray-600">Canone mensile:</span>
                        <span className="text-xl font-bold text-blue-600">€ {selectedOption.monthlyPrice.toLocaleString()}</span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Durata:</span>
                          <span className="font-medium">{selectedOption.duration} mesi</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Anticipo:</span>
                          <span className="font-medium">€ {selectedOption.deposit.toLocaleString()}</span>
                        </div>
                        
                        {/* Deposito cauzionale */}
                        <div className="flex justify-between">
                          <span>Deposito Cauzionale:</span>
                          <span className="font-medium">
                            € {selectedOption.caution?.toLocaleString() || '350'} 
                            <span className="text-xs ml-1 text-gray-500">
                              {vehicle?.categoryId === 2 ? "(IVA esclusa)" : "(IVA inclusa)"}
                            </span>
                          </span>
                        </div>
                        
                        {/* Spese di istruttoria */}
                        <div className="flex justify-between">
                          <span>Spese Istruttoria:</span>
                          <span className="font-medium">
                            € {selectedOption.setupFee?.toLocaleString() || '350'} 
                            <span className="text-xs ml-1 text-gray-500">
                              {vehicle?.categoryId === 2 ? "(IVA esclusa)" : "(IVA inclusa)"}
                            </span>
                          </span>
                        </div>
                        
                        {selectedOption.annualMileage && (
                          <div className="flex justify-between">
                            <span>Km annui:</span>
                            <span className="font-medium">{selectedOption.annualMileage.toLocaleString()} km</span>
                          </div>
                        )}
                        
                        {selectedOption.finalPayment && (
                          <div className="flex justify-between">
                            <span>Riscatto finale:</span>
                            <span className="font-medium">€ {selectedOption.finalPayment.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      
                      {selectedOption.includedServices && Array.isArray(selectedOption.includedServices) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm font-medium mb-2">Inclusi nel canone:</p>
                          <div className="grid grid-cols-1 gap-1">
                            {(selectedOption.includedServices as string[]).map((service, idx) => (
                              <div key={idx} className="flex items-center text-sm">
                                <Check className="h-4 w-4 text-green-500 mr-2" />
                                <span>{service}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 bg-blue-50 rounded-lg p-5 border border-blue-100">
                <h3 className="font-medium mb-2 flex items-center text-blue-800">
                  <MailCheck className="h-5 w-5 mr-2 text-blue-600" />
                  Cosa succede dopo?
                </h3>
                <p className="text-sm text-blue-800">
                  Dopo l'invio della richiesta, il nostro team ti contatterà entro 24 ore per discutere i dettagli dell'offerta, rispondere alle tue domande e guidarti verso la soluzione più adatta alle tue esigenze.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}