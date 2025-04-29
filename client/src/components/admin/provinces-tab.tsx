import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  FormLabel, 
  FormDescription 
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Save, Trash2, RefreshCw } from "lucide-react";

// Schema per la validazione delle province
const provinceSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Il nome della provincia è obbligatorio"),
  code: z.string().min(2, "Il codice provincia è obbligatorio").max(2, "Il codice provincia deve essere di 2 caratteri"),
  isActive: z.boolean().default(true),
  displayOrder: z.number().optional(),
});

type ProvinceValues = z.infer<typeof provinceSchema>;

// Definizione del tipo Province
interface Province {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  displayOrder: number;
}

export default function ProvincesTab() {
  const { toast } = useToast();
  const [newProvince, setNewProvince] = useState<ProvinceValues>({ 
    name: "", 
    code: "", 
    isActive: true 
  });
  const [selectedProvinces, setSelectedProvinces] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch province
  const { 
    data: provinces = [], 
    isLoading,
    refetch 
  } = useQuery<Province[]>({
    queryKey: ['/api/admin/provinces'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/provinces');
        if (!response.ok) {
          throw new Error('Errore nel recupero delle province');
        }
        return await response.json();
      } catch (error) {
        console.error("Errore nel caricamento delle province:", error);
        toast({
          title: "Errore",
          description: "Impossibile caricare le province. Riprova più tardi.",
          variant: "destructive",
        });
        return [];
      }
    }
  });

  // Aggiungi provincia
  const addProvince = useMutation({
    mutationFn: async (data: ProvinceValues) => {
      setIsSubmitting(true);
      const response = await fetch('/api/admin/provinces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Errore durante l\'aggiunta della provincia');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Provincia aggiunta",
        description: "La provincia è stata aggiunta con successo.",
      });
      refetch();
      setNewProvince({ name: "", code: "", isActive: true });
      setIsSubmitting(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'aggiunta della provincia.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Elimina provincia
  const deleteProvince = useMutation({
    mutationFn: async (id: number) => {
      setIsSubmitting(true);
      const response = await fetch(`/api/admin/provinces/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Errore durante l\'eliminazione della provincia');
      }
      
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Provincia eliminata",
        description: "La provincia è stata eliminata con successo.",
      });
      refetch();
      setSelectedProvinces([]);
      setIsSubmitting(false);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione della provincia.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Aggiorna stato province
  const updateProvinceStatus = useMutation({
    mutationFn: async ({ ids, isActive }: { ids: number[], isActive: boolean }) => {
      setIsSubmitting(true);
      const response = await fetch('/api/admin/provinces/update-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids, isActive }),
      });
      
      if (!response.ok) {
        throw new Error('Errore durante l\'aggiornamento dello stato delle province');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Stato province aggiornato",
        description: "Lo stato delle province selezionate è stato aggiornato con successo.",
      });
      refetch();
      setSelectedProvinces([]);
      setIsSubmitting(false);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento dello stato delle province.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Handler per selezionare/deselezionare una provincia
  const handleSelectProvince = (id: number, isChecked: boolean) => {
    if (isChecked) {
      setSelectedProvinces(prev => [...prev, id]);
    } else {
      setSelectedProvinces(prev => prev.filter(provinceId => provinceId !== id));
    }
  };

  // Handler per selezionare/deselezionare tutte le province
  const handleSelectAllProvinces = (isChecked: boolean) => {
    if (isChecked && provinces.length > 0) {
      setSelectedProvinces(provinces.map(province => province.id));
    } else {
      setSelectedProvinces([]);
    }
  };

  // Handler per attivare province selezionate
  const handleActivateProvinces = () => {
    if (selectedProvinces.length === 0) {
      toast({
        title: "Nessuna provincia selezionata",
        description: "Seleziona almeno una provincia da attivare.",
        variant: "destructive",
      });
      return;
    }
    
    updateProvinceStatus.mutate({ ids: selectedProvinces, isActive: true });
  };

  // Handler per disattivare province selezionate
  const handleDeactivateProvinces = () => {
    if (selectedProvinces.length === 0) {
      toast({
        title: "Nessuna provincia selezionata",
        description: "Seleziona almeno una provincia da disattivare.",
        variant: "destructive",
      });
      return;
    }
    
    updateProvinceStatus.mutate({ ids: selectedProvinces, isActive: false });
  };

  // Handler per eliminare una provincia
  const handleDeleteProvince = (id: number) => {
    if (window.confirm('Sei sicuro di voler eliminare questa provincia?')) {
      deleteProvince.mutate(id);
    }
  };

  // Handler per l'invio del form di aggiunta provincia
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validazione
    if (!newProvince.name || !newProvince.code) {
      toast({
        title: "Campi obbligatori mancanti",
        description: "Compila tutti i campi obbligatori.",
        variant: "destructive",
      });
      return;
    }
    
    if (newProvince.code.length !== 2) {
      toast({
        title: "Codice provincia non valido",
        description: "Il codice provincia deve essere di 2 caratteri.",
        variant: "destructive",
      });
      return;
    }
    
    addProvince.mutate(newProvince);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Form Aggiungi Provincia */}
      <Card>
        <CardHeader>
          <CardTitle>Aggiungi Provincia</CardTitle>
          <CardDescription>
            Aggiungi una nuova provincia al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <FormLabel htmlFor="province-name">Nome Provincia</FormLabel>
              <Input 
                id="province-name"
                placeholder="Es. Milano" 
                value={newProvince.name} 
                onChange={(e) => setNewProvince({...newProvince, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <FormLabel htmlFor="province-code">Codice Provincia</FormLabel>
              <Input 
                id="province-code"
                placeholder="Es. MI" 
                maxLength={2}
                value={newProvince.code} 
                onChange={(e) => setNewProvince({...newProvince, code: e.target.value.toUpperCase()})}
              />
              <FormDescription>
                Il codice deve essere di 2 caratteri (es. MI per Milano)
              </FormDescription>
            </div>
            
            <div className="flex items-center space-x-2 py-2">
              <Checkbox 
                id="province-active" 
                checked={newProvince.isActive}
                onCheckedChange={(checked) => setNewProvince({...newProvince, isActive: checked === true})}
              />
              <FormLabel htmlFor="province-active" className="cursor-pointer font-normal">
                Provincia attiva
              </FormLabel>
            </div>
            
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvataggio...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Aggiungi
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Gestione Province */}
      <Card>
        <CardHeader>
          <CardTitle>Gestione Province</CardTitle>
          <CardDescription>
            Gestisci le province attualmente nel sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            <Button 
              variant="default" 
              onClick={handleActivateProvinces} 
              size="sm" 
              disabled={isSubmitting || selectedProvinces.length === 0}
            >
              Attiva selezionate
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDeactivateProvinces} 
              size="sm" 
              disabled={isSubmitting || selectedProvinces.length === 0}
            >
              Disattiva selezionate
            </Button>
            <Button 
              variant="ghost"
              onClick={() => refetch()}
              size="sm"
              disabled={isSubmitting}
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Aggiorna
            </Button>
          </div>
          
          {isLoading ? (
            <div className="w-full py-10 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : provinces.length === 0 ? (
            <div className="text-center py-8 border rounded-md">
              Nessuna provincia trovata
            </div>
          ) : (
            <div className="border rounded-md overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={provinces.length > 0 && selectedProvinces.length === provinces.length} 
                        onCheckedChange={(checked) => handleSelectAllProvinces(checked === true)}
                      />
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Codice</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead className="w-12">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {provinces.map((province) => (
                    <TableRow key={province.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedProvinces.includes(province.id)} 
                          onCheckedChange={(checked) => handleSelectProvince(province.id, checked === true)}
                        />
                      </TableCell>
                      <TableCell>{province.name}</TableCell>
                      <TableCell>{province.code}</TableCell>
                      <TableCell>
                        {province.isActive ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                            Attiva
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">
                            Disattiva
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDeleteProvince(province.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}