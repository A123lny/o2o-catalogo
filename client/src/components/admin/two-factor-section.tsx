import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, ShieldAlert, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { TwoFactorSetup } from "@/components/two-factor-setup";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function TwoFactorSection() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [twoFactorStatus, setTwoFactorStatus] = useState({
    enabled: false,
    verified: false
  });

  // Carica lo stato attuale del 2FA
  const fetchTwoFactorStatus = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const res = await apiRequest('GET', '/api/2fa/status');
      const data = await res.json();
      setTwoFactorStatus({
        enabled: data.enabled,
        verified: data.verified
      });
    } catch (error) {
      console.error('Errore nel recupero dello stato 2FA:', error);
      toast({
        title: 'Errore',
        description: "Impossibile recuperare lo stato dell'autenticazione a due fattori.",
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Carica lo stato al caricamento del componente
  useEffect(() => {
    fetchTwoFactorStatus();
  }, [user]);

  // Gestisce la disabilitazione del 2FA
  const handleDisable2FA = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const res = await apiRequest('POST', '/api/2fa/disable');
      const data = await res.json();
      
      if (data.success) {
        setTwoFactorStatus({
          enabled: false,
          verified: false
        });
        
        toast({
          title: 'Disattivazione completata',
          description: 'Autenticazione a due fattori disabilitata con successo.'
        });
      }
    } catch (error) {
      console.error('Errore nella disabilitazione 2FA:', error);
      toast({
        title: 'Errore',
        description: "Impossibile disabilitare l'autenticazione a due fattori.",
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Aggiorna lo stato dopo la configurazione completata
  const handleSetupComplete = () => {
    setShowSetupDialog(false);
    fetchTwoFactorStatus();
    toast({
      title: 'Configurazione completata',
      description: 'Autenticazione a due fattori configurata con successo.'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Autenticazione a due fattori (2FA)
        </CardTitle>
        <CardDescription>
          Proteggi il tuo account con un livello di sicurezza aggiuntivo utilizzando un'app di autenticazione.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex items-start space-x-4">
          <div className="p-2 rounded-full bg-primary/10">
            {twoFactorStatus.verified ? (
              <CheckCircle className="h-6 w-6 text-primary" />
            ) : (
              <ShieldAlert className="h-6 w-6 text-amber-500" />
            )}
          </div>
          
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold">
              {twoFactorStatus.verified 
                ? "Autenticazione a due fattori attiva" 
                : "Autenticazione a due fattori non configurata"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {twoFactorStatus.verified 
                ? "Il tuo account è protetto con l'autenticazione a due fattori." 
                : "Configura l'autenticazione a due fattori per aumentare la sicurezza del tuo account."}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="2fa-switch">Stato 2FA</Label>
            <p className="text-sm text-muted-foreground">
              {twoFactorStatus.enabled 
                ? (twoFactorStatus.verified 
                  ? "Attiva e verificata" 
                  : "In attesa di verifica")
                : "Disattivata"}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : twoFactorStatus.enabled ? (
              <Switch id="2fa-switch" checked disabled />
            ) : (
              <Switch id="2fa-switch" checked={false} disabled />
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end gap-2">
        {isLoading ? (
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Caricamento...
          </Button>
        ) : twoFactorStatus.verified ? (
          <Button variant="destructive" onClick={handleDisable2FA}>
            Disabilita 2FA
          </Button>
        ) : (
          <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
            <DialogTrigger asChild>
              <Button>Configura 2FA</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <TwoFactorSetup
                onComplete={handleSetupComplete}
                onCancel={() => setShowSetupDialog(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  );
}