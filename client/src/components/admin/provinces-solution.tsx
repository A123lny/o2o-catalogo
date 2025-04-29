import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Tipo minimale per la provincia
type Province = {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
};

export function ProvincesSolution() {
  const { toast } = useToast();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Funzione per caricare le province
  const loadProvinces = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/provinces');
      if (response.ok) {
        const data = await response.json();
        setProvinces(data);
      }
    } catch (error) {
      console.error("Errore nel caricamento delle province:", error);
    } finally {
      setLoading(false);
    }
  };

  // Carica le province all'inizio
  useEffect(() => {
    loadProvinces();
  }, []);

  // Funzione per aggiornare lo stato di una provincia
  const updateProvince = async (id: number, isActive: boolean) => {
    const updated = provinces.map(p => 
      p.id === id ? { ...p, isActive } : p
    );
    setProvinces(updated);
    
    try {
      await fetch('/api/admin/provinces/update-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id], isActive }),
      });
    } catch (error) {
      console.error("Errore nell'aggiornamento della provincia:", error);
      // Se c'è un errore, torna indietro
      loadProvinces();
    }
  };

  // Funzione per salvare tutte le modifiche
  const saveChanges = async () => {
    setSaving(true);
    try {
      await Promise.all(
        provinces.map(p => 
          fetch('/api/admin/provinces/update-status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: [p.id], isActive: p.isActive }),
          })
        )
      );
      toast({
        title: "Province aggiornate",
        description: "Le modifiche sono state salvate con successo."
      });
    } catch (error) {
      console.error("Errore nel salvataggio delle province:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore nel salvataggio.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestione Province</CardTitle>
        <CardDescription>
          Attiva o disattiva le province che possono essere selezionate dai clienti
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="mb-4">
              <Button onClick={saveChanges} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : "Salva modifiche"}
              </Button>
            </div>
            
            <div className="border rounded-md p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {provinces.map(province => (
                  <div 
                    key={province.id} 
                    className="flex items-center space-x-2 p-2 border rounded"
                  >
                    <Checkbox 
                      id={`province-${province.id}`}
                      checked={province.isActive}
                      onCheckedChange={(checked) => {
                        updateProvince(province.id, checked === true);
                      }}
                    />
                    <label 
                      htmlFor={`province-${province.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {province.name} ({province.code})
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}