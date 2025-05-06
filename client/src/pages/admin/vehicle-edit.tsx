import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { insertVehicleSchema, insertRentalOptionSchema, RentalOption } from "@shared/schema";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Save,
  Trash2,
  Plus,
  Image,
  X,
  ArrowLeft,
  Car,
  Calendar,
  Repeat,
  CreditCard,
  Check,
  Euro,
  ListChecks,
  ChevronDown,
  ChevronUp,
  Edit,
} from "lucide-react";

// Extended schema for the form with validation
const vehicleFormSchema = insertVehicleSchema.extend({
  images: z.array(z.any()).optional(),
  features: z.array(z.string()).min(1, "Aggiungi almeno una caratteristica"),
  badges: z.array(z.string()).optional(),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

const badgeOptions = [
  { id: "Premium", label: "Premium" },
  { id: "Promo", label: "Promo" },
  { id: "Economica", label: "Economica" },
  { id: "Zero Emissioni", label: "Zero Emissioni" },
  { id: "Riservato", label: "Riservato" },
  { id: "Assegnato", label: "Assegnato" },
  { id: "2Life", label: "2Life" },
];

export default function VehicleEditPage() {
  const [, params] = useRoute("/admin/vehicles/:id/edit");
  const [location, setLocation] = useLocation();
  const isEditMode = !!params?.id;
  const vehicleId = params?.id ? parseInt(params.id) : null;
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [imagesPreview, setImagesPreview] = useState<string[]>([]);
  const [imagesFiles, setImagesFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState("details");
  const [showNewContractForm, setShowNewContractForm] = useState(false);
  const [editingContractId, setEditingContractId] = useState<number | null>(null);
  const [tempContracts, setTempContracts] = useState<any[]>([]);

  // Fetch vehicle data if in edit mode
  const { data: vehicle, isLoading: isLoadingVehicle } = useQuery({
    queryKey: [`/api/vehicles/${vehicleId}`],
    enabled: isEditMode,
  });

  // Fetch rental options if in edit mode
  const { data: rentalOptions } = useQuery({
    queryKey: [`/api/vehicles/${vehicleId}/rental-options`],
    enabled: isEditMode
  });
  
  // Initialize tempContracts when component mounts
  useEffect(() => {
    if (!isEditMode) {
      setTempContracts([]);
    }
  }, [isEditMode]);

  // Fetch brands and categories
  const { data: brands } = useQuery({
    queryKey: ['/api/brands'],
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Initialize the form
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      title: "",
      brandId: 0,
      model: "",
      year: new Date().getFullYear(),
      mileage: 0,
      // I campi price e discountPrice sono stati rimossi perché non necessari per il modello di noleggio
      fuelType: "",
      transmission: "",
      power: 0,
      categoryId: 0,
      color: "",
      interiorColor: "",
      description: "",
      condition: "",
      features: [""],
      badges: [],
      mainImage: "",
      images: [],
    },
  });

  // Features field array
  const { fields: featureFields, append: appendFeature, remove: removeFeature } = useFieldArray({
    control: form.control,
    name: "features",
  });

  // Set form values when editing an existing vehicle
  useEffect(() => {
    if (isEditMode && vehicle) {
      const features = Array.isArray(vehicle.features) ? vehicle.features : [];
      const badges = Array.isArray(vehicle.badges) ? vehicle.badges : [];
      
      form.reset({
        ...vehicle,
        features: features.length > 0 ? features : [""],
        badges,
      });

      if (vehicle.mainImage) {
        setMainImagePreview(vehicle.mainImage);
      }

      if (vehicle.images && Array.isArray(vehicle.images)) {
        setImagesPreview(vehicle.images as string[]);
      }
    }
  }, [form, isEditMode, vehicle]);

  // Create/Update vehicle mutation
  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEditMode) {
        return await apiRequest("PUT", `/api/admin/vehicles/${vehicleId}`, data);
      } else {
        return await apiRequest("POST", "/api/admin/vehicles", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vehicles'] });
      if (isEditMode) {
        queryClient.invalidateQueries({ queryKey: [`/api/vehicles/${vehicleId}`] });
      }
      toast({
        title: isEditMode ? "Veicolo aggiornato" : "Veicolo creato",
        description: isEditMode 
          ? "Il veicolo è stato aggiornato con successo." 
          : "Il nuovo veicolo è stato creato con successo.",
      });
      setLocation('/admin/vehicles');
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || `Si è verificato un errore durante il ${isEditMode ? 'aggiornamento' : 'salvataggio'} del veicolo.`,
        variant: "destructive",
      });
    },
  });

  // Additional images upload mutation
  const imagesMutation = useMutation({
    mutationFn: async (data: { id: number, formData: FormData }) => {
      return await apiRequest("POST", `/api/admin/vehicles/${data.id}/images`, data.formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vehicles/${vehicleId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore caricamento immagini",
        description: error.message || "Si è verificato un errore durante il caricamento delle immagini aggiuntive.",
        variant: "destructive",
      });
    },
  });

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMainImageFile(file);
      setMainImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setImagesFiles(prev => [...prev, ...newFiles]);
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImagesPreview(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImagePreview = (index: number) => {
    setImagesPreview(prev => prev.filter((_, i) => i !== index));
    setImagesFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Create rental option mutation
  const rentalOptionMutation = useMutation({
    mutationFn: async (data: { vehicleId: number; contractData: any }) => {
      return await apiRequest("POST", `/api/admin/vehicles/${data.vehicleId}/rental-options`, data.contractData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/vehicles/${variables.vehicleId}/rental-options`] });
      toast({
        title: "Contratto aggiunto",
        description: "Il contratto è stato aggiunto con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'aggiunta del contratto.",
        variant: "destructive",
      });
    },
  });

  // Delete rental option mutation
  const deleteRentalOptionMutation = useMutation({
    mutationFn: async (data: { vehicleId: number; optionId: number }) => {
      return await apiRequest("DELETE", `/api/admin/vehicles/${data.vehicleId}/rental-options/${data.optionId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/vehicles/${variables.vehicleId}/rental-options`] });
      toast({
        title: "Contratto eliminato",
        description: "Il contratto è stato eliminato con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'eliminazione del contratto.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (values: VehicleFormValues) => {
    const formData = new FormData();
    
    // Convert the main data to JSON and add it to the form
    formData.append('data', JSON.stringify(values));
    
    // Add main image if selected
    if (mainImageFile) {
      formData.append('mainImage', mainImageFile);
    }
    
    // Submit the main vehicle data
    try {
      const response = await mutation.mutateAsync(formData);
      
      const newVehicleId = isEditMode ? vehicleId! : (response as any)?.id;
      
      // If we have additional images and we have a vehicle id
      if (imagesFiles.length > 0 && newVehicleId) {
        const imagesFormData = new FormData();
        imagesFiles.forEach((file) => {
          imagesFormData.append('images', file);
        });
        
        await imagesMutation.mutateAsync({ id: newVehicleId, formData: imagesFormData });
      }
      
      // If we're creating a new vehicle and have temporary contracts, add them to the new vehicle
      if (!isEditMode && tempContracts.length > 0 && newVehicleId) {
        for (const contract of tempContracts) {
          await rentalOptionMutation.mutateAsync({
            vehicleId: newVehicleId,
            contractData: {
              ...contract,
              vehicleId: newVehicleId
            }
          });
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  if (isEditMode && isLoadingVehicle) {
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
                onClick={() => setLocation('/admin/vehicles')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-neutral-800">
                  {isEditMode ? 'Modifica Veicolo' : 'Nuovo Veicolo'}
                </h1>
                <p className="text-neutral-500">
                  {isEditMode 
                    ? 'Aggiorna le informazioni di questo veicolo' 
                    : 'Aggiungi un nuovo veicolo al catalogo'}
                </p>
              </div>
            </div>
            
            <Button 
              onClick={form.handleSubmit(onSubmit)}
              disabled={mutation.isPending || imagesMutation.isPending}
            >
              {mutation.isPending || imagesMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvataggio...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Salva Veicolo
                </>
              )}
            </Button>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="details">Dettagli Veicolo</TabsTrigger>
                  <TabsTrigger value="specifications">Specifiche</TabsTrigger>
                  <TabsTrigger value="features">Caratteristiche</TabsTrigger>
                  <TabsTrigger value="images">Immagini</TabsTrigger>
                  <TabsTrigger value="contracts">Contratti</TabsTrigger>
                </TabsList>
                
                {/* Details Tab */}
                <TabsContent value="details">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Informazioni Base</CardTitle>
                        <CardDescription>
                          Inserisci le informazioni principali del veicolo
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Titolo*</FormLabel>
                              <FormControl>
                                <Input placeholder="Es. Audi A7 Sportback" {...field} />
                              </FormControl>
                              <FormDescription>
                                Nome completo del veicolo come mostrato nel catalogo
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="brandId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Marca*</FormLabel>
                                <Select
                                  value={field.value ? field.value.toString() : ""}
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleziona marca" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {brands?.map((brand) => (
                                      <SelectItem key={brand.id} value={brand.id.toString()}>
                                        {brand.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="model"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Modello*</FormLabel>
                                <FormControl>
                                  <Input placeholder="Es. A7 Sportback S line" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrizione*</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Inserisci una descrizione dettagliata del veicolo" 
                                  rows={5} 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        

                        
                        <FormField
                          control={form.control}
                          name="categoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Categoria*</FormLabel>
                              <Select
                                value={field.value ? field.value.toString() : "all"}
                                onValueChange={(value) => field.onChange(value === "all" ? null : parseInt(value))}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleziona categoria" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories?.map((category) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Badge</CardTitle>
                        <CardDescription>
                          Imposta gli indicatori promozionali per il veicolo
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        
                        <FormField
                          control={form.control}
                          name="badges"
                          render={() => (
                            <FormItem>
                              <div className="mb-4">
                                <FormLabel className="text-base">Badge</FormLabel>
                                <FormDescription>
                                  Seleziona i badge appropriati per questo veicolo
                                </FormDescription>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {badgeOptions.map((badge) => (
                                  <FormField
                                    key={badge.id}
                                    control={form.control}
                                    name="badges"
                                    render={({ field }) => {
                                      const isChecked = field.value?.includes(badge.id);
                                      return (
                                        <FormItem
                                          key={badge.id}
                                          className="flex flex-row items-start space-x-3 space-y-0 p-2 rounded-md hover:bg-neutral-50"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={isChecked}
                                              className="mt-1"
                                              onCheckedChange={(checked) => {
                                                const currentValues = field.value || [];
                                                const newValues = checked
                                                  ? [...currentValues, badge.id]
                                                  : currentValues.filter(value => value !== badge.id);
                                                field.onChange(newValues);
                                              }}
                                            />
                                          </FormControl>
                                          <div>
                                            <FormLabel className="font-medium text-neutral-800 mb-0">
                                              {badge.label}
                                            </FormLabel>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                              {badge.id === "Premium" && "Per veicoli di alta gamma"}
                                              {badge.id === "Promo" && "Per veicoli in promozione speciale"}
                                              {badge.id === "Economica" && "Per veicoli a basso costo"}
                                              {badge.id === "Zero Emissioni" && "Per veicoli elettrici o eco-friendly"}
                                              {badge.id === "Riservato" && "Per veicoli già prenotati"}
                                              {badge.id === "Assegnato" && "Per veicoli temporaneamente assegnati"}
                                              {badge.id === "2Life" && "Per veicoli usati"}
                                            </p>
                                          </div>
                                        </FormItem>
                                      );
                                    }}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Specifications Tab */}
                <TabsContent value="specifications">
                  <Card>
                    <CardHeader>
                      <CardTitle>Specifiche Tecniche</CardTitle>
                      <CardDescription>
                        Dettagli tecnici del veicolo
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Anno*</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min={1900}
                                  max={new Date().getFullYear() + 1}
                                  placeholder="Es. 2022" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || new Date().getFullYear())}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="mileage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Chilometraggio (km)*</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min={0}
                                  placeholder="Es. 15000" 
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
                          name="power"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Potenza (CV)*</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min={0}
                                  placeholder="Es. 286" 
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
                          name="fuelType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Alimentazione*</FormLabel>
                              <Select
                                value={field.value || "none"}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleziona alimentazione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Benzina">Benzina</SelectItem>
                                  <SelectItem value="Diesel">Diesel</SelectItem>
                                  <SelectItem value="Ibrida">Ibrida</SelectItem>
                                  <SelectItem value="Elettrica">Elettrica</SelectItem>
                                  <SelectItem value="GPL">GPL</SelectItem>
                                  <SelectItem value="Metano">Metano</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="transmission"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cambio*</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleziona tipo di cambio" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Manuale">Manuale</SelectItem>
                                  <SelectItem value="Automatico">Automatico</SelectItem>
                                  <SelectItem value="Semiautomatico">Semiautomatico</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="color"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Colore Esterno*</FormLabel>
                              <FormControl>
                                <Input placeholder="Es. Nero Mythos" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="interiorColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Colore Interni*</FormLabel>
                              <FormControl>
                                <Input placeholder="Es. Pelle Nera" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Features Tab */}
                <TabsContent value="features">
                  <Card>
                    <CardHeader>
                      <CardTitle>Caratteristiche e Dotazioni</CardTitle>
                      <CardDescription>
                        Aggiungi l'equipaggiamento e le caratteristiche del veicolo
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {featureFields.map((field, index) => (
                          <div key={field.id} className="flex items-center gap-2">
                            <FormField
                              control={form.control}
                              name={`features.${index}`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input placeholder="Es. Cerchi in lega da 20&quot;" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (featureFields.length > 1) {
                                  removeFeature(index);
                                }
                              }}
                              disabled={featureFields.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => appendFeature("")}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Aggiungi Caratteristica
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Images Tab */}
                <TabsContent value="images">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Immagine Principale</CardTitle>
                        <CardDescription>
                          Carica l'immagine principale del veicolo che verrà visualizzata nel catalogo
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center">
                            {mainImagePreview ? (
                              <div className="relative w-full">
                                <img 
                                  src={mainImagePreview} 
                                  alt="Anteprima immagine principale" 
                                  className="max-h-64 mx-auto object-contain rounded-md"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2"
                                  onClick={() => {
                                    setMainImagePreview(null);
                                    setMainImageFile(null);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <Image className="h-12 w-12 text-neutral-400 mb-2" />
                                <p className="text-sm text-neutral-500 mb-2">
                                  Trascina e rilascia un'immagine oppure
                                </p>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => document.getElementById('mainImage')?.click()}
                                >
                                  Seleziona File
                                </Button>
                              </>
                            )}
                            <input
                              id="mainImage"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleMainImageChange}
                            />
                          </div>
                          <FormDescription>
                            Formati supportati: JPG, PNG, WEBP. Dimensione massima: 5MB.
                          </FormDescription>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Galleria Immagini</CardTitle>
                        <CardDescription>
                          Carica immagini aggiuntive per la galleria del veicolo
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center">
                            <Image className="h-12 w-12 text-neutral-400 mb-2" />
                            <p className="text-sm text-neutral-500 mb-2">
                              Trascina e rilascia le immagini oppure
                            </p>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={() => document.getElementById('images')?.click()}
                            >
                              Seleziona File
                            </Button>
                            <input
                              id="images"
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={handleImagesChange}
                            />
                          </div>
                          
                          {imagesPreview.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                              {imagesPreview.map((src, index) => (
                                <div key={index} className="relative h-32 bg-neutral-100 rounded-md overflow-hidden">
                                  <img
                                    src={src}
                                    alt={`Anteprima ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6"
                                    onClick={() => removeImagePreview(index)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <FormDescription>
                            Puoi caricare fino a 10 immagini. Dimensione massima per file: 5MB.
                          </FormDescription>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Contracts Tab */}
                <TabsContent value="contracts">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Opzioni di Noleggio</CardTitle>
                        <CardDescription>
                          Gestisci i contratti di noleggio disponibili per questo veicolo
                        </CardDescription>
                      </div>
                      
                      {!showNewContractForm && (
                        <Button
                          onClick={() => setShowNewContractForm(true)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" /> Nuovo Contratto
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent>
                      {isEditMode && rentalOptions && rentalOptions.length === 0 && !showNewContractForm && (
                        <div className="text-center py-8">
                          <Car className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">Nessun contratto configurato</h3>
                          <p className="text-gray-500 mb-4">Questo veicolo non ha opzioni di noleggio configurate</p>
                          <Button
                            onClick={() => setShowNewContractForm(true)}
                            className="flex items-center gap-2 mx-auto"
                          >
                            <Plus className="h-4 w-4" /> Aggiungi il primo contratto
                          </Button>
                        </div>
                      )}
                      
                      {!isEditMode && tempContracts.length === 0 && !showNewContractForm && (
                        <div className="text-center py-8">
                          <Car className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">Nessun contratto configurato</h3>
                          <p className="text-gray-500 mb-4">Aggiungi contratti di noleggio per questo veicolo</p>
                          <Button
                            onClick={() => setShowNewContractForm(true)}
                            className="flex items-center gap-2 mx-auto"
                          >
                            <Plus className="h-4 w-4" /> Aggiungi il primo contratto
                          </Button>
                        </div>
                      )}
                      
                      {/* Form to add a new contract */}
                      {showNewContractForm && (
                        <div className="border rounded-lg p-4 mb-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Nuovo Contratto</h3>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setShowNewContractForm(false);
                                setEditingContractId(null);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="contract-type" className="block text-sm font-medium text-gray-700 mb-1">
                                  Tipo Contratto*
                                </label>
                                <select 
                                  id="contract-type"
                                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary text-sm"
                                  defaultValue=""
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
                                  defaultValue=""
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
                                <input 
                                  type="number" 
                                  id="monthly-price"
                                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary text-sm"
                                  placeholder="Es. 299"
                                  required
                                  min="0"
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="deposit" className="block text-sm font-medium text-gray-700 mb-1">
                                  Anticipo (€)*
                                </label>
                                <input 
                                  type="number" 
                                  id="deposit"
                                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary text-sm"
                                  placeholder="Es. 3000"
                                  required
                                  min="0"
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="caution" className="block text-sm font-medium text-gray-700 mb-1">
                                  Deposito Cauzionale (€)
                                </label>
                                <input 
                                  type="number" 
                                  id="caution"
                                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary text-sm"
                                  placeholder="Es. 500"
                                  min="0"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label htmlFor="annual-mileage" className="block text-sm font-medium text-gray-700 mb-1">
                                  Km Annuali
                                </label>
                                <input 
                                  type="number" 
                                  id="annual-mileage"
                                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary text-sm"
                                  placeholder="Es. 15000"
                                  min="0"
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="setup-fee" className="block text-sm font-medium text-gray-700 mb-1">
                                  Spese Istruttoria (€)
                                </label>
                                <input 
                                  type="number" 
                                  id="setup-fee"
                                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary text-sm"
                                  placeholder="Es. 300"
                                  min="0"
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="final-payment" className="block text-sm font-medium text-gray-700 mb-1">
                                  Maxirata Finale (€)
                                </label>
                                <input 
                                  type="number" 
                                  id="final-payment"
                                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary text-sm"
                                  placeholder="Solo per RTB"
                                  min="0"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Servizi Inclusi
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {[
                                  "Assicurazione RCA",
                                  "Manutenzione Ordinaria",
                                  "Manutenzione Straordinaria",
                                  "Assistenza Stradale",
                                  "Cambio Pneumatici",
                                  "Sostituzione Veicolo",
                                  "Soccorso Stradale",
                                  "Copertura Kasko",
                                  "Copertura Furto e Incendio"
                                ].map((service, index) => (
                                  <div key={index} className="flex items-center">
                                    <input 
                                      type="checkbox" 
                                      id={`service-${index}`}
                                      className="h-4 w-4 text-primary focus:ring-primary rounded border-gray-300"
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
                              />
                              <label htmlFor="is-default" className="ml-2 block text-sm text-gray-900">
                                Imposta come contratto predefinito
                              </label>
                            </div>
                            
                            <div className="flex justify-end gap-2 mt-4">
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setShowNewContractForm(false);
                                  setEditingContractId(null);
                                }}
                              >
                                Annulla
                              </Button>
                              <Button 
                                onClick={() => {
                                  // Get all the values from the form
                                  const type = (document.getElementById('contract-type') as HTMLSelectElement).value;
                                  const duration = parseInt((document.getElementById('contract-duration') as HTMLSelectElement).value);
                                  const monthlyPrice = parseInt((document.getElementById('monthly-price') as HTMLInputElement).value);
                                  const deposit = parseInt((document.getElementById('deposit') as HTMLInputElement).value);
                                  const caution = parseInt((document.getElementById('caution') as HTMLInputElement).value) || null;
                                  const annualMileage = parseInt((document.getElementById('annual-mileage') as HTMLInputElement).value) || null;
                                  const setupFee = parseInt((document.getElementById('setup-fee') as HTMLInputElement).value) || null;
                                  const finalPayment = parseInt((document.getElementById('final-payment') as HTMLInputElement).value) || null;
                                  const isDefault = (document.getElementById('is-default') as HTMLInputElement).checked;
                                  
                                  // Get all selected services
                                  const includedServices = [
                                    "Assicurazione RCA",
                                    "Manutenzione Ordinaria",
                                    "Manutenzione Straordinaria",
                                    "Assistenza Stradale",
                                    "Cambio Pneumatici",
                                    "Sostituzione Veicolo",
                                    "Soccorso Stradale",
                                    "Copertura Kasko",
                                    "Copertura Furto e Incendio"
                                  ].filter((_, index) => (document.getElementById(`service-${index}`) as HTMLInputElement).checked);
                                  
                                  const newContract = {
                                    type,
                                    duration,
                                    monthlyPrice,
                                    deposit,
                                    caution,
                                    annualMileage,
                                    setupFee,
                                    finalPayment,
                                    isDefault,
                                    includedServices
                                  };
                                  
                                  if (isEditMode && vehicleId) {
                                    // If we're editing an existing vehicle, add the contract to the database
                                    rentalOptionMutation.mutate({
                                      vehicleId,
                                      contractData: {
                                        ...newContract,
                                        vehicleId
                                      }
                                    }, {
                                      onSuccess: () => {
                                        setShowNewContractForm(false);
                                        setEditingContractId(null);
                                      }
                                    });
                                  } else {
                                    // If we're creating a new vehicle, add the contract to the temporary list
                                    setTempContracts([...tempContracts, newContract]);
                                    setShowNewContractForm(false);
                                    setEditingContractId(null);
                                  }
                                }}
                              >
                                Salva Contratto
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* List of existing contracts */}
                      {isEditMode && rentalOptions && rentalOptions.length > 0 && !showNewContractForm && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {rentalOptions.map((option) => (
                            <Card key={option.id} className={`border-l-4 ${option.type === 'NLT' ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <span className={`inline-block text-xs font-semibold text-white px-2 py-1 rounded mb-2 ${option.type === 'NLT' ? 'bg-blue-500' : 'bg-orange-500'}`}>
                                      {option.type}
                                    </span>
                                    <h4 className="font-semibold">
                                      {option.type === 'NLT' ? 'Noleggio' : 'Rent to Buy'} {option.duration} mesi
                                    </h4>
                                  </div>
                                  {option.isDefault && (
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Default</span>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-sm mb-3">
                                  <div className="text-gray-600">Canone:</div>
                                  <div className="font-medium">€ {option.monthlyPrice}/mese</div>
                                  <div className="text-gray-600">Anticipo:</div>
                                  <div className="font-medium">€ {option.deposit}</div>
                                  {option.finalPayment && (
                                    <>
                                      <div className="text-gray-600">Maxirata:</div>
                                      <div className="font-medium">€ {option.finalPayment}</div>
                                    </>
                                  )}
                                </div>
                                {option.includedServices && Array.isArray(option.includedServices) && option.includedServices.length > 0 && (
                                  <div className="mt-3 text-xs text-gray-500">
                                    <p className="font-medium text-gray-600 mb-1">Servizi inclusi: {option.includedServices.length}</p>
                                  </div>
                                )}
                                <div className="flex mt-4 gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="flex-1"
                                    onClick={() => setLocation(`/admin/vehicles/${vehicleId}/rental-options/${option.id}`)}
                                  >
                                    <Edit className="h-4 w-4 mr-1" /> Modifica
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      if (confirm("Sei sicuro di voler eliminare questo contratto?")) {
                                        deleteRentalOptionMutation.mutate({
                                          vehicleId: vehicleId!,
                                          optionId: option.id
                                        });
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                      
                      {/* List of temporary contracts for new vehicles */}
                      {!isEditMode && tempContracts.length > 0 && !showNewContractForm && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {tempContracts.map((option, index) => (
                            <Card key={index} className={`border-l-4 ${option.type === 'NLT' ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <span className={`inline-block text-xs font-semibold text-white px-2 py-1 rounded mb-2 ${option.type === 'NLT' ? 'bg-blue-500' : 'bg-orange-500'}`}>
                                      {option.type}
                                    </span>
                                    <h4 className="font-semibold">
                                      {option.type === 'NLT' ? 'Noleggio' : 'Rent to Buy'} {option.duration} mesi
                                    </h4>
                                  </div>
                                  {option.isDefault && (
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Default</span>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-sm mb-3">
                                  <div className="text-gray-600">Canone:</div>
                                  <div className="font-medium">€ {option.monthlyPrice}/mese</div>
                                  <div className="text-gray-600">Anticipo:</div>
                                  <div className="font-medium">€ {option.deposit}</div>
                                  {option.finalPayment && (
                                    <>
                                      <div className="text-gray-600">Maxirata:</div>
                                      <div className="font-medium">€ {option.finalPayment}</div>
                                    </>
                                  )}
                                </div>
                                {option.includedServices && Array.isArray(option.includedServices) && option.includedServices.length > 0 && (
                                  <div className="mt-3 text-xs text-gray-500">
                                    <p className="font-medium text-gray-600 mb-1">Servizi inclusi: {option.includedServices.length}</p>
                                  </div>
                                )}
                                <div className="flex mt-4 gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      if (confirm("Sei sicuro di voler eliminare questo contratto?")) {
                                        setTempContracts(tempContracts.filter((_, i) => i !== index));
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" /> Elimina
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="mr-2"
                  onClick={() => setLocation('/admin/vehicles')}
                >
                  Annulla
                </Button>
                
                <Button 
                  type="submit"
                  disabled={mutation.isPending || imagesMutation.isPending}
                >
                  {mutation.isPending || imagesMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Salva Veicolo
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </main>
      </div>
    </div>
  );
}
