import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import AdminLayout from "@/components/admin/layout";
import { Loader2, Mail, RefreshCcw } from "lucide-react";

// Schema per la configurazione SMTP
const smtpConfigSchema = z.object({
  id: z.number(),
  enabled: z.boolean().default(false),
  provider: z.string().default("smtp"),
  host: z.string().min(1, { message: "L'host SMTP è obbligatorio" }).optional(),
  port: z.number().int().min(1).max(65535).optional(),
  secure: z.boolean().default(false),
  username: z.string().min(1, { message: "Il nome utente è obbligatorio" }).optional(),
  password: z.string().min(1, { message: "La password è obbligatoria" }).optional(),
  fromEmail: z.string().email({ message: "Inserisci un indirizzo email valido" }).optional(),
  sendgridApiKey: z.string().optional(),
});

// Schema per il test dell'email
const emailTestSchema = z.object({
  to: z.string().email({ message: "Inserisci un indirizzo email valido" }),
  subject: z.string().min(1, { message: "L'oggetto è obbligatorio" }),
  message: z.string().min(1, { message: "Il messaggio è obbligatorio" }),
});

type SmtpConfigValues = z.infer<typeof smtpConfigSchema>;
type EmailTestValues = z.infer<typeof emailTestSchema>;

export default function IntegrationsPage() {
  const { toast } = useToast();
  const [testTab, setTestTab] = React.useState("config");

  // Carica la configurazione SMTP
  const { data: emailConfigData, isLoading: isLoadingConfig } = useQuery({
    queryKey: ["/api/integrations/email"],
    retry: false,
  });

  // Form per la configurazione SMTP
  const form = useForm<SmtpConfigValues>({
    resolver: zodResolver(smtpConfigSchema),
    defaultValues: {
      id: 0,
      enabled: false,
      provider: "smtp",
      host: "",
      port: 587,
      secure: false,
      username: "",
      password: "",
      fromEmail: "",
      sendgridApiKey: "",
    },
  });

  // Form per il test dell'email
  const testForm = useForm<EmailTestValues>({
    resolver: zodResolver(emailTestSchema),
    defaultValues: {
      to: "",
      subject: "Test di invio email da O2O Mobility",
      message: "Questo è un messaggio di test per verificare la configurazione email.",
    },
  });

  // Aggiorna la configurazione SMTP
  const updateConfig = useMutation({
    mutationFn: async (data: SmtpConfigValues) => {
      const response = await fetch("/api/integrations/email", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Errore durante l'aggiornamento della configurazione");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurazione aggiornata",
        description: "Le impostazioni email sono state aggiornate con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/email"] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test di invio email
  const testEmail = useMutation({
    mutationFn: async (data: EmailTestValues) => {
      const response = await fetch("/api/integrations/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Errore durante l'invio dell'email di test");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email inviata",
        description: "L'email di test è stata inviata con successo",
      });
      testForm.reset(testForm.getValues());
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Aggiorna i valori del form quando i dati vengono caricati
  React.useEffect(() => {
    if (emailConfigData) {
      form.reset({
        id: emailConfigData.id,
        enabled: emailConfigData.enabled,
        provider: emailConfigData.provider,
        host: emailConfigData.host || "",
        port: emailConfigData.port || 587,
        secure: emailConfigData.secure || false,
        username: emailConfigData.username || "",
        password: emailConfigData.password || "",
        fromEmail: emailConfigData.fromEmail || "",
        sendgridApiKey: emailConfigData.sendgridApiKey || "",
      });
    }
  }, [emailConfigData, form]);

  const onSmtpSubmit = (data: SmtpConfigValues) => {
    updateConfig.mutate(data);
  };

  const onTestEmailSubmit = (data: EmailTestValues) => {
    if (!form.getValues().enabled) {
      toast({
        title: "Configurazione non attiva",
        description: "Attiva la configurazione email prima di inviare un'email di test",
        variant: "destructive",
      });
      return;
    }
    testEmail.mutate(data);
  };

  return (
    <AdminLayout title="Integrazioni" description="Gestisci le integrazioni con servizi esterni">
      <Tabs defaultValue="email" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="sms" disabled>
            SMS
          </TabsTrigger>
          <TabsTrigger value="payment" disabled>
            Pagamenti
          </TabsTrigger>
          <TabsTrigger value="social" disabled>
            Social Login
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Configurazione Email</CardTitle>
                      <CardDescription>
                        Configura il server SMTP per l'invio di email automatiche
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingConfig ? (
                    <div className="flex justify-center items-center h-60">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSmtpSubmit)} className="space-y-4">
                        <div className="flex justify-between items-center pb-4">
                          <FormField
                            control={form.control}
                            name="enabled"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel>Attiva invio email</FormLabel>
                                  <FormDescription>
                                    Attiva o disattiva l'invio di email dal sistema
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
                        </div>

                        <Separator className="my-6" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="provider"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Provider</FormLabel>
                                <select
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                  {...field}
                                >
                                  <option value="smtp">SMTP</option>
                                  <option value="sendgrid">SendGrid</option>
                                </select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="fromEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email mittente</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="noreply@example.com"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {form.watch("provider") === "smtp" && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="host"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Host SMTP</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="smtp.example.com"
                                        {...field}
                                      />
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
                                        min="1"
                                        max="65535"
                                        {...field}
                                        onChange={(e) => {
                                          const value = parseInt(e.target.value);
                                          field.onChange(isNaN(value) ? 587 : value);
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name="secure"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>Connessione sicura (SSL/TLS)</FormLabel>
                                    <FormDescription>
                                      Utilizza una connessione sicura (generalmente sulla porta 465)
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nome utente</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="username"
                                        {...field}
                                      />
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
                                        placeholder="********"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        )}

                        {form.watch("provider") === "sendgrid" && (
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="sendgridApiKey"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>API Key SendGrid</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="password"
                                      placeholder="SG.xxxxxxxx"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                  <FormDescription>
                                    Puoi ottenere la tua API key dal dashboard di SendGrid
                                  </FormDescription>
                                </FormItem>
                              )}
                            />
                          </div>
                        )}

                        <div className="flex justify-end pt-4">
                          <Button
                            type="submit"
                            disabled={updateConfig.isPending || !form.formState.isDirty}
                          >
                            {updateConfig.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Salva configurazione
                          </Button>
                        </div>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Test email</CardTitle>
                  <CardDescription>
                    Invia un'email di test per verificare la configurazione
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...testForm}>
                    <form onSubmit={testForm.handleSubmit(onTestEmailSubmit)} className="space-y-4">
                      <FormField
                        control={testForm.control}
                        name="to"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Destinatario</FormLabel>
                            <FormControl>
                              <Input placeholder="test@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={testForm.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Oggetto</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={testForm.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Messaggio</FormLabel>
                            <FormControl>
                              <textarea
                                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full" disabled={testEmail.isPending}>
                        {testEmail.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Invio in corso...
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            Invia email di test
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle>Configurazione SMS</CardTitle>
              <CardDescription>
                Configura i servizi per l'invio di SMS (non ancora implementato)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Questa funzionalità sarà disponibile in un futuro aggiornamento.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Configurazione pagamenti</CardTitle>
              <CardDescription>
                Configura i gateway di pagamento (non ancora implementato)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Questa funzionalità sarà disponibile in un futuro aggiornamento.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Configurazione Social Login</CardTitle>
              <CardDescription>
                Configura i provider di autenticazione sociale (non ancora implementato)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Questa funzionalità sarà disponibile in un futuro aggiornamento.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}