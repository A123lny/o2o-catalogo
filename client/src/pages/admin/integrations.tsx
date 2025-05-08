import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, Send, Save } from "lucide-react";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Schema for SMTP configuration
const smtpConfigSchema = z.object({
  id: z.number().optional(),
  enabled: z.boolean().default(false),
  provider: z.string().default("smtp"),
  host: z.string().min(1, "L'host è obbligatorio"),
  port: z.number().int().positive().default(587),
  secure: z.boolean().default(false),
  username: z.string().min(1, "L'username è obbligatorio"),
  password: z.string().min(1, "La password è obbligatoria"),
  fromEmail: z.string().email("Indirizzo email non valido").min(1, "L'email mittente è obbligatoria"),
  sendgridApiKey: z.string().optional(),
});

// Email test schema
const emailTestSchema = z.object({
  to: z.string().email("Indirizzo email non valido").min(1, "L'email destinatario è obbligatoria"),
  subject: z.string().min(1, "L'oggetto è obbligatorio"),
  message: z.string().min(1, "Il messaggio è obbligatorio"),
});

type SmtpConfigValues = z.infer<typeof smtpConfigSchema>;
type EmailTestValues = z.infer<typeof emailTestSchema>;

export default function IntegrationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("smtp");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Form for SMTP configuration
  const smtpForm = useForm<SmtpConfigValues>({
    resolver: zodResolver(smtpConfigSchema),
    defaultValues: {
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

  // Form for testing email
  const testEmailForm = useForm<EmailTestValues>({
    resolver: zodResolver(emailTestSchema),
    defaultValues: {
      to: "",
      subject: "Test email da o2o Mobility",
      message: "Questo è un messaggio di test per verificare la configurazione SMTP.",
    },
  });

  // Fetch SMTP configuration
  const { data: smtpConfig, isLoading: isLoadingSmtp } = useQuery({
    queryKey: ['/api/integrations/email'],
    queryFn: async () => {
      const response = await fetch('/api/integrations/email');
      if (!response.ok) throw new Error('Errore nel recupero della configurazione SMTP');
      return response.json();
    }
  });
  
  // Update form when data is loaded
  React.useEffect(() => {
    if (smtpConfig) {
      smtpForm.reset({
        id: smtpConfig.id,
        enabled: smtpConfig.enabled,
        provider: smtpConfig.provider,
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        username: smtpConfig.username,
        password: smtpConfig.password,
        fromEmail: smtpConfig.fromEmail,
        sendgridApiKey: smtpConfig.sendgridApiKey,
      });
    }
  }, [smtpConfig, smtpForm]);

  // Update SMTP configuration
  const updateSmtpConfig = useMutation({
    mutationFn: async (data: SmtpConfigValues) => {
      setIsSubmitting(true);
      const response = await apiRequest('PATCH', '/api/integrations/email', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurazione SMTP aggiornata",
        description: "Le impostazioni SMTP sono state aggiornate con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/email'] });
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento delle impostazioni SMTP.",
        variant: "destructive",
      });
      console.error("Error updating SMTP settings:", error);
      setIsSubmitting(false);
    }
  });

  // Send test email
  const sendTestEmail = useMutation({
    mutationFn: async (data: EmailTestValues) => {
      setIsSendingTest(true);
      const response = await apiRequest('POST', '/api/integrations/email/test', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email di test inviata",
        description: "L'email di test è stata inviata con successo.",
      });
      setIsSendingTest(false);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'invio dell'email di test.",
        variant: "destructive",
      });
      console.error("Error sending test email:", error);
      setIsSendingTest(false);
    }
  });

  const onSmtpSubmit = (data: SmtpConfigValues) => {
    updateSmtpConfig.mutate(data);
  };

  const onTestEmailSubmit = (data: EmailTestValues) => {
    sendTestEmail.mutate(data);
  };

  return (
    <div className="flex h-full min-h-screen bg-neutral-100">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col pl-64 pb-16">
        <AdminHeader user={user} />
        
        <main className="flex-1 p-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-neutral-800">Integrazioni</h1>
            <p className="text-neutral-500">Configura le integrazioni del sistema con servizi esterni</p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="smtp">
                <Mail className="h-4 w-4 mr-2" /> Email (SMTP)
              </TabsTrigger>
            </TabsList>
            
            {/* SMTP Configuration */}
            <TabsContent value="smtp">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Configurazione Email (SMTP)</CardTitle>
                  <CardDescription>
                    Configura il server SMTP per l'invio di email dal sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingSmtp ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Form {...smtpForm}>
                      <form onSubmit={smtpForm.handleSubmit(onSmtpSubmit)} className="space-y-6">
                        <div className="flex items-center space-x-2 mb-4">
                          <FormField
                            control={smtpForm.control}
                            name="enabled"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0">
                                <div className="space-y-0.5">
                                  <FormLabel>Attiva SMTP</FormLabel>
                                  <FormDescription>
                                    Abilita l'invio di email tramite SMTP
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

                        <FormField
                          control={smtpForm.control}
                          name="provider"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Provider</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleziona provider" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="smtp">SMTP</SelectItem>
                                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Scegli il provider per l'invio delle email
                              </FormDescription>
                            </FormItem>
                          )}
                        />

                        {smtpForm.watch("provider") === "smtp" ? (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={smtpForm.control}
                                name="host"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Host SMTP</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="es. smtp.gmail.com" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={smtpForm.control}
                                name="port"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Porta SMTP</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="number"
                                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                                        placeholder="es. 587"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="flex items-center space-x-2 mb-4">
                              <FormField
                                control={smtpForm.control}
                                name="secure"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0">
                                    <div className="space-y-0.5">
                                      <FormLabel>Connessione sicura (SSL/TLS)</FormLabel>
                                      <FormDescription>
                                        Abilita per usare connessione criptata
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={smtpForm.control}
                                name="username"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={smtpForm.control}
                                name="password"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </>
                        ) : (
                          <FormField
                            control={smtpForm.control}
                            name="sendgridApiKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>API Key SendGrid</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={smtpForm.control}
                          name="fromEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email mittente</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="noreply@o2omobility.it" />
                              </FormControl>
                              <FormDescription>
                                L'indirizzo email che apparirà come mittente
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvataggio in corso...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" /> Salva Configurazione
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Test Email</CardTitle>
                  <CardDescription>
                    Invia un'email di test per verificare la configurazione
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...testEmailForm}>
                    <form onSubmit={testEmailForm.handleSubmit(onTestEmailSubmit)} className="space-y-6">
                      <FormField
                        control={testEmailForm.control}
                        name="to"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email destinatario</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="test@example.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={testEmailForm.control}
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
                        control={testEmailForm.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Messaggio</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" disabled={isSendingTest || !smtpForm.watch("enabled")}>
                        {isSendingTest ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Invio in corso...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" /> Invia Email di Test
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}