import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { TwoFactorSetup } from "@/components/two-factor-setup";
import { Loader2, KeyRound, AlertTriangle, ShieldCheck, RefreshCw, Shield } from "lucide-react";

interface TwoFactorSectionProps {
  securitySettings: any;
  onUpdateSettings: (values: { enable2FA: boolean, require2FA: boolean }) => void;
}

export function TwoFactorSection({ securitySettings, onUpdateSettings }: TwoFactorSectionProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetTarget, setResetTarget] = useState<"all" | number | null>(null);

  // Query per recuperare le statistiche 2FA
  const { data: stats, isLoading: isLoadingStats } = useQuery<any>({
    queryKey: ["/api/admin/two-factor/status"],
    enabled: !!securitySettings && user?.role === "admin",
  });

  // Mutation per resettare il 2FA per tutti gli utenti
  const resetAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/two-factor/reset-all");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Operazione completata",
        description: "L'autenticazione a due fattori è stata reimpostata per tutti gli utenti",
      });
      // Ricarica le statistiche
      queryClient.invalidateQueries({ queryKey: ["/api/admin/two-factor/status"] });
      setShowResetDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Non è stato possibile completare l'operazione. Riprova più tardi.",
        variant: "destructive",
      });
      console.error("Error resetting 2FA:", error);
    },
  });

  // Mutation per disabilitare il proprio 2FA
  const disableMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/two-factor/disable");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Autenticazione a due fattori disabilitata",
        description: "L'autenticazione a due fattori è stata disabilitata correttamente",
      });
      // Aggiorna lo stato dell'utente
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      // Ricarica le statistiche
      queryClient.invalidateQueries({ queryKey: ["/api/admin/two-factor/status"] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Non è stato possibile disabilitare l'autenticazione a due fattori",
        variant: "destructive",
      });
      console.error("Error disabling 2FA:", error);
    },
  });

  // Gestione del cambiamento delle impostazioni 2FA globali
  const handleSettingsChange = (key: "enable2FA" | "require2FA") => {
    const newSettings = { 
      enable2FA: securitySettings?.enable2FA || false,
      require2FA: securitySettings?.require2FA || false,
      [key]: !securitySettings?.[key]
    };
    
    // Se disabilitiamo enable2FA, disabilitiamo anche require2FA
    if (key === "enable2FA" && !newSettings.enable2FA) {
      newSettings.require2FA = false;
    }
    
    onUpdateSettings(newSettings);
  };

  // Gestione del reset 2FA
  const handleResetAll = () => {
    setResetTarget("all");
    setShowResetDialog(true);
  };

  const handleConfirmReset = () => {
    if (resetTarget === "all") {
      resetAllMutation.mutate();
    }
  };

  // Handle setup completion
  const handleSetupComplete = () => {
    setShowSetupDialog(false);
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/two-factor/status"] });
    toast({
      title: "Configurazione completata",
      description: "L'autenticazione a due fattori è stata configurata correttamente",
    });
  };

  // Genera una percentuale formattata
  const formatPercentage = (value?: number) => {
    if (value === undefined) return "0%";
    return `${Math.round(value)}%`;
  };

  // Verifica se il 2FA è configurato per l'utente corrente
  const is2FAEnabled = user?.twoFactorEnabled;
  const is2FAVerified = user?.twoFactorVerified;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Autenticazione a due fattori (2FA)
          </CardTitle>
          <CardDescription>
            Proteggi i tuoi account con un livello aggiuntivo di sicurezza richiedendo un codice generato da un'app autenticatore.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Stato globale 2FA (solo admin) */}
          {user?.role === "admin" && (
            <>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">Abilita 2FA per questo sito</h4>
                  <p className="text-sm text-muted-foreground">
                    Consenti agli utenti di configurare l'autenticazione a due fattori nei loro account
                  </p>
                </div>
                <Switch 
                  checked={securitySettings?.enable2FA || false} 
                  onCheckedChange={() => handleSettingsChange("enable2FA")}
                />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">Richiedi 2FA per tutti gli utenti</h4>
                  <p className="text-sm text-muted-foreground">
                    Forza tutti gli utenti a configurare l'autenticazione a due fattori al primo accesso
                  </p>
                </div>
                <Switch 
                  checked={securitySettings?.require2FA || false} 
                  disabled={!securitySettings?.enable2FA}
                  onCheckedChange={() => handleSettingsChange("require2FA")}
                />
              </div>
            </>
          )}
          
          {/* Stato personale 2FA */}
          <div className="pt-2">
            <h4 className="font-medium mb-2">Stato 2FA per il tuo account</h4>
            
            {is2FAEnabled ? (
              is2FAVerified ? (
                <Alert className="bg-green-50 border-green-200">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">2FA configurato</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Il tuo account è protetto con l'autenticazione a due fattori.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Configurazione incompleta</AlertTitle>
                  <AlertDescription>
                    Hai abilitato il 2FA ma non hai completato la configurazione.
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-2"
                      onClick={() => setShowSetupDialog(true)}
                    >
                      Completa configurazione
                    </Button>
                  </AlertDescription>
                </Alert>
              )
            ) : (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>2FA non configurato</AlertTitle>
                <AlertDescription>
                  Il tuo account non è protetto con l'autenticazione a due fattori.
                  {securitySettings?.enable2FA && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-2"
                      onClick={() => setShowSetupDialog(true)}
                    >
                      Configura 2FA
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          {/* Statistiche 2FA (solo admin) */}
          {user?.role === "admin" && (
            <div className="pt-4">
              <h4 className="font-medium mb-3">Statistiche 2FA</h4>
              {isLoadingStats ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : stats ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Utenti con 2FA</div>
                    <div className="text-2xl font-semibold mt-1">{stats.enabledCount} / {stats.totalUsers}</div>
                    <div className="text-sm mt-1">
                      <Badge variant="outline" className="bg-background">
                        {formatPercentage(stats.percentageEnabled)}
                      </Badge>
                    </div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Stato globale 2FA</div>
                    <div className="mt-2">
                      {stats.globalEnabled ? (
                        <Badge className="bg-green-600">Abilitato</Badge>
                      ) : (
                        <Badge variant="outline">Disabilitato</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Non è stato possibile recuperare le statistiche 2FA.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col items-start gap-4">
          {is2FAVerified && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => disableMutation.mutate()}
              disabled={disableMutation.isPending}
            >
              {disableMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Disabilita 2FA per il tuo account
            </Button>
          )}
          
          {user?.role === "admin" && securitySettings?.enable2FA && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleResetAll}
              disabled={resetAllMutation.isPending}
            >
              {resetAllMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Reset 2FA per tutti gli utenti
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Dialog di setup 2FA */}
      {showSetupDialog && (
        <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
          <DialogContent className="max-w-md">
            <TwoFactorSetup 
              onComplete={handleSetupComplete} 
              onCancel={() => setShowSetupDialog(false)} 
            />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Dialog di conferma reset */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma reset 2FA</DialogTitle>
            <DialogDescription>
              {resetTarget === "all" ? (
                "Questa operazione disabiliterà l'autenticazione a due fattori per tutti gli utenti. Gli utenti dovranno riconfigurare il 2FA. Vuoi procedere?"
              ) : (
                "Questa operazione disabiliterà l'autenticazione a due fattori per l'utente selezionato. L'utente dovrà riconfigurare il 2FA. Vuoi procedere?"
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Annulla
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmReset}
              disabled={resetAllMutation.isPending}
            >
              {resetAllMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Conferma reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}