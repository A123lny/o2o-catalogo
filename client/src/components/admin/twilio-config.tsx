import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

// Schema per la validazione del form
const twilioConfigSchema = z.object({
  enabled: z.boolean().default(false),
  accountSid: z.string().min(1, "Account SID è richiesto").nullable().optional(),
  authToken: z.string().min(1, "Auth Token è richiesto").nullable().optional(),
  verifyServiceSid: z.string().nullable().optional(),
  fromNumber: z.string().nullable().optional(),
});

type TwilioConfigType = z.infer<typeof twilioConfigSchema>;

export default function TwilioConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Carica la configurazione esistente
  const { data: config, isLoading } = useQuery({
    queryKey: ["/api/integrations/twilio"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/integrations/twilio");
      if (!response.ok) {
        throw new Error("Errore nel caricamento della configurazione");
      }
      return response.json();
    },
  });
  
  // Form per la modifica della configurazione
  const form = useForm<TwilioConfigType>({
    resolver: zodResolver(twilioConfigSchema),
    defaultValues: {
      enabled: false,
      accountSid: "",
      authToken: "",
      verifyServiceSid: "",
      fromNumber: "",
    },
  });
  
  // Aggiorna il form quando i dati vengono caricati
  useEffect(() => {
    if (config) {
      form.reset({
        enabled: config.enabled,
        accountSid: config.accountSid || "",
        authToken: config.authToken || "",
        verifyServiceSid: config.verifyServiceSid || "",
        fromNumber: config.fromNumber || "",
      });
    }
  }, [config, form]);
  
  // Mutation per salvare la configurazione
  const saveMutation = useMutation({
    mutationFn: async (data: TwilioConfigType) => {
      const response = await apiRequest("POST", "/api/integrations/twilio", data);
      if (!response.ok) {
        throw new Error("Errore durante il salvataggio");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurazione salvata",
        description: "La configurazione SMS è stata salvata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/twilio"] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Si è verificato un errore: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: TwilioConfigType) => {
    saveMutation.mutate(data);
  };
  
  // Test SMS
  const [testPhone, setTestPhone] = useState("");
  
  const sendTestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/integrations/test-sms", {
        to: testPhone,
      });
      if (!response.ok) {
        throw new Error("Errore durante l'invio dell'SMS di test");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "SMS inviato",
        description: "L'SMS di test è stato inviato con successo.",
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
  
  const sendTestSms = () => {
    if (!testPhone) {
      toast({
        title: "Errore",
        description: "Inserisci un numero di telefono valido",
        variant: "destructive",
      });
      return;
    }
    sendTestMutation.mutate();
  };
  
  const isEnabled = form.watch("enabled");
  
  return (
    <Card>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Servizio SMS</FormLabel>
                      <FormDescription>
                        Abilita o disabilita il servizio di invio SMS tramite Twilio
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className={isEnabled ? "" : "opacity-50 pointer-events-none"}>
                <div className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="accountSid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account SID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                        </FormControl>
                        <FormDescription>
                          Puoi trovare il tuo Account SID nella dashboard di Twilio
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="authToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Auth Token</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="Auth Token" />
                        </FormControl>
                        <FormDescription>
                          Puoi trovare il tuo Auth Token nella dashboard di Twilio
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="verifyServiceSid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verify Service SID (opzionale)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                        </FormControl>
                        <FormDescription>
                          Necessario solo se utilizzi il servizio Verify di Twilio per la verifica telefonica
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="fromNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numero Mittente</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+1234567890" />
                        </FormControl>
                        <FormDescription>
                          Il numero di telefono da cui inviare gli SMS (deve essere un numero verificato di Twilio)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="pt-6">
                  <Button 
                    type="submit" 
                    className="w-full"
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
                </div>
                
                {isEnabled && (
                  <div className="mt-8 border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Test SMS</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="test-phone">Numero di Telefono</Label>
                        <Input
                          id="test-phone"
                          type="tel"
                          placeholder="+1234567890"
                          value={testPhone}
                          onChange={(e) => setTestPhone(e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground">
                          Inserisci il numero in formato internazionale (es. +39123456789)
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        onClick={sendTestSms}
                        disabled={sendTestMutation.isPending}
                      >
                        {sendTestMutation.isPending ? (
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
        )}
      </CardContent>
    </Card>
  );
}