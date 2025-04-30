import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Info, Copy, RefreshCw, Check, ShieldAlert } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface TwoFactorSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"qrcode" | "verify" | "backup">("qrcode");
  const [token, setToken] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Inizializza il setup del 2FA (generazione del QR code)
  const setupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/two-factor/setup");
      return response.json();
    },
    onSuccess: (data) => {
      setQrCode(data.qrCodeUrl);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Impossibile generare il codice QR per il 2FA",
        variant: "destructive",
      });
      console.error("Error generating 2FA setup:", error);
    },
  });

  // Verifica il token 2FA
  const verifyMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest("POST", "/api/two-factor/verify-setup", { token });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setBackupCodes(data.backupCodes);
        setStep("backup");
      }
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Il codice inserito non è valido. Riprova.",
        variant: "destructive",
      });
      console.error("Error verifying 2FA token:", error);
    },
  });

  // Avvia il processo di setup all'inizializzazione del componente
  const handleInitiateSetup = () => {
    setupMutation.mutate();
  };

  // Verifica il token inserito dall'utente
  const handleVerifyToken = () => {
    if (!token || token.length < 6) {
      toast({
        title: "Errore",
        description: "Inserisci un codice valido a 6 cifre",
        variant: "destructive",
      });
      return;
    }
    verifyMutation.mutate(token);
  };

  // Copia i codici di backup negli appunti
  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join("\n");
    copyToClipboard(codesText);
    setCopied(true);
    toast({
      title: "Codici copiati",
      description: "I codici di backup sono stati copiati negli appunti",
    });
    setTimeout(() => setCopied(false), 3000);
  };

  // Completa il processo di configurazione
  const handleComplete = () => {
    onComplete();
  };

  // Renderizza il contenuto in base allo step corrente
  const renderContent = () => {
    switch (step) {
      case "qrcode":
        return (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Configurazione 2FA</AlertTitle>
              <AlertDescription>
                Scansiona questo codice QR con l'app di autenticazione (Google Authenticator, Authy, ecc.)
                per iniziare a utilizzare l'autenticazione a due fattori.
              </AlertDescription>
            </Alert>

            {setupMutation.isPending ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : !qrCode ? (
              <div className="text-center py-8">
                <Button onClick={handleInitiateSetup}>
                  Inizia configurazione 2FA
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <img src={qrCode} alt="QR Code per 2FA" className="max-w-[200px]" />
                </div>
                <Button onClick={() => setStep("verify")}>
                  Ho scansionato il codice QR
                </Button>
              </div>
            )}
          </div>
        );

      case "verify":
        return (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Verifica codice</AlertTitle>
              <AlertDescription>
                Inserisci il codice a 6 cifre mostrato nella tua app di autenticazione.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="token">Codice di verifica</Label>
              <div className="flex space-x-2">
                <Input
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                />
                <Button onClick={handleVerifyToken} disabled={verifyMutation.isPending}>
                  {verifyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Verifica
                </Button>
              </div>
            </div>

            <div className="pt-2">
              <Button variant="ghost" onClick={() => setStep("qrcode")}>
                Torna indietro
              </Button>
            </div>
          </div>
        );

      case "backup":
        return (
          <div className="space-y-4">
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Importante: salva i codici di backup</AlertTitle>
              <AlertDescription>
                Questi codici ti permetteranno di accedere al tuo account nel caso in cui perdi l'accesso
                alla tua app di autenticazione. Salvali in un luogo sicuro.
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-md font-mono text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Codici di backup</span>
                <Button variant="ghost" size="sm" onClick={handleCopyBackupCodes}>
                  {copied ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {copied ? "Copiato" : "Copia"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, i) => (
                  <div key={i} className="p-1">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-between">
              <Button variant="outline" onClick={() => setStep("verify")}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Ritorna
              </Button>
              <Button onClick={handleComplete}>
                <Check className="h-4 w-4 mr-2" />
                Completato
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs value={step} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="qrcode" disabled>
              1. Scansiona QR
            </TabsTrigger>
            <TabsTrigger value="verify" disabled>
              2. Verifica
            </TabsTrigger>
            <TabsTrigger value="backup" disabled>
              3. Backup
            </TabsTrigger>
          </TabsList>
          <TabsContent value={step} className="pt-4">
            {renderContent()}
          </TabsContent>
        </Tabs>
        {step === "qrcode" && (
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={onCancel}>
              Annulla
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}