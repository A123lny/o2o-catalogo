import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, KeyRound, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TwoFactorVerifyProps {
  username: string;
  onSuccess: (userData: any) => void;
  onCancel: () => void;
}

export function TwoFactorVerify({ username, onSuccess, onCancel }: TwoFactorVerifyProps) {
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Invia il token 2FA per verifica
  const verifyMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest("POST", "/api/two-factor/verify", { 
        username, 
        token 
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore durante la verifica");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        // Se è stato usato un codice di backup, mostra una notifica
        if (data.isBackupCodeUsed) {
          toast({
            title: "Codice di backup utilizzato",
            description: `Hai utilizzato uno dei tuoi codici di backup. Ti restano ${data.remainingBackupCodes} codici.`,
            variant: "default",
          });
        }
        
        // Comunica il successo al componente parent
        onSuccess(data.user);
      } else {
        setError("Verifica fallita. Riprova.");
      }
    },
    onError: (error: Error) => {
      setError(error.message || "Codice di verifica non valido");
    },
  });

  // Gestisce l'invio del token
  const handleSubmitToken = () => {
    setError(null);
    
    if (!token || token.length < 6) {
      setError("Inserisci un codice a 6 cifre valido");
      return;
    }
    
    verifyMutation.mutate(token);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Verifica a due fattori
        </CardTitle>
        <CardDescription>
          Inserisci il codice a 6 cifre mostrato nella tua app di autenticazione
          o utilizza un codice di backup.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Codice di verifica</Label>
            <Input
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="text-center text-xl tracking-widest"
              maxLength={6}
              autoFocus
              autoComplete="one-time-code"
            />
            <p className="text-xs text-muted-foreground">
              Puoi anche utilizzare un codice di backup se ne hai uno disponibile.
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Indietro
        </Button>
        <Button onClick={handleSubmitToken} disabled={verifyMutation.isPending}>
          {verifyMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Verifica
        </Button>
      </CardFooter>
    </Card>
  );
}