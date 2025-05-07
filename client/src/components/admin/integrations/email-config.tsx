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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Schema per la configurazione email
const schema = z.object({
  provider: z.enum(["smtp", "sendgrid"]).default("smtp"),
  host: z.string().optional(),
  port: z.coerce.number().optional(),
  secure: z.boolean().default(false),
  username: z.string().optional(),
  password: z.string().optional(),
  fromEmail: z.string().email("Inserisci un indirizzo email valido").optional(),
  sendgridApiKey: z.string().optional(),
});

// Tipo configurazione email
export interface EmailConfigType {
  id?: number;
  enabled: boolean;
  provider: "smtp" | "sendgrid";
  host?: string;
  port?: number;
  secure?: boolean;
  username?: string;
  password?: string;
  fromEmail?: string;
  sendgridApiKey?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EmailConfigProps {
  config: EmailConfigType;
  onConfigSaved?: () => void;
}

// Default values
const defaultValues = {
  provider: "smtp" as const,
  host: "",
  port: 587,
  secure: false,
  username: "",
  password: "",
  fromEmail: "",
  sendgridApiKey: "",
};

export function EmailConfig({ config, onConfigSaved }: EmailConfigProps) {
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(config?.enabled ?? false);

  // Form per la configurazione
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      ...defaultValues,
      ...config,
      secure: config?.secure === true,
    },
  });

  // Aggiorna il form quando la configurazione cambia
  useEffect(() => {
    if (config) {
      setIsEnabled(config.enabled === true);
      form.reset({
        provider: config.provider || "smtp",
        host: config.host || "",
        port: config.port || 587,
        secure: config.secure === true,
        username: config.username || "",
        password: config.password || "",
        fromEmail: config.fromEmail || "",
        sendgridApiKey: config.sendgridApiKey || "",
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
      
      const res = await apiRequest("PUT", "/api/admin/integrations/email", payload);
      if (!res.ok) throw new Error("Errore nel salvataggio della configurazione email");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurazione salvata",
        description: "La configurazione email è stata salvata con successo",
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

  // Mutazione per test email
  const [testEmail, setTestEmail] = useState("");
  const [template, setTemplate] = useState("welcome");

  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/integrations/test-email", {
        to: testEmail,
        templateName: template,
      });
      if (!res.ok) throw new Error("Errore nell'invio dell'email di test");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Email inviata",
        description: "L'email di test è stata inviata con successo",
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

  const sendTestEmail = () => {
    if (!testEmail) {
      toast({
        title: "Errore",
        description: "Inserisci un indirizzo email valido",
        variant: "destructive",
      });
      return;
    }
    testEmailMutation.mutate();
  };

  const provider = form.watch("provider");

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Toggle per attivare/disattivare */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Servizio Email</h3>
              <p className="text-sm text-muted-foreground">
                Abilita o disabilita il servizio di invio email
              </p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>

          <div className={isEnabled ? "" : "opacity-50 pointer-events-none"}>
            {/* Selezione provider */}
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem className="space-y-3 mb-6">
                  <FormLabel>Provider Email</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
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

            {/* Campi SMTP */}
            {provider === "smtp" ? (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="host"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Server SMTP</FormLabel>
                      <FormControl>
                        <Input placeholder="smtp.example.com" {...field} />
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
                        <Input
                          type="number"
                          placeholder="587"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secure"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <FormLabel>Connessione Sicura</FormLabel>
                        <FormDescription>
                          Utilizza SSL/TLS per la connessione SMTP
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
                        <Input placeholder="username" {...field} />
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
                        <Input
                          type="password"
                          placeholder="Password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fromEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Mittente</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="noreply@tuodominio.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="sendgridApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SendGrid API Key</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="API Key"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fromEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Mittente</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="noreply@tuodominio.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

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

            {/* Test Email */}
            {isEnabled && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">Test Email</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="testEmail">Indirizzo Email</Label>
                      <Input
                        id="testEmail"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="test@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template">Template</Label>
                      <select
                        id="template"
                        value={template}
                        onChange={(e) => setTemplate(e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
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
                    disabled={testEmailMutation.isPending}
                  >
                    {testEmailMutation.isPending ? (
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
    </div>
  );
}