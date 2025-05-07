import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// UI Components
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

// Schema per la configurazione Twilio
const schema = z.object({
  accountSid: z.string().min(1, "Account SID richiesto"),
  authToken: z.string().min(1, "Token di autenticazione richiesto"),
  verifyServiceSid: z.string().optional(),
  fromNumber: z.string().optional(),
});

// Tipo per la configurazione Twilio
export interface TwilioConfigType {
  id?: number;
  enabled: boolean;
  accountSid: string;
  authToken: string;
  verifyServiceSid?: string;
  fromNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TwilioConfigProps {
  config: TwilioConfigType;
  onConfigSaved?: () => void;
}

export function TwilioConfig({ config, onConfigSaved }: TwilioConfigProps) {
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(config?.enabled ?? false);
  const [testPhone, setTestPhone] = useState("");
  
  // Form per la configurazione
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      accountSid: config?.accountSid || "",
      authToken: config?.authToken || "",
      verifyServiceSid: config?.verifyServiceSid || "",
      fromNumber: config?.fromNumber || "",
    },
  });
  
  // Aggiorna il form quando la configurazione cambia
  useEffect(() => {
    if (config) {
      setIsEnabled(config.enabled === true);
      form.reset({
        accountSid: config.accountSid || "",
        authToken: config.authToken || "",
        verifyServiceSid: config.verifyServiceSid || "",
        fromNumber: config.fromNumber || "",
      });
    }
  }, [config, form]);

  // Mutazione per salvare
  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        ...values,
        enabled: isEnabled,
      };
      
      const res = await apiRequest("PUT", "/api/admin/integrations/twilio", payload);
      if (!res.ok) throw new Error("Errore nel salvataggio della configurazione Twilio");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurazione salvata",
        description: "La configurazione Twilio è stata salvata con successo",
      });
      if (onConfigSaved) onConfigSaved();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Si è verificato un errore: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutazione per test SMS
  const testSMSMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/integrations/test-sms", {
        to: testPhone,
      });
      if (!res.ok) throw new Error("Errore nell'invio dell'SMS di test");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "SMS inviato",
        description: "L'SMS di test è stato inviato con successo",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Si è verificato un errore: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    saveMutation.mutate(values);
  });

  const sendTestSMS = () => {
    if (!testPhone) {
      toast({
        title: "Errore",
        description: "Inserisci un numero di telefono valido",
        variant: "destructive",
      });
      return;
    }
    testSMSMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Toggle per attivare/disattivare */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Servizio SMS/Telefono</h3>
              <p className="text-sm text-muted-foreground">
                Abilita o disabilita il servizio di invio SMS e verifica telefono
              </p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>

          <div className={isEnabled ? "" : "opacity-50 pointer-events-none"}>
            <FormField
              control={form.control}
              name="accountSid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account SID</FormLabel>
                  <FormControl>
                    <Input placeholder="AC1234567890..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Puoi trovare questo valore nella tua dashboard di Twilio
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="authToken"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Auth Token</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Auth Token" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="verifyServiceSid"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Verify Service SID (opzionale)</FormLabel>
                  <FormControl>
                    <Input placeholder="VA1234567890..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Necessario se vuoi utilizzare Twilio Verify per verifica OTP
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fromNumber"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Numero mittente</FormLabel>
                  <FormControl>
                    <Input placeholder="+1234567890" {...field} />
                  </FormControl>
                  <FormDescription>
                    Il numero di telefono Twilio che apparirà come mittente degli SMS
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full mt-6"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                "Salva Configurazione"
              )}
            </Button>

            {/* Test SMS */}
            {isEnabled && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">Test SMS</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="testPhone">Numero di telefono</Label>
                    <Input
                      id="testPhone"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="+39 123 456 7890"
                    />
                    <p className="text-xs text-muted-foreground">
                      Inserisci un numero di telefono in formato internazionale (con prefisso +39 per l'Italia)
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={sendTestSMS}
                    disabled={testSMSMutation.isPending}
                  >
                    {testSMSMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Invio in corso...
                      </>
                    ) : (
                      "Invia SMS di Test"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}