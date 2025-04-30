import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Copy as CopyIcon, Check as CheckIcon, ShieldCheck, Loader2 } from "lucide-react";

export default function TwoFactorSetupNew() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [step, setStep] = useState(1);
  const [secret, setSecret] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Al caricamento, avvia la generazione della configurazione
  useEffect(() => {
    if (user) {
      generateSetup();
    } else {
      setLocation('/login');
    }
  }, [user, setLocation]);

  // Funzione per generare la configurazione 2FA
  const generateSetup = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log('2FA setup response status:', response.status);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log('2FA setup response data:', data);
          
          if (data && data.qrCode && data.secret) {
            setQrCode(data.qrCode);
            setSecret(data.secret);
            setStep(2);
          } else {
            console.error('Dati mancanti nella risposta:', data);
            toast({
              title: "Errore",
              description: "Risposta incompleta dal server. Riprova.",
              variant: "destructive",
            });
            
            if (retryCount < 2) {
              setRetryCount(prev => prev + 1);
              setTimeout(generateSetup, 1000);
            }
          }
        } else {
          console.error('Risposta non in formato JSON');
          const text = await response.text();
          console.log('Response text:', text);
          toast({
            title: "Errore",
            description: "Formato di risposta non valido. Contatta l'amministratore.",
            variant: "destructive",
          });
        }
      } else {
        console.error('Errore HTTP:', response.status);
        const errorText = await response.text();
        console.log('Error response:', errorText);
        
        toast({
          title: "Errore",
          description: `Impossibile generare la configurazione 2FA. Errore ${response.status}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la configurazione. Riprova più tardi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verifica codice inserito
  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) return;
    
    setIsVerifying(true);
    try {
      console.log('Invio codice di verifica:', verificationCode);
      
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationCode }),
        credentials: 'include'
      });
      
      console.log('Risposta verifica:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Dati verifica:', data);
        
        if (data && data.backupCodes && Array.isArray(data.backupCodes)) {
          setBackupCodes(data.backupCodes);
          setStep(3);
          toast({
            title: "Verifica completata",
            description: "Codice verificato con successo.",
          });
        } else {
          console.error('Dati backup mancanti:', data);
          toast({
            title: "Dati incompleti",
            description: "I codici di backup sono mancanti. Contatta l'amministratore.",
            variant: "destructive",
          });
        }
      } else {
        let message = "Codice non valido. Verifica di aver inserito il codice corretto.";
        
        try {
          const errorData = await response.json();
          console.error('Errore verifica:', errorData);
          if (errorData.message) {
            message = errorData.message;
          }
        } catch (e) {
          console.error('Impossibile leggere l\'errore come JSON:', e);
        }
        
        toast({
          title: "Verifica fallita",
          description: message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Errore durante la verifica:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la verifica. Riprova.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Copia il codice di backup
  const copyBackupCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    
    toast({
      title: "Codice copiato",
      description: "Il codice di backup è stato copiato negli appunti.",
    });
  };

  // Completa la configurazione
  const completeSetup = () => {
    toast({
      title: "2FA attivato",
      description: "L'autenticazione a due fattori è stata attivata con successo.",
    });
    
    setLocation('/admin/settings');
  };
  
  // Se manca il QR o il segreto dopo il caricamento, mostra errore
  const renderError = () => (
    <div className="text-center py-4">
      <p className="text-red-500 mb-4">Impossibile generare la configurazione 2FA. Riprova più tardi.</p>
      <Button onClick={() => setLocation('/admin/settings')} variant="outline">
        Torna alle impostazioni
      </Button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto mt-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/admin/settings')}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Torna alle impostazioni
        </Button>
        
        <h1 className="text-2xl font-bold text-neutral-800">Configurazione 2FA</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && "Configurazione autenticazione a due fattori"}
            {step === 2 && "Scansiona il codice QR"}
            {step === 3 && (
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                2FA configurata con successo
              </div>
            )}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Configurazione in corso..."}
            {step === 2 && "Usa l'app di autenticazione per scansionare il codice QR o inserisci manualmente il codice segreto."}
            {step === 3 && "Salva questi codici di backup in un luogo sicuro. Potrai utilizzarli se perdi l'accesso al tuo dispositivo."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 1 && (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {qrCode ? (
                <div className="flex justify-center">
                  <div 
                    className="p-4 bg-white rounded-lg border"
                    dangerouslySetInnerHTML={{ __html: qrCode }}
                  />
                </div>
              ) : renderError()}
              
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
          )}

          {step === 3 && (
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
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          {step === 2 && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/admin/settings')}
              >
                Annulla
              </Button>
              <Button 
                onClick={verifyCode} 
                disabled={isVerifying || verificationCode.length !== 6}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifica in corso...
                  </>
                ) : (
                  "Verifica codice"
                )}
              </Button>
            </>
          )}
          
          {step === 3 && (
            <Button 
              onClick={completeSetup} 
              className="ml-auto"
            >
              Ho salvato i codici di backup
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}