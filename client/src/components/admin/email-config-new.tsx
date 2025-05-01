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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Schema per la validazione del form
const emailConfigSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.enum(["smtp", "sendgrid"]).default("smtp"),
  host: z.string().optional().nullable(),
  port: z.coerce.number().optional().nullable(),
  secure: z.boolean().default(false),
  username: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  from: z.string().email("Inserisci un indirizzo email valido").optional().nullable(),
  fromEmail: z.string().email("Inserisci un indirizzo email valido").optional().nullable(),
  sendgridApiKey: z.string().optional().nullable(),
});

type EmailConfigType = z.infer<typeof emailConfigSchema>;

export default function EmailConfigNew() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Definiamo uno stato locale per il valore "enabled"
  const [isServiceEnabled, setIsServiceEnabled] = useState<boolean>(false);
  
  // Carica la configurazione esistente
  const { data: config, isLoading } = useQuery({
    queryKey: ["/api/integrations/email"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/integrations/email");
      if (!response.ok) {
        throw new Error("Errore nel caricamento della configurazione");
      }
      return response.json();
    },
  });
  
  // Form per la modifica della configurazione
  const form = useForm<EmailConfigType>({
    resolver: zodResolver(emailConfigSchema),
    defaultValues: {
      enabled: false,
      provider: "smtp",
      host: "",
      port: 587,
      secure: false,
      username: "",
      password: "",
      from: "",
      sendgridApiKey: "",
    },
  });
  
  // Aggiornaamo il form quando i dati vengono caricati
  useEffect(() => {
    if (config) {
      // Verifichiamo e impostiamo lo stato locale
      const dbEnabled = config.enabled === true || config.enabled === "true";
      setIsServiceEnabled(dbEnabled);
      console.log("Config dal server:", config);
      console.log("enabled dal server:", config.enabled, "tipo:", typeof config.enabled);
      console.log("enabled interpretato:", dbEnabled);
      
      // Imposta i valori del form
      const formValues = {
        enabled: dbEnabled,
        provider: config.provider || "smtp",
        host: config.host || "",
        port: config.port || 587,
        secure: config.secure === true || config.secure === "true",
        username: config.username || "",
        password: config.password || "",
        from: config.fromEmail || "",
        fromEmail: config.fromEmail || "",
        sendgridApiKey: config.sendgridApiKey || "",
      };
      
      // Reset completo del form 
      form.reset(formValues);
    }
  }, [config, form]);
  
  // Mutation per salvare la configurazione
  const saveMutation = useMutation({
    mutationFn: async (data: EmailConfigType) => {
      const dataToSend = {
        enabled: isServiceEnabled, // Usa lo stato locale invece del valore del form
        provider: data.provider,
        host: data.host || null,
        port: data.port || 587,
        secure: data.secure || false,
        username: data.username || null,
        password: data.password || null,
        fromEmail: data.from || data.fromEmail || null,
        sendgridApiKey: data.sendgridApiKey || null
      };
      
      console.log("Saving email config:", dataToSend);
      
      try {
        await apiRequest("POST", "/api/integrations/email", dataToSend);
        return dataToSend;
      } catch (error) {
        console.error("Errore durante il salvataggio", error);
        throw new Error("Errore durante il salvataggio");
      }
    },
    onSuccess: () => {
      toast({
        title: "Configurazione salvata",
        description: "La configurazione email è stata salvata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/email"] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Si è verificato un errore: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: EmailConfigType) => {
    saveMutation.mutate(data);
  };
  
  // Test email
  const [testEmail, setTestEmail] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("welcome");
  
  const sendTestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/integrations/test-email", {
        to: testEmail,
        templateName: selectedTemplate,
      });
      
      if (!response.ok) {
        let errorMessage = "Errore durante l'invio dell'email di test";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.message || errorMessage;
        } catch (e) {
          console.error("Errore durante il parsing della risposta", e);
        }
        throw new Error(errorMessage);
      }
      
      try {
        return await response.json();
      } catch (e) {
        console.log("La risposta non contiene JSON, consideriamo l'operazione riuscita");
        return { success: true };
      }
    },
    onSuccess: () => {
      toast({
        title: "Email inviata",
        description: "L'email di test è stata inviata con successo.",
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
  
  const sendTestEmail = () => {
    if (!testEmail) {
      toast({
        title: "Errore",
        description: "Inserisci un indirizzo email valido",
        variant: "destructive",
      });
      return;
    }
    sendTestMutation.mutate();
  };
  
  const currentProvider = form.watch("provider");
  
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
              {/* Servizio Email Switch - usa lo stato locale */}
              <div className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Servizio Email</FormLabel>
                  <FormDescription>
                    Abilita o disabilita il servizio di invio email
                  </FormDescription>
                </div>
                <Switch
                  checked={isServiceEnabled}
                  onCheckedChange={(checked) => {
                    console.log("Switch cambiato a:", checked);
                    setIsServiceEnabled(checked);
                  }}
                />
              </div>
              
              <div className={isServiceEnabled ? "" : "opacity-50 pointer-events-none"}>
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Provider Email</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="smtp" id="smtp" />
                            <Label htmlFor="smtp">SMTP Server</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sendgrid" id="sendgrid" />
                            <Label htmlFor="sendgrid">SendGrid API</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {currentProvider === "smtp" ? (
                  <div className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="host"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Server SMTP</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="smtp.example.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="port"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Porta</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="587" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="secure"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Connessione Sicura (SSL/TLS)</FormLabel>
                            <FormDescription>
                              Utilizza una connessione sicura al server SMTP
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
                    
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="user@example.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="Password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="from"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Indirizzo Mittente</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="noreply@example.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <div className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="sendgridApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SendGrid API Key</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="API Key" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="from"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Indirizzo Mittente</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="noreply@example.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
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
                
                {isServiceEnabled && (
                  <div className="mt-8 border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Test Email</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="test-email">Indirizzo Email</Label>
                          <Input
                            id="test-email"
                            type="email"
                            placeholder="test@example.com"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="test-template">Template</Label>
                          <select 
                            id="test-template"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                          >
                            <option value="welcome">Benvenuto</option>
                            <option value="password-reset">Reset Password</option>
                            <option value="notification">Notifica</option>
                          </select>
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        onClick={sendTestEmail}
                        disabled={sendTestMutation.isPending}
                      >
                        {sendTestMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Invio in corso...
                          </>
                        ) : (
                          "Invia Email di Test"
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