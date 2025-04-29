import { useState } from "react";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FormLabel, FormDescription } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Save, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Tipo per una provincia
interface Province {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  displayOrder?: number;
}

// Schema per la validazione
const provinceSchema = z.object({
  name: z.string().min(1, "Nome richiesto"),
  code: z.string().min(2, "Codice richiesto").max(2, "Massimo 2 caratteri"),
  isActive: z.boolean().default(true)
});

export function SimpleProvincesTab() {
  const { toast } = useToast();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [newProvince, setNewProvince] = useState({
    name: "",
    code: "",
    isActive: true
  });

  // Carica le province quando il componente viene montato
  useState(() => {
    fetchProvinces();
  });

  // Recupera le province dal server
  async function fetchProvinces() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/provinces");
      if (!response.ok) throw new Error("Errore nel caricamento province");
      const data = await response.json();
      setProvinces(data);
    } catch (error) {
      console.error("Errore nel caricamento province:", error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le province",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  // Aggiunge una nuova provincia
  async function addProvince(e: React.FormEvent) {
    e.preventDefault();
    
    // Validazione
    if (!newProvince.name || !newProvince.code || newProvince.code.length !== 2) {
      toast({
        title: "Errore",
        description: "Completa tutti i campi correttamente",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/provinces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newProvince)
      });
      
      if (!response.ok) throw new Error("Errore nell'aggiunta della provincia");
      
      toast({
        title: "Successo",
        description: "Provincia aggiunta con successo"
      });
      
      // Reset form e aggiorna lista
      setNewProvince({ name: "", code: "", isActive: true });
      fetchProvinces();
    } catch (error) {
      console.error("Errore nell'aggiunta provincia:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiungere la provincia",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Aggiorna lo stato di più province
  async function updateStatus(isActive: boolean) {
    if (selectedIds.length === 0) {
      toast({
        title: "Attenzione",
        description: "Seleziona almeno una provincia",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/provinces/update-status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ids: selectedIds, isActive })
      });
      
      if (!response.ok) throw new Error("Errore nell'aggiornamento dello stato");
      
      toast({
        title: "Successo",
        description: `Province ${isActive ? "attivate" : "disattivate"} con successo`
      });
      
      // Reset selezione e aggiorna lista
      setSelectedIds([]);
      fetchProvinces();
    } catch (error) {
      console.error("Errore nell'aggiornamento stato:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare lo stato delle province",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Elimina una provincia
  async function deleteProvince(id: number) {
    if (!window.confirm("Sei sicuro di voler eliminare questa provincia?")) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/provinces/${id}`, {
        method: "DELETE"
      });
      
      if (!response.ok) throw new Error("Errore nell'eliminazione della provincia");
      
      toast({
        title: "Successo",
        description: "Provincia eliminata con successo"
      });
      
      // Aggiorna lista
      fetchProvinces();
    } catch (error) {
      console.error("Errore nell'eliminazione provincia:", error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare la provincia",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Gestione selezione province
  function toggleSelect(id: number, selected: boolean) {
    if (selected) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  }

  // Gestione selezione/deselezione di tutte le province
  function toggleSelectAll(selected: boolean) {
    if (selected) {
      setSelectedIds(provinces.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  }

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
          <form onSubmit={addProvince} className="space-y-4">
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
            
            <Button type="submit" disabled={submitting}>
              {submitting ? (
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
              onClick={() => updateStatus(true)} 
              size="sm" 
              disabled={submitting || selectedIds.length === 0}
            >
              Attiva selezionate
            </Button>
            <Button 
              variant="outline" 
              onClick={() => updateStatus(false)} 
              size="sm" 
              disabled={submitting || selectedIds.length === 0}
            >
              Disattiva selezionate
            </Button>
            <Button 
              variant="ghost"
              onClick={fetchProvinces}
              size="sm"
              disabled={submitting}
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Aggiorna
            </Button>
          </div>
          
          {loading ? (
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
                        checked={provinces.length > 0 && selectedIds.length === provinces.length} 
                        onCheckedChange={(checked) => toggleSelectAll(checked === true)}
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
                          checked={selectedIds.includes(province.id)} 
                          onCheckedChange={(checked) => toggleSelect(province.id, checked === true)}
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
                          onClick={() => deleteProvince(province.id)}
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