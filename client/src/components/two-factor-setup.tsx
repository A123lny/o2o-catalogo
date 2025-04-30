import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { CopyIcon, CheckIcon, LockIcon, ShieldCheckIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface TwoFactorSetupProps {
  isFirstLogin?: boolean;
  onComplete?: () => void;
}

export function TwoFactorSetup({ isFirstLogin = false, onComplete }: TwoFactorSetupProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [step, setStep] = useState(1); // 1: Setup, 2: Verify, 3: Backup codes
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Controlla se l'utente ha già configurato 2FA
  useEffect(() => {
    const check2FAStatus = async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/2fa/status');
        if (response.ok) {
          const data = await response.json();
          if (data.isEnabled && data.isVerified) {
            setVerified(true);
          }
        }
      } catch (error) {
        console.error('Error checking 2FA status:', error);
      }
    };

    if (user) {
      check2FAStatus();
    }
  }, [user]);

  // Genera la configurazione 2FA (codice QR e secret)
  const generateSetup = async () => {
    try {
      const response = await apiRequest('POST', '/api/auth/2fa/setup');
      
      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setBackupCodes(data.backupCodes);
        setStep(2);
      } else {
        const error = await response.text();
        toast({
          title: "Errore nella configurazione 2FA",
          description: error || "Si è verificato un errore durante la configurazione del 2FA",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      toast({
        title: "Errore di connessione",
        description: "Impossibile contattare il server. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  // Verifica codice 2FA
  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Codice non valido",
        description: "Inserisci un codice di verifica valido a 6 cifre",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await apiRequest('POST', '/api/auth/2fa/verify', { token: verificationCode });
      
      if (response.ok) {
        setVerified(true);
        setStep(3);
        toast({
          title: "Autenticazione a due fattori attivata",
          description: "La 2FA è stata configurata con successo",
          variant: "default",
        });
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

  // Disabilita 2FA
  const disable2FA = async () => {
    try {
      const response = await apiRequest('POST', '/api/auth/2fa/disable');
      
      if (response.ok) {
        setVerified(false);
        setQrCode(null);
        setSecret(null);
        setBackupCodes([]);
        setStep(1);
        toast({
          title: "2FA disattivata",
          description: "L'autenticazione a due fattori è stata disattivata",
          variant: "default",
        });
      } else {
        const error = await response.text();
        toast({
          title: "Errore nella disattivazione",
          description: error || "Si è verificato un errore durante la disattivazione del 2FA",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast({
        title: "Errore di connessione",
        description: "Impossibile contattare il server. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  // Copia codice di backup negli appunti
  const copyBackupCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
        toast({
          title: "Codice copiato",
          description: "Il codice di backup è stato copiato negli appunti",
          variant: "default",
        });
      })
      .catch((error) => {
        console.error('Error copying code:', error);
        toast({
          title: "Errore",
          description: "Impossibile copiare il codice negli appunti",
          variant: "destructive",
        });
      });
  };

  // Completa il processo di configurazione
  const completeSetup = () => {
    if (onComplete) onComplete();
    if (isFirstLogin) {
      // Potremmo reindirizzare o mostrare un messaggio speciale per il primo login
    }
  };

  if (verified) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-green-500" />
            Autenticazione a due fattori attiva
          </CardTitle>
          <CardDescription>
            L'autenticazione a due fattori è attiva sul tuo account per una maggiore sicurezza.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center gap-2 mb-2">
                <LockIcon className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-medium">Il tuo account è protetto</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Ogni accesso al tuo account richiederà l'inserimento di un codice temporaneo 
                generato dalla tua app di autenticazione, oltre alla password.
              </p>
            </div>
            
            <div>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setShowBackupCodes(!showBackupCodes)}
              >
                {showBackupCodes ? "Nascondi codici di backup" : "Mostra codici di backup"}
              </Button>
            </div>
            
            {showBackupCodes && backupCodes.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Codici di backup</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Conserva questi codici in un luogo sicuro. Potrai utilizzarli per accedere al tuo account 
                  nel caso in cui non avessi accesso al dispositivo con l'app di autenticazione.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, i) => (
                    <div 
                      key={i} 
                      className="flex items-center justify-between bg-muted rounded-md p-2"
                    >
                      <code className="text-xs font-mono">{code}</code>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => copyBackupCode(code, i)}
                      >
                        {copiedIndex === i ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="destructive" onClick={disable2FA} className="w-full">
            Disattiva 2FA
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (step === 1) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Configurazione 2FA</CardTitle>
          <CardDescription>
            L'autenticazione a due fattori aggiunge un ulteriore livello di sicurezza al tuo account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm mb-2 font-medium">Come funziona?</p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Scarica un'app di autenticazione (Google Authenticator, Microsoft Authenticator, Authy, ecc.)</li>
                <li>Scansiona il codice QR con l'app</li>
                <li>Inserisci il codice a 6 cifre generato dall'app per verificare la configurazione</li>
                <li>Salva i codici di backup in un luogo sicuro</li>
              </ol>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={generateSetup} className="w-full">
            Configura 2FA
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (step === 2) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Scansiona il codice QR</CardTitle>
          <CardDescription>
            Usa l'app di autenticazione per scansionare il codice QR o inserisci manualmente il codice segreto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {qrCode && (
              <div className="flex justify-center">
                <div 
                  className="p-4 bg-white rounded-lg border"
                  dangerouslySetInnerHTML={{ __html: qrCode }}
                />
              </div>
            )}
            
            {secret && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Codice segreto (inserimento manuale):</p>
                <div className="flex">
                  <code className="bg-muted p-2 rounded flex-1 text-xs font-mono overflow-x-auto">
                    {secret}
                  </code>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="ml-2"
                    onClick={() => {
                      navigator.clipboard.writeText(secret);
                      toast({
                        title: "Codice copiato",
                        description: "Il codice segreto è stato copiato negli appunti",
                        variant: "default",
                      });
                    }}
                  >
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="verificationCode">Inserisci il codice di verifica</Label>
              <Input
                id="verificationCode"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="font-mono"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            onClick={verifyCode} 
            disabled={isVerifying || verificationCode.length !== 6} 
            className="w-full"
          >
            {isVerifying ? "Verifica in corso..." : "Verifica codice"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setStep(1)} 
            className="w-full"
          >
            Indietro
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (step === 3) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-green-500" />
            2FA configurata con successo
          </CardTitle>
          <CardDescription>
            Salva questi codici di backup in un luogo sicuro. Potrai utilizzarli se perdi l'accesso al tuo dispositivo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ogni codice può essere utilizzato una sola volta. Una volta utilizzato un codice di backup, 
              verrà invalidato automaticamente.
            </p>
            
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between bg-muted rounded-md p-2"
                >
                  <code className="text-xs font-mono">{code}</code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => copyBackupCode(code, i)}
                  >
                    {copiedIndex === i ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={completeSetup} className="w-full">
            Ho salvato i codici di backup
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return null;
}