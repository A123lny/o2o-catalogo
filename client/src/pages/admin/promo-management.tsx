import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminSidebar from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Plus, Save } from "lucide-react";

// Definizione dei tipi per i componenti e funzioni
type PromoVehicle = {
  id: number;
  title: string;
  brandId: number;
  model: string;
  color: string;
  mainImage?: string | null;
  badges: string[];
  displayOrder: number;
};

type PromoSettings = {
  id: number;
  maxFeaturedVehicles: number;
  createdAt: string;
  updatedAt: string;
};

// Componente per un veicolo ordinabile
function SortableVehicleItem({ vehicle, onRemove }: { vehicle: PromoVehicle, onRemove: (id: number) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: vehicle.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Parse badges se necessario
  let badges: string[] = [];
  if (vehicle.badges) {
    badges = typeof vehicle.badges === 'string'
      ? JSON.parse(vehicle.badges as string)
      : vehicle.badges;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg shadow-md mb-3 relative"
    >
      <div className="flex items-center p-4">
        <div
          className="cursor-grab active:cursor-grabbing mr-3 text-gray-400"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={20} />
        </div>
        
        <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded">
          {vehicle.mainImage ? (
            <img
              src={vehicle.mainImage}
              alt={vehicle.title}
              className="w-16 h-16 object-cover rounded"
            />
          ) : (
            <div className="w-16 h-16 flex items-center justify-center text-gray-400">
              No img
            </div>
          )}
        </div>
        
        <div className="ml-4 flex-1">
          <h3 className="font-medium text-gray-900">{vehicle.title}</h3>
          <p className="text-sm text-gray-500">{vehicle.model} • {vehicle.color}</p>
          
          <div className="mt-1 flex flex-wrap gap-1">
            {Array.isArray(badges) && badges.map((badge, idx) => (
              <Badge key={idx} variant={badge === "Promo" ? "default" : "outline"} className="text-xs">
                {badge}
              </Badge>
            ))}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => onRemove(vehicle.id)}
        >
          <Trash2 size={18} />
        </Button>
      </div>
    </div>
  );
}

export default function PromoManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [availableVehicles, setAvailableVehicles] = useState<PromoVehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [maxVehicles, setMaxVehicles] = useState<number>(16);

  // Configurazione sensori per drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Caricamento delle impostazioni delle promozioni
  const { data: promoSettings } = useQuery({
    queryKey: ["/api/admin/promo/settings"],
    enabled: !!user,
  });

  // Caricamento dei veicoli in promozione
  const { 
    data: promoVehiclesData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["/api/admin/promo/vehicles"],
    enabled: !!user,
  });
  
  // Assicurati che promoVehicles sia sempre un array
  const promoVehicles = Array.isArray(promoVehiclesData) ? promoVehiclesData : [];

  // Caricamento di tutti i veicoli
  const { data: allVehicles = [] } = useQuery({
    queryKey: ["/api/admin/vehicles"],
    enabled: !!user,
  });

  // Impostazione stato iniziale
  useEffect(() => {
    if (promoSettings) {
      setMaxVehicles(promoSettings.maxFeaturedVehicles);
    }
  }, [promoSettings]);

  // Filtraggio dei veicoli disponibili (non già in promozione)
  useEffect(() => {
    if (allVehicles && promoVehicles) {
      const promoIds = promoVehicles.map((v: PromoVehicle) => v.id);
      
      // Filtra per veicoli non già in promozione e che hanno il termine di ricerca nel titolo
      const filtered = allVehicles
        .filter((vehicle: any) => !promoIds.includes(vehicle.id))
        .filter((vehicle: any) => {
          if (!searchTerm) return true;
          
          const lowercaseSearch = searchTerm.toLowerCase();
          return (
            vehicle.title.toLowerCase().includes(lowercaseSearch) ||
            vehicle.model.toLowerCase().includes(lowercaseSearch)
          );
        });
      
      setAvailableVehicles(filtered);
    }
  }, [allVehicles, promoVehicles, searchTerm]);

  // Mutazioni per la gestione dello stato
  
  // Aggiornamento dell'ordine dei veicoli
  const updateOrderMutation = useMutation({
    mutationFn: async (items: { vehicleId: number, displayOrder: number }[]) => {
      const res = await apiRequest("PUT", "/api/admin/promo/order", { promos: items });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/featured"] });
      toast({
        title: "Ordine aggiornato",
        description: "L'ordine delle promozioni è stato aggiornato con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'ordine delle promozioni.",
        variant: "destructive",
      });
    },
  });

  // Rimozione di un veicolo dalla promozione
  const removeVehicleMutation = useMutation({
    mutationFn: async (vehicleId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/promo/vehicles/${vehicleId}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/featured"] });
      toast({
        title: "Veicolo rimosso",
        description: "Il veicolo è stato rimosso dalle promozioni.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: "Impossibile rimuovere il veicolo dalle promozioni.",
        variant: "destructive",
      });
    },
  });

  // Aggiunta di un veicolo alla promozione
  const addVehicleMutation = useMutation({
    mutationFn: async (vehicleId: number) => {
      const res = await apiRequest("POST", `/api/admin/promo/vehicles/${vehicleId}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/featured"] });
      toast({
        title: "Veicolo aggiunto",
        description: "Il veicolo è stato aggiunto alle promozioni.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: "Impossibile aggiungere il veicolo alle promozioni.",
        variant: "destructive",
      });
    },
  });

  // Aggiornamento delle impostazioni
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: { maxFeaturedVehicles: number }) => {
      const res = await apiRequest("PUT", "/api/admin/promo/settings", settings);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo/settings"] });
      toast({
        title: "Impostazioni aggiornate",
        description: "Le impostazioni delle promozioni sono state aggiornate con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare le impostazioni delle promozioni.",
        variant: "destructive",
      });
    },
  });

  // Gestione eventi drag and drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = promoVehicles.findIndex((v: PromoVehicle) => v.id === active.id);
      const newIndex = promoVehicles.findIndex((v: PromoVehicle) => v.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(promoVehicles, oldIndex, newIndex);
        
        // Crea un array di oggetti con l'ordine aggiornato
        const orderUpdates = newItems.map((vehicle: PromoVehicle, index: number) => ({
          vehicleId: vehicle.id,
          displayOrder: index
        }));
        
        // Invia l'aggiornamento dell'ordine
        updateOrderMutation.mutate(orderUpdates);
      }
    }
  };

  // Rimuovi un veicolo dalla promozione
  const handleRemoveVehicle = (id: number) => {
    removeVehicleMutation.mutate(id);
  };

  // Aggiungi un veicolo alla promozione
  const handleAddVehicle = (id: number) => {
    addVehicleMutation.mutate(id);
  };

  // Aggiorna il numero massimo di veicoli visualizzati
  const handleUpdateSettings = () => {
    updateSettingsMutation.mutate({ maxFeaturedVehicles: maxVehicles });
  };

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Gestione Promozioni</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colonna sinistra: veicoli in promozione */}
            <div>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Veicoli in Promozione</h2>
                  <p className="text-sm text-gray-500 mb-2">
                    Trascina gli elementi per modificare l'ordine in cui appaiono nell'homepage.
                  </p>
                  
                  <div className="flex items-center space-x-2 mb-6">
                    <Label htmlFor="maxVehicles" className="whitespace-nowrap">
                      Numero massimo:
                    </Label>
                    <Input
                      id="maxVehicles"
                      type="number"
                      value={maxVehicles}
                      onChange={(e) => setMaxVehicles(parseInt(e.target.value))}
                      className="w-20"
                      min={1}
                      max={50}
                    />
                    <Button 
                      onClick={handleUpdateSettings}
                      size="sm"
                      disabled={updateSettingsMutation.isPending}
                    >
                      <Save size={16} className="mr-1" />
                      Salva
                    </Button>
                  </div>
                  
                  {isLoading ? (
                    <div className="py-8 text-center text-gray-500">Caricamento...</div>
                  ) : isError ? (
                    <div className="py-8 text-center text-red-500">
                      Errore nel caricamento dei veicoli in promozione
                    </div>
                  ) : promoVehicles.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      Nessun veicolo in promozione. Aggiungi veicoli dal pannello a destra.
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={promoVehicles.map((v: PromoVehicle) => v.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {promoVehicles.map((vehicle: PromoVehicle) => (
                            <SortableVehicleItem
                              key={vehicle.id}
                              vehicle={vehicle}
                              onRemove={handleRemoveVehicle}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Colonna destra: veicoli disponibili */}
            <div>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Veicoli Disponibili</h2>
                  
                  <div className="mb-4">
                    <Input
                      placeholder="Cerca veicoli..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  {availableVehicles.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      {searchTerm 
                        ? "Nessun veicolo trovato con questi criteri di ricerca." 
                        : "Tutti i veicoli sono già in promozione."}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                      {availableVehicles.map((vehicle) => (
                        <div
                          key={vehicle.id}
                          className="bg-white rounded-lg border p-4 flex items-center"
                        >
                          <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded">
                            {vehicle.mainImage ? (
                              <img
                                src={vehicle.mainImage}
                                alt={vehicle.title}
                                className="w-16 h-16 object-cover rounded"
                              />
                            ) : (
                              <div className="w-16 h-16 flex items-center justify-center text-gray-400">
                                No img
                              </div>
                            )}
                          </div>
                          
                          <div className="ml-4 flex-1">
                            <h3 className="font-medium text-gray-900">{vehicle.title}</h3>
                            <p className="text-sm text-gray-500">{vehicle.model} • {vehicle.color}</p>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            onClick={() => handleAddVehicle(vehicle.id)}
                            disabled={addVehicleMutation.isPending}
                          >
                            <Plus size={16} className="mr-1" />
                            Aggiungi
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}