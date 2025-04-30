import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { CopyIcon, CheckIcon, ShieldCheckIcon, ArrowLeft, Loader2 } from 'lucide-react';

export default function TwoFactorSetupPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [step, setStep] = useState(1); // 1: Genera QR, 2: Verifica, 3: Backup codes
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Verifica se l'utente è autenticato
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else {
      generateSetup();
    }
  }, [user, navigate]);

  // Genera la configurazione 2FA
  const generateSetup = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/2fa/setup');
      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setStep(2);
      } else {
        toast({
          title: "Errore",
          description: "Impossibile generare la configurazione 2FA. Riprova più tardi.",
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
      const response = await apiRequest('POST', '/api/auth/2fa/verify', {
        token: verificationCode,
      });
      
      if (response.ok) {
        const data = await response.json();
        setBackupCodes(data.backupCodes || []);
        setStep(3);
      } else {
        toast({
          title: "Codice non valido",
          description: "Il codice inserito non è valido. Assicurati di inserire il codice mostrato nell'app di autenticazione.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la verifica del codice. Riprova più tardi.",
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
  };

  // Completa la configurazione
  const completeSetup = () => {
    toast({
      title: "2FA attivato",
      description: "L'autenticazione a due fattori è stata attivata con successo.",
    });
    
    navigate('/admin/settings');
  };

  return (
    <div className="flex h-screen bg-neutral-100">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader user={user} />
        
        <main className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/settings')}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Torna alle impostazioni
            </Button>
            
            <h1 className="text-2xl font-bold text-neutral-800">Configurazione 2FA</h1>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>
                  {step === 1 && "Configurazione autenticazione a due fattori"}
                  {step === 2 && "Scansiona il codice QR"}
                  {step === 3 && (
                    <div className="flex items-center gap-2">
                      <ShieldCheckIcon className="h-5 w-5 text-green-500" />
                      2FA configurata con successo
                    </div>
                  )}
                </CardTitle>
                <CardDescription>
                  {step === 1 && "Configura l'autenticazione a due fattori per aumentare la sicurezza del tuo account."}
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
                      onClick={() => navigate('/admin/settings')}
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
        </main>
      </div>
    </div>
  );
}