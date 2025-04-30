import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TwoFactorVerifyProps {
  username: string;
  onVerified: (userData: any) => void;
  onCancel: () => void;
}

export function TwoFactorVerify({ username, onVerified, onCancel }: TwoFactorVerifyProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Il codice di verifica deve essere di 6 cifre');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const res = await apiRequest('POST', '/api/2fa/login', { 
        username, 
        token: verificationCode 
      });
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: 'Autenticazione completata',
          description: 'Autenticazione a due fattori verificata con successo.',
        });
        
        onVerified(data.user);
      } else {
        setError(data.message || 'Codice di verifica non valido');
      }
    } catch (err) {
      toast({
        title: 'Errore',
        description: 'Non è stato possibile verificare il codice.',
        variant: 'destructive'
      });
      console.error(err);
      setError('Si è verificato un errore durante la verifica');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && verificationCode.length === 6) {
      handleVerifyCode();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Verifica a due fattori</CardTitle>
        <CardDescription>
          Inserisci il codice a 6 cifre dalla tua app di autenticazione per completare l'accesso.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="123456"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
              onKeyDown={handleKeyDown}
              className="text-center text-lg tracking-widest"
              autoFocus
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
          
          <p className="text-sm text-muted-foreground">
            Apri la tua app di autenticazione sul tuo dispositivo mobile per visualizzare il codice di autenticazione.
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Indietro
        </Button>
        <Button 
          onClick={handleVerifyCode} 
          disabled={isLoading || verificationCode.length !== 6}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verifica
        </Button>
      </CardFooter>
    </Card>
  );
}