import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { LockIcon, KeyIcon } from 'lucide-react';

interface TwoFactorVerifyProps {
  userId: number;
  onVerified: () => void;
  onCancel: () => void;
}

export function TwoFactorVerify({ userId, onVerified, onCancel }: TwoFactorVerifyProps) {
  const { toast } = useToast();
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [isUsingBackupCode, setIsUsingBackupCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Verifica codice 2FA
  const verifyCode = async () => {
    if (isUsingBackupCode) {
      if (backupCode.length < 8) {
        toast({
          title: "Codice non valido",
          description: "Inserisci un codice di backup valido",
          variant: "destructive",
        });
        return;
      }
    } else if (verificationCode.length !== 6) {
      toast({
        title: "Codice non valido",
        description: "Inserisci un codice di verifica valido a 6 cifre",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const endpoint = isUsingBackupCode 
        ? '/api/auth/2fa/verify-backup' 
        : '/api/auth/2fa/verify';

      const payload = isUsingBackupCode
        ? { userId, code: backupCode }
        : { userId, token: verificationCode };

      const response = await apiRequest('POST', endpoint, payload);
      
      if (response.ok) {
        toast({
          title: "Verifica completata",
          description: "Autenticazione a due fattori completata con successo",
          variant: "default",
        });
        onVerified();
      } else {
        const error = await response.text();
        toast({
          title: "Codice non valido",
          description: error || "Il codice inserito non è valido. Riprova.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      toast({
        title: "Errore di connessione",
        description: "Impossibile contattare il server. Riprova più tardi.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const toggleBackupCode = () => {
    setIsUsingBackupCode(!isUsingBackupCode);
    setVerificationCode('');
    setBackupCode('');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LockIcon className="h-5 w-5" />
          Verifica autenticazione a due fattori
        </CardTitle>
        <CardDescription>
          {isUsingBackupCode 
            ? "Inserisci un codice di backup per completare l'accesso"
            : "Inserisci il codice dalla tua app di autenticazione"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isUsingBackupCode ? (
            <div className="space-y-2">
              <Label htmlFor="backupCode">Codice di backup</Label>
              <Input
                id="backupCode"
                placeholder="xxxxxxxx"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.trim())}
                className="font-mono"
                autoFocus
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="verificationCode">Codice di verifica</Label>
              <div className="flex items-center gap-2">
                <KeyIcon className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="verificationCode"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="font-mono"
                  autoFocus
                />
              </div>
            </div>
          )}
          
          <div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-sm" 
              onClick={toggleBackupCode}
            >
              {isUsingBackupCode 
                ? "Torna al codice di verifica" 
                : "Utilizza un codice di backup"}
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onCancel}
        >
          Annulla
        </Button>
        <Button 
          onClick={verifyCode} 
          disabled={isVerifying || (isUsingBackupCode ? backupCode.length < 8 : verificationCode.length !== 6)}
        >
          {isVerifying ? "Verifica in corso..." : "Verifica"}
        </Button>
      </CardFooter>
    </Card>
  );
}