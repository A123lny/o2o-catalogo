import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertVehicleSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

// Estendi lo schema del veicolo per il form
const vehicleFormSchema = insertVehicleSchema.extend({
  images: z.array(z.any()).optional(),
  features: z.array(z.string()).min(1, "Aggiungi almeno una caratteristica"),
  badges: z.array(z.string()).optional(),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

interface VehicleEditModalProps {
  vehicleId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function VehicleEditModal({ vehicleId, isOpen, onClose }: VehicleEditModalProps) {
  const { toast } = useToast();
  const isEditMode = !!vehicleId;

  // Fetch vehicle data if in edit mode
  const { data: vehicle, isLoading: isLoadingVehicle } = useQuery({
    queryKey: [`/api/vehicles/${vehicleId}`],
    enabled: isEditMode && isOpen,
  });

  // Fetch brands and categories
  const { data: brands } = useQuery({
    queryKey: ['/api/brands'],
    enabled: isOpen,
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    enabled: isOpen,
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      if (isEditMode) {
        queryClient.invalidateQueries({ queryKey: [`/api/vehicles/${vehicleId}`] });
      }
      toast({
        title: isEditMode ? "Veicolo aggiornato" : "Veicolo creato",
        description: isEditMode 
          ? "Il veicolo è stato aggiornato con successo." 
          : "Il nuovo veicolo è stato creato con successo.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || `Si è verificato un errore durante il ${isEditMode ? 'aggiornamento' : 'salvataggio'} del veicolo.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: VehicleFormValues) => {
    // Crea un oggetto FormData per l'invio dei dati e dei file
    const formData = new FormData();
    
    // Aggiungi tutti i campi tranne quelli speciali
    for (const [key, value] of Object.entries(values)) {
      if (key !== 'images' && key !== 'features' && key !== 'badges') {
        formData.append(key, String(value));
      }
    }
    
    // Gestisci caratteristiche (features) come array JSON
    formData.append('features', JSON.stringify(values.features));
    
    // Gestisci badge come array JSON
    if (values.badges && values.badges.length > 0) {
      formData.append('badges', JSON.stringify(values.badges));
    }
    
    // Invia la mutation
    mutation.mutate(formData);
  };

  // Semplifichiamo il form per il modale, concentrandoci sui campi principali
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Modifica Veicolo' : 'Nuovo Veicolo'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Aggiorna le informazioni di questo veicolo' 
              : 'Aggiungi un nuovo veicolo al catalogo'}
          </DialogDescription>
        </DialogHeader>
        
        {isLoadingVehicle ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titolo</FormLabel>
                      <FormControl>
                        <Input placeholder="Es. Audi A4 2.0 TDI" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="brandId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona marca" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {brands?.map(brand => (
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
                      <FormLabel>Modello</FormLabel>
                      <FormControl>
                        <Input placeholder="Es. A4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anno</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1900} 
                          max={new Date().getFullYear() + 1}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                      <FormLabel>Chilometraggio (km)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                      <FormLabel>Condizione</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona condizione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Nuovo">Nuovo</SelectItem>
                          <SelectItem value="Usato">Usato</SelectItem>
                          <SelectItem value="Demo">Demo</SelectItem>
                          <SelectItem value="Km Zero">Km Zero</SelectItem>
                          <SelectItem value="2Life">2Life</SelectItem>
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
                      <FormLabel>Categoria</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map(category => (
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
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Inserisci una descrizione dettagliata del veicolo..." 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Annulla
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      {isEditMode ? "Aggiornamento..." : "Salvataggio..."}
                    </>
                  ) : (
                    isEditMode ? "Aggiorna Veicolo" : "Salva Veicolo"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}