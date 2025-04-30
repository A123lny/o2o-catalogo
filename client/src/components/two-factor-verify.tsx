import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LockIcon, KeyIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface TwoFactorVerifyProps {
  userId: number;
  onVerified: () => void;
  onCancel: () => void;
}

export function TwoFactorVerify({ userId, onVerified, onCancel }: TwoFactorVerifyProps) {
  const { toast } = useToast();
  const { verifyTwoFactorMutation } = useAuth();
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [isUsingBackupCode, setIsUsingBackupCode] = useState(false);

  // Verifica codice 2FA
  const verifyCode = () => {
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

    // Utilizziamo la mutation del context per verificare il codice
    verifyTwoFactorMutation.mutate({
      userId,
      token: isUsingBackupCode ? backupCode : verificationCode,
      isBackupCode: isUsingBackupCode
    }, {
      onSuccess: () => {
        onVerified();
      }
    });
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
          disabled={verifyTwoFactorMutation.isPending || (isUsingBackupCode ? backupCode.length < 8 : verificationCode.length !== 6)}
        >
          {verifyTwoFactorMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifica in corso...
            </>
          ) : (
            "Verifica"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}