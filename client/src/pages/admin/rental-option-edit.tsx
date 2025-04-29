import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Save, Trash2 } from "lucide-react";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";

export default function RentalOptionEditPage() {
  const [params, setLocation] = useLocation();
  const { vehicleId, optionId } = useParams<{ vehicleId: string; optionId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [type, setType] = useState<string>("");
  const [duration, setDuration] = useState<number>(0);
  const [monthlyPrice, setMonthlyPrice] = useState<number>(0);
  const [deposit, setDeposit] = useState<number>(0);
  const [caution, setCaution] = useState<number | null>(null);
  const [annualMileage, setAnnualMileage] = useState<number | null>(null);
  const [setupFee, setSetupFee] = useState<number | null>(null);
  const [finalPayment, setFinalPayment] = useState<number | null>(null);
  const [isDefault, setIsDefault] = useState<boolean>(false);
  
  // Services included
  const [includedServices, setIncludedServices] = useState<string[]>([]);
  
  // Services options
  const serviceOptions = [
    "Assicurazione RCA",
    "Manutenzione Ordinaria",
    "Manutenzione Straordinaria",
    "Assistenza Stradale",
    "Cambio Pneumatici",
    "Sostituzione Veicolo",
    "Soccorso Stradale",
    "Copertura Kasko",
    "Copertura Furto e Incendio"
  ];
  
  // Fetch vehicle data
  const { data: vehicle, isLoading: isLoadingVehicle } = useQuery({
    queryKey: [`/api/vehicles/${vehicleId}`],
    enabled: !!vehicleId,
  });
  
  // Fetch rental option data
  const { data: rentalOption, isLoading: isLoadingRentalOption } = useQuery({
    queryKey: [`/api/vehicles/${vehicleId}/rental-options/${optionId}`],
    enabled: !!vehicleId && !!optionId,
  });
  
  // Set form values when rental option data loads
  useEffect(() => {
    if (rentalOption) {
      setType(rentalOption.type || "");
      setDuration(rentalOption.duration || 0);
      setMonthlyPrice(rentalOption.monthlyPrice || 0);
      setDeposit(rentalOption.deposit || 0);
      setCaution(rentalOption.caution);
      setAnnualMileage(rentalOption.annualMileage);
      setSetupFee(rentalOption.setupFee);
      setFinalPayment(rentalOption.finalPayment);
      setIsDefault(rentalOption.isDefault || false);
      
      if (rentalOption.includedServices && Array.isArray(rentalOption.includedServices)) {
        setIncludedServices(rentalOption.includedServices);
      }
    }
  }, [rentalOption]);
  
  // Update rental option mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/admin/vehicles/${vehicleId}/rental-options/${optionId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vehicles/${vehicleId}/rental-options`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vehicles/${vehicleId}/rental-options/${optionId}`] });
      
      toast({
        title: "Contratto aggiornato",
        description: "Il contratto è stato aggiornato con successo.",
      });
      
      setLocation(`/admin/vehicles/${vehicleId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'aggiornamento del contratto.",
        variant: "destructive",
      });
    },
  });
  
  // Delete rental option mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/admin/vehicles/${vehicleId}/rental-options/${optionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vehicles/${vehicleId}/rental-options`] });
      
      toast({
        title: "Contratto eliminato",
        description: "Il contratto è stato eliminato con successo.",
      });
      
      setLocation(`/admin/vehicles/${vehicleId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'eliminazione del contratto.",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      type,
      duration,
      monthlyPrice,
      deposit,
      caution,
      annualMileage,
      setupFee,
      finalPayment,
      isDefault,
      includedServices,
      vehicleId: parseInt(vehicleId)
    };
    
    updateMutation.mutate(data);
  };
  
  const toggleService = (service: string) => {
    if (includedServices.includes(service)) {
      setIncludedServices(includedServices.filter(s => s !== service));
    } else {
      setIncludedServices([...includedServices, service]);
    }
  };
  
  const confirmDelete = () => {
    if (confirm("Sei sicuro di voler eliminare questo contratto?")) {
      deleteMutation.mutate();
    }
  };
  
  if (isLoadingVehicle || isLoadingRentalOption) {
    return (
      <div className="flex h-screen">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-neutral-100">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader user={user} />
        
        <main className="flex-1 overflow-y-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="mr-2"
                onClick={() => setLocation(`/admin/vehicles/${vehicleId}`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-neutral-800">
                  Modifica Contratto
                </h1>
                <p className="text-neutral-500">
                  {vehicle && vehicle.title ? `Veicolo: ${vehicle.title}` : 'Caricamento...'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={confirmDelete}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Elimina
              </Button>
              
              <Button 
                onClick={handleSubmit}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvataggio...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Salva Contratto
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Dettagli Contratto</CardTitle>
              <CardDescription>
                Modifica i dettagli del contratto di noleggio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contract-type" className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo Contratto*
                    </label>
                    <select 
                      id="contract-type"
                      className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary text-sm"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      required
                    >
                      <option value="" disabled>Seleziona tipo</option>
                      <option value="NLT">Noleggio Lungo Termine (NLT)</option>
                      <option value="RTB">Rent to Buy (RTB)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="contract-duration" className="block text-sm font-medium text-gray-700 mb-1">
                      Durata (mesi)*
                    </label>
                    <select 
                      id="contract-duration"
                      className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary text-sm"
                      value={duration.toString()}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      required
                    >
                      <option value="" disabled>Seleziona durata</option>
                      <option value="12">12 mesi</option>
                      <option value="24">24 mesi</option>
                      <option value="36">36 mesi</option>
                      <option value="48">48 mesi</option>
                      <option value="60">60 mesi</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="monthly-price" className="block text-sm font-medium text-gray-700 mb-1">
                      Canone Mensile (€)*
                    </label>
                    <Input 
                      type="number" 
                      id="monthly-price"
                      placeholder="Es. 299"
                      required
                      min="0"
                      value={monthlyPrice || ""}
                      onChange={(e) => setMonthlyPrice(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="deposit" className="block text-sm font-medium text-gray-700 mb-1">
                      Anticipo (€)*
                    </label>
                    <Input 
                      type="number" 
                      id="deposit"
                      placeholder="Es. 3000"
                      required
                      min="0"
                      value={deposit || ""}
                      onChange={(e) => setDeposit(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="caution" className="block text-sm font-medium text-gray-700 mb-1">
                      Deposito Cauzionale (€)
                    </label>
                    <Input 
                      type="number" 
                      id="caution"
                      placeholder="Es. 500"
                      min="0"
                      value={caution || ""}
                      onChange={(e) => setCaution(e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="annual-mileage" className="block text-sm font-medium text-gray-700 mb-1">
                      Km Annuali
                    </label>
                    <Input 
                      type="number" 
                      id="annual-mileage"
                      placeholder="Es. 15000"
                      min="0"
                      value={annualMileage || ""}
                      onChange={(e) => setAnnualMileage(e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="setup-fee" className="block text-sm font-medium text-gray-700 mb-1">
                      Spese Istruttoria (€)
                    </label>
                    <Input 
                      type="number" 
                      id="setup-fee"
                      placeholder="Es. 300"
                      min="0"
                      value={setupFee || ""}
                      onChange={(e) => setSetupFee(e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="final-payment" className="block text-sm font-medium text-gray-700 mb-1">
                      Maxirata Finale (€)
                    </label>
                    <Input 
                      type="number" 
                      id="final-payment"
                      placeholder="Solo per RTB"
                      min="0"
                      value={finalPayment || ""}
                      onChange={(e) => setFinalPayment(e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Servizi Inclusi
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {serviceOptions.map((service, index) => (
                      <div key={index} className="flex items-center">
                        <input 
                          type="checkbox" 
                          id={`service-${index}`}
                          className="h-4 w-4 text-primary focus:ring-primary rounded border-gray-300"
                          checked={includedServices.includes(service)}
                          onChange={() => toggleService(service)}
                        />
                        <label htmlFor={`service-${index}`} className="ml-2 block text-sm text-gray-900">
                          {service}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="is-default"
                    className="h-4 w-4 text-primary focus:ring-primary rounded border-gray-300"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                  />
                  <label htmlFor="is-default" className="ml-2 block text-sm text-gray-900">
                    Imposta come contratto predefinito
                  </label>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}