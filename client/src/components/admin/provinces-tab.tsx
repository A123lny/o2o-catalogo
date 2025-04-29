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
import { Loader2, Save } from "lucide-react";

// Schema per la validazione delle province
const provinceSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Il nome della provincia è obbligatorio"),
  code: z.string().min(2, "Il codice provincia è obbligatorio").max(2, "Il codice provincia deve essere di 2 caratteri"),
  isActive: z.boolean().default(true),
});

type ProvinceValues = z.infer<typeof provinceSchema>;

export default function ProvincesTab() {
  const { toast } = useToast();
  const [newProvince, setNewProvince] = useState<ProvinceValues>({ name: "", code: "", isActive: true });
  const [selectedProvinces, setSelectedProvinces] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch provinces
  const { data: provinces = [], isLoading: isLoadingProvinces } = useQuery({
    queryKey: ['/api/admin/provinces'],
    queryFn: async () => {
      const response = await fetch('/api/admin/provinces');
      if (!response.ok) throw new Error('Errore nel recupero delle province');
      return response.json();
    }
  });

  // Funzione per selezionare/deselezionare una provincia
  const handleSelectProvince = (id: number, isChecked: boolean) => {
    if (isChecked) {
      setSelectedProvinces(prev => [...prev, id]);
    } else {
      setSelectedProvinces(prev => prev.filter(provinceId => provinceId !== id));
    }
  };

  // Funzione per selezionare/deselezionare tutte le province
  const handleSelectAllProvinces = (isChecked: boolean) => {
    if (isChecked && provinces && provinces.length > 0) {
      const provinceIds = provinces.map((province: any) => province.id || 0).filter(id => id > 0);
      setSelectedProvinces(provinceIds);
    } else {
      setSelectedProvinces([]);
    }
  };

  // Mutation per aggiungere una provincia
  const addProvince = useMutation({
    mutationFn: async (data: ProvinceValues) => {
      setIsSubmitting(true);
      const response = await apiRequest('POST', '/api/admin/provinces', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Provincia aggiunta",
        description: "La provincia è stata aggiunta con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/provinces'] });
      setNewProvince({ name: "", code: "", isActive: true });
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiunta della provincia.",
        variant: "destructive",
      });
      console.error("Error adding province:", error);
      setIsSubmitting(false);
    }
  });

  // Mutation per aggiornare lo stato delle province
  const updateProvinceStatus = useMutation({
    mutationFn: async ({ ids, isActive }: { ids: number[], isActive: boolean }) => {
      setIsSubmitting(true);
      const response = await apiRequest('PUT', '/api/admin/provinces/update-status', { ids, isActive });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Stato province aggiornato",
        description: "Lo stato delle province selezionate è stato aggiornato con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/provinces'] });
      setSelectedProvinces([]);
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento dello stato delle province.",
        variant: "destructive",
      });
      console.error("Error updating province status:", error);
      setIsSubmitting(false);
    }
  });

  const handleActivateProvinces = () => {
    if (selectedProvinces.length === 0) {
      toast({
        title: "Selezione vuota",
        description: "Seleziona almeno una provincia.",
        variant: "destructive",
      });
      return;
    }
    
    updateProvinceStatus.mutate({ ids: selectedProvinces, isActive: true });
  };

  const handleDeactivateProvinces = () => {
    if (selectedProvinces.length === 0) {
      toast({
        title: "Selezione vuota",
        description: "Seleziona almeno una provincia.",
        variant: "destructive",
      });
      return;
    }
    
    updateProvinceStatus.mutate({ ids: selectedProvinces, isActive: false });
  };

  const onProvinceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvince.name || !newProvince.code) {
      toast({
        title: "Dati mancanti",
        description: "Inserisci nome e codice provincia.",
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
          <form onSubmit={onProvinceSubmit} className="space-y-4">
            <div className="space-y-2">
              <FormLabel>Nome Provincia</FormLabel>
              <Input 
                placeholder="Es. Milano" 
                value={newProvince.name} 
                onChange={(e) => setNewProvince({...newProvince, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <FormLabel>Codice Provincia</FormLabel>
              <Input 
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
              <FormLabel htmlFor="province-active" className="cursor-pointer">
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
          </div>
          
          {isLoadingProvinces ? (
            <div className="w-full py-10 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !provinces || provinces.length === 0 ? (
            <div className="text-center py-8 border rounded-md">
              Nessuna provincia trovata
            </div>
          ) : (
            <div className="border rounded-md">
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {provinces.map((province: any) => (
                    <TableRow key={province.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedProvinces.includes(province.id || 0)} 
                          onCheckedChange={(checked) => handleSelectProvince(province.id || 0, checked === true)}
                        />
                      </TableCell>
                      <TableCell>{province.name}</TableCell>
                      <TableCell>{province.code}</TableCell>
                      <TableCell>
                        {province.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Attiva
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Disattiva
                          </span>
                        )}
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