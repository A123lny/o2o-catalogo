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
} from "lucide-react";

// Extended schema for the form with validation
const vehicleFormSchema = insertVehicleSchema.extend({
  images: z.array(z.any()).optional(),
  features: z.array(z.string()).min(1, "Aggiungi almeno una caratteristica"),
  badges: z.array(z.string()).optional(),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

const badgeOptions = [
  { id: "promo", label: "Promo" },
  { id: "new", label: "Nuovo" },
  { id: "sold", label: "Venduto" },
  { id: "reserved", label: "Riservato" },
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

  // Fetch vehicle data if in edit mode
  const { data: vehicle, isLoading: isLoadingVehicle } = useQuery({
    queryKey: [`/api/vehicles/${vehicleId}`],
    enabled: isEditMode,
  });

  // Fetch rental options if in edit mode
  const { data: rentalOptions } = useQuery({
    queryKey: [`/api/vehicles/${vehicleId}/rental-options`],
    enabled: isEditMode,
  });

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
      
      // If we have additional images and we're in edit mode or have a response with id
      if (imagesFiles.length > 0) {
        const vehicleId = isEditMode ? parseInt(params!.id) : (response as any)?.id;
        
        if (vehicleId) {
          const imagesFormData = new FormData();
          imagesFiles.forEach((file) => {
            imagesFormData.append('images', file);
          });
          
          await imagesMutation.mutateAsync({ id: vehicleId, formData: imagesFormData });
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
                          name="condition"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Condizione*</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleziona condizione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Nuovo">Nuovo</SelectItem>
                                  <SelectItem value="Usato">Usato</SelectItem>
                                  <SelectItem value="Km 0">Km 0</SelectItem>
                                  <SelectItem value="Aziendale">Aziendale</SelectItem>
                                </SelectContent>
                              </Select>
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
                                  Seleziona i badge da associare al veicolo
                                </FormDescription>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
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
                                          className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={isChecked}
                                              onCheckedChange={(checked) => {
                                                const currentValues = field.value || [];
                                                const newValues = checked
                                                  ? [...currentValues, badge.id]
                                                  : currentValues.filter(value => value !== badge.id);
                                                field.onChange(newValues);
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="font-normal">
                                            {badge.label}
                                          </FormLabel>
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
