import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface TwoFactorSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'qrcode' | 'verify'>('intro');
  const [isLoading, setIsLoading] = useState(false);
  const [setupData, setSetupData] = useState<{
    qrCodeDataUrl: string;
    secret: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');

  const handleStartSetup = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await apiRequest('POST', '/api/2fa/setup');
      const data = await res.json();
      
      setSetupData({
        qrCodeDataUrl: data.qrCodeDataUrl,
        secret: data.secret
      });
      
      setStep('qrcode');
    } catch (err) {
      toast({
        title: 'Errore',
        description: 'Non è stato possibile configurare l\'autenticazione a due fattori.',
        variant: 'destructive'
      });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Il codice di verifica deve essere di 6 cifre');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const res = await apiRequest('POST', '/api/2fa/verify', { token: verificationCode });
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: 'Configurazione completata',
          description: 'L\'autenticazione a due fattori è stata abilitata con successo.',
        });
        
        onComplete();
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <Tabs value={step} onValueChange={(value) => setStep(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="intro" disabled={isLoading}>Introduzione</TabsTrigger>
          <TabsTrigger value="qrcode" disabled={!setupData || isLoading}>Scansione QR</TabsTrigger>
          <TabsTrigger value="verify" disabled={!setupData || isLoading}>Verifica</TabsTrigger>
        </TabsList>
        
        <TabsContent value="intro">
          <CardHeader>
            <CardTitle>Configura l'autenticazione a due fattori</CardTitle>
            <CardDescription>
              L'autenticazione a due fattori aumenta la sicurezza del tuo account richiedendo un codice temporaneo oltre alla password.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p>Per configurare l'autenticazione a due fattori, avrai bisogno di un'app di autenticazione come:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Google Authenticator</li>
              <li>Microsoft Authenticator</li>
              <li>Authy</li>
            </ul>
            <p>Nei passaggi successivi, dovrai scansionare un codice QR con la tua app di autenticazione e inserire il codice generato dall'app per verificare la configurazione.</p>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={onCancel}>
              Annulla
            </Button>
            <Button onClick={handleStartSetup} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continua
            </Button>
          </CardFooter>
        </TabsContent>
        
        <TabsContent value="qrcode">
          <CardHeader>
            <CardTitle>Scansiona il codice QR</CardTitle>
            <CardDescription>
              Usa la tua app di autenticazione per scansionare questo codice QR.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 flex flex-col items-center">
            {setupData && (
              <>
                <div className="p-2 bg-white rounded-lg">
                  <img src={setupData.qrCodeDataUrl} alt="QR Code" width={200} height={200} className="mx-auto" />
                </div>
                
                <div className="mt-4 space-y-2 text-center">
                  <p className="text-sm text-muted-foreground">Se non riesci a scansionare il QR code, puoi inserire manualmente questo codice:</p>
                  <div className="p-2 bg-muted rounded-md font-mono text-sm break-all">
                    {setupData.secret}
                  </div>
                </div>
              </>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('intro')} disabled={isLoading}>
              Indietro
            </Button>
            <Button onClick={() => setStep('verify')} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continua
            </Button>
          </CardFooter>
        </TabsContent>
        
        <TabsContent value="verify">
          <CardHeader>
            <CardTitle>Verifica il codice</CardTitle>
            <CardDescription>
              Inserisci il codice a 6 cifre visualizzato nella tua app di autenticazione.
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
                  className="text-center text-lg tracking-widest"
                />
                {error && <p className="text-destructive text-sm">{error}</p>}
              </div>
              
              <p className="text-sm text-muted-foreground">
                Questo codice cambia ogni 30 secondi. Se il codice non viene accettato, assicurati che l'orario del tuo dispositivo sia sincronizzato correttamente.
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('qrcode')} disabled={isLoading}>
              Indietro
            </Button>
            <Button onClick={handleVerifyCode} disabled={isLoading || verificationCode.length !== 6}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verifica
            </Button>
          </CardFooter>
        </TabsContent>
      </Tabs>
    </Card>
  );
}