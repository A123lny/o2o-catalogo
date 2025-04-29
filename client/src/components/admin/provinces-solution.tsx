import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Componente estremamente semplice senza funzionalità React complesse
export function ProvincesSolution() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestione Province</CardTitle>
        <CardDescription>
          Attiva o disattiva le province che possono essere selezionate dai clienti
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          Le province attive appariranno nel modulo di richiesta informazioni.
          Per attivare o disattivare le province, utilizza il database direttamente.
        </p>
        
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-amber-800">
            La funzionalità di gestione province richiede un aggiornamento. 
            Sarà di nuovo disponibile a breve.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}