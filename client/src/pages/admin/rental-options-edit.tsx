import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { insertRentalOptionSchema, Vehicle, RentalOption } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";
import { useAuth } from "@/hooks/use-auth";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Save,
  Trash2,
  Plus,
  ArrowLeft,
  Car,
  Euro,
  AlignJustify,
  Check,
} from "lucide-react";

// Extended schema for the form with validation
const rentalOptionFormSchema = insertRentalOptionSchema.extend({
  includedServices: z.array(z.string()).min(1, "Aggiungi almeno un servizio incluso"),
});

type RentalOptionFormValues = z.infer<typeof rentalOptionFormSchema>;

export default function RentalOptionsEditPage() {
  const [, params] = useRoute("/admin/vehicles/:vehicleId/rental-options/:optionId");
  const [location, setLocation] = useLocation();
  const isEditMode = !!params?.optionId && params.optionId !== "new";
  const vehicleId = params?.vehicleId ? parseInt(params.vehicleId) : null;
  const optionId = params?.optionId && params.optionId !== "new" ? parseInt(params.optionId) : null;
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");

  // Fetch vehicle data
  const { data: vehicle, isLoading: isLoadingVehicle } = useQuery({
    queryKey: [`/api/vehicles/${vehicleId}`],
    enabled: !!vehicleId,
  });

  // Fetch rental option data if in edit mode
  const { data: rentalOption, isLoading: isLoadingRentalOption } = useQuery({
    queryKey: [`/api/admin/rental-options/${optionId}`],
    enabled: isEditMode && !!optionId,
  });

  // Initialize the form
  const form = useForm<RentalOptionFormValues>({
    resolver: zodResolver(rentalOptionFormSchema),
    defaultValues: {
      vehicleId: vehicleId || 0,
      type: "NLT",
      deposit: 0,
      duration: 36,
      annualMileage: 15000,
      monthlyPrice: 0,
      finalPayment: 0,
      isDefault: false,
      includedServices: [""],
    },
  });

  // Included services field array
  const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({
    control: form.control,
    name: "includedServices",
  });

  // Set form values when editing an existing rental option
  useEffect(() => {
    if (isEditMode && rentalOption) {
      const includedServices = Array.isArray(rentalOption.includedServices) 
        ? rentalOption.includedServices 
        : [""];
      
      form.reset({
        ...rentalOption,
        includedServices: includedServices.length > 0 ? includedServices : [""],
      });
    } else if (vehicleId) {
      form.setValue("vehicleId", vehicleId);
    }
  }, [form, isEditMode, rentalOption, vehicleId]);

  // Create/Update rental option mutation
  const mutation = useMutation({
    mutationFn: async (data: RentalOptionFormValues) => {
      if (isEditMode && optionId) {
        return await apiRequest("PUT", `/api/admin/rental-options/${optionId}`, data);
      } else {
        return await apiRequest("POST", `/api/admin/vehicles/${vehicleId}/rental-options`, data);
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/vehicles/${vehicleId}/rental-options`] });
      if (isEditMode && optionId) {
        queryClient.invalidateQueries({ queryKey: [`/api/admin/rental-options/${optionId}`] });
      }
      
      toast({
        title: isEditMode ? "Opzione di noleggio aggiornata" : "Opzione di noleggio creata",
        description: isEditMode 
          ? "L'opzione di noleggio è stata aggiornata con successo." 
          : "La nuova opzione di noleggio è stata creata con successo.",
      });
      
      // Navigate back to vehicle page
      setLocation(`/admin/vehicles/${vehicleId}/edit`);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || `Si è verificato un errore durante il ${isEditMode ? 'aggiornamento' : 'salvataggio'} dell'opzione di noleggio.`,
        variant: "destructive",
      });
    },
  });

  // Delete rental option mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (isEditMode && optionId) {
        return await apiRequest("DELETE", `/api/admin/rental-options/${optionId}`);
      }
      throw new Error("Impossibile eliminare: ID opzione non valido");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vehicles/${vehicleId}/rental-options`] });
      
      toast({
        title: "Opzione di noleggio eliminata",
        description: "L'opzione di noleggio è stata eliminata con successo.",
      });
      
      // Navigate back to vehicle page
      setLocation(`/admin/vehicles/${vehicleId}/edit`);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore eliminazione",
        description: error.message || "Si è verificato un errore durante l'eliminazione dell'opzione di noleggio.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: RentalOptionFormValues) => {
    mutation.mutate(values);
  };

  const handleDelete = () => {
    if (confirm("Sei sicuro di voler eliminare questa opzione di noleggio? Questa azione non può essere annullata.")) {
      deleteMutation.mutate();
    }
  };

  if (isLoadingVehicle || (isEditMode && isLoadingRentalOption)) {
    return (
      <div className="flex h-full min-h-screen">
        <AdminSidebar />
        <div className="flex-1 pl-64 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex h-full min-h-screen">
        <AdminSidebar />
        <div className="flex-1 pl-64 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Veicolo non trovato</h2>
            <p className="text-gray-500 mb-4">Impossibile trovare il veicolo specificato.</p>
            <Button onClick={() => setLocation('/admin/vehicles')}>
              Torna all'elenco veicoli
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-screen bg-neutral-100">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col pl-64 overflow-hidden">
        <AdminHeader user={user} />
        
        <main className="flex-1 overflow-y-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="mr-2"
                onClick={() => setLocation(`/admin/vehicles/${vehicleId}/edit`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-neutral-800">
                  {isEditMode ? 'Modifica Opzione di Noleggio' : 'Nuova Opzione di Noleggio'}
                </h1>
                <p className="text-neutral-500 flex items-center">
                  <Car className="h-4 w-4 mr-1" /> {vehicle.title}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {isEditMode && (
                <Button 
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminazione...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" /> Elimina
                    </>
                  )}
                </Button>
              )}
              
              <Button 
                onClick={form.handleSubmit(onSubmit)}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvataggio...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Salva
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="details">Dettagli</TabsTrigger>
                  <TabsTrigger value="services">Servizi Inclusi</TabsTrigger>
                </TabsList>
                
                {/* Details Tab */}
                <TabsContent value="details">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Informazioni Base</CardTitle>
                        <CardDescription>
                          Configura i dettagli principali dell'opzione di noleggio
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo di Contratto*</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleziona tipo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="NLT">Noleggio a Lungo Termine (NLT)</SelectItem>
                                  <SelectItem value="RTB">Rent to Buy (RTB)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                NLT: noleggio con canone fisso mensile. RTB: opzione di acquisto finale.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="duration"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Durata (mesi)*</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min={1}
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="annualMileage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Km Annui</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min={0}
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="deposit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Anticipo (€)*</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min={0}
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="monthlyPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Canone Mensile (€)*</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min={0}
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {form.watch("type") === "RTB" && (
                          <FormField
                            control={form.control}
                            name="finalPayment"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Maxirata Finale (€)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min={0}
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Importo finale per l'acquisto del veicolo (solo per RTB)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        
                        <FormField
                          control={form.control}
                          name="isDefault"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Opzione Predefinita</FormLabel>
                                <FormDescription>
                                  Seleziona come opzione predefinita per questo veicolo
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                    
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Riepilogo Contratto</CardTitle>
                          <CardDescription>Anteprima dell'opzione di noleggio</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className={`contract-card ${form.watch("type") === "NLT" ? "contract-nlt" : "contract-rtb"} mb-4`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex gap-2 mb-2">
                                  <span className={`inline-block text-xs font-semibold text-white px-2 py-1 rounded ${form.watch("type") === "NLT" ? "bg-blue-500" : "bg-orange-500"}`}>
                                    {form.watch("type")}
                                  </span>
                                  
                                  {form.watch("duration") === 36 && (
                                    <span className="inline-block text-xs font-semibold text-white px-2 py-1 rounded bg-green-500">
                                      Consigliato
                                    </span>
                                  )}
                                </div>
                                
                                <h4 className="text-lg font-semibold mb-1">
                                  {form.watch("type") === "NLT" ? "Noleggio" : "Rent to Buy"} {form.watch("duration")} mesi
                                </h4>
                                
                                <div className="text-2xl font-bold text-gray-900 mb-2">
                                  € {form.watch("monthlyPrice").toLocaleString()}<span className="text-sm font-normal text-gray-500">/mese</span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <AlignJustify className="h-4 w-4 text-blue-500 mr-1.5" />
                                    <span>Durata: {form.watch("duration")} mesi</span>
                                  </div>
                                  
                                  {form.watch("annualMileage") > 0 && (
                                    <div className="flex items-center">
                                      <Car className="h-4 w-4 text-blue-500 mr-1.5" />
                                      <span>{form.watch("annualMileage").toLocaleString()} km/anno</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center">
                                    <Euro className="h-4 w-4 text-blue-500 mr-1.5" />
                                    <span>Anticipo: € {form.watch("deposit").toLocaleString()}</span>
                                  </div>
                                  
                                  {form.watch("type") === "RTB" && form.watch("finalPayment") > 0 && (
                                    <div className="flex items-center">
                                      <Euro className="h-4 w-4 text-blue-500 mr-1.5" />
                                      <span>Maxirata: € {form.watch("finalPayment").toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-500 italic">
                            Nota: questo è solo un riepilogo. I dettagli completi, inclusi i servizi inclusi, saranno visibili nella scheda del veicolo.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Services Tab */}
                <TabsContent value="services">
                  <Card>
                    <CardHeader>
                      <CardTitle>Servizi Inclusi nel Canone</CardTitle>
                      <CardDescription>
                        Specifica quali servizi sono inclusi in questa opzione di noleggio
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {serviceFields.map((field, index) => (
                          <div key={field.id} className="flex items-center gap-2">
                            <FormField
                              control={form.control}
                              name={`includedServices.${index}`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <div className="flex items-center gap-2">
                                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                      <Input 
                                        placeholder="Es. Manutenzione ordinaria e straordinaria" 
                                        {...field} 
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeService(index)}
                              disabled={serviceFields.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => appendService("")}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Aggiungi Servizio
                        </Button>
                      </div>
                      
                      <div className="mt-6 p-4 bg-blue-50 rounded-md">
                        <h4 className="text-sm font-medium text-blue-700 mb-2">Suggerimenti per i servizi inclusi:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="justify-start text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                            onClick={() => appendService("Manutenzione ordinaria e straordinaria")}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1.5" /> Manutenzione ordinaria e straordinaria
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="justify-start text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                            onClick={() => appendService("Assicurazione RCA")}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1.5" /> Assicurazione RCA
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="justify-start text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                            onClick={() => appendService("Copertura Kasko e Furto/Incendio")}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1.5" /> Copertura Kasko e Furto/Incendio
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="justify-start text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                            onClick={() => appendService("Assistenza stradale 24/7")}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1.5" /> Assistenza stradale 24/7
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="justify-start text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                            onClick={() => appendService("Cambio pneumatici stagionali")}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1.5" /> Cambio pneumatici stagionali
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="justify-start text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                            onClick={() => appendService("Auto sostitutiva")}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1.5" /> Auto sostitutiva
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="justify-start text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                            onClick={() => appendService("Garanzia estesa per la durata del contratto")}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1.5" /> Garanzia estesa
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="justify-start text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                            onClick={() => appendService("Tassa di proprietà inclusa")}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1.5" /> Tassa di proprietà inclusa
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </main>
      </div>
    </div>
  );
}