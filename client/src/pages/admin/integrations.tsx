import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Mail, MessageSquare, CreditCard, Send, ExternalLink, Facebook, Github } from "lucide-react";

// Definizione dello schema di integrazione per l'invio email
const emailConfigSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.enum(["smtp", "sendgrid"]).default("smtp"),
  host: z.string().optional(),
  port: z.coerce.number().optional(),
  secure: z.boolean().default(false),
  username: z.string().optional(),
  password: z.string().optional(),
  from: z.string().email("Indirizzo email non valido").optional(),
  sendgridApiKey: z.string().optional(),
});

// Schema per le integrazioni di social login
const socialLoginSchema = z.object({
  googleEnabled: z.boolean().default(false),
  googleClientId: z.string().optional(),
  googleClientSecret: z.string().optional(),
  
  facebookEnabled: z.boolean().default(false),
  facebookAppId: z.string().optional(),
  facebookAppSecret: z.string().optional(),
  
  githubEnabled: z.boolean().default(false),
  githubClientId: z.string().optional(),
  githubClientSecret: z.string().optional(),
});

// Schema per Twilio
const twilioSchema = z.object({
  enabled: z.boolean().default(false),
  accountSid: z.string().optional(),
  authToken: z.string().optional(),
  verifyServiceSid: z.string().optional(),
  fromNumber: z.string().optional(),
});

// Schema per i pagamenti
const paymentSchema = z.object({
  stripeEnabled: z.boolean().default(false),
  stripePublicKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  
  paypalEnabled: z.boolean().default(false),
  paypalClientId: z.string().optional(),
  paypalClientSecret: z.string().optional(),
});

// Schema per i template email
const emailTemplateSchema = z.object({
  name: z.string(),
  subject: z.string(),
  body: z.string(),
});

// Tipo per l'oggetto di configurazione complessivo
type IntegrationsConfig = {
  email: z.infer<typeof emailConfigSchema>;
  socialLogin: z.infer<typeof socialLoginSchema>;
  twilio: z.infer<typeof twilioSchema>;
  payment: z.infer<typeof paymentSchema>;
  emailTemplates: {
    [key: string]: {
      subject: string;
      body: string;
    }
  };
};

export default function IntegrationsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("email");
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("welcome");

  // Recupero delle configurazioni esistenti
  const { data: config, isLoading } = useQuery<IntegrationsConfig>({
    queryKey: ["/api/admin/integrations"],
    enabled: !!user,
  });

  // Form per l'email
  const emailForm = useForm<z.infer<typeof emailConfigSchema>>({
    resolver: zodResolver(emailConfigSchema),
    defaultValues: {
      enabled: config?.email?.enabled || false,
      provider: config?.email?.provider || "smtp",
      host: config?.email?.host || "",
      port: config?.email?.port || 587,
      secure: config?.email?.secure || false,
      username: config?.email?.username || "",
      password: config?.email?.password || "",
      from: config?.email?.from || "",
      sendgridApiKey: config?.email?.sendgridApiKey || "",
    },
  });

  // Form per i social login
  const socialLoginForm = useForm<z.infer<typeof socialLoginSchema>>({
    resolver: zodResolver(socialLoginSchema),
    defaultValues: {
      googleEnabled: config?.socialLogin?.googleEnabled || false,
      googleClientId: config?.socialLogin?.googleClientId || "",
      googleClientSecret: config?.socialLogin?.googleClientSecret || "",
      facebookEnabled: config?.socialLogin?.facebookEnabled || false,
      facebookAppId: config?.socialLogin?.facebookAppId || "",
      facebookAppSecret: config?.socialLogin?.facebookAppSecret || "",
      githubEnabled: config?.socialLogin?.githubEnabled || false,
      githubClientId: config?.socialLogin?.githubClientId || "",
      githubClientSecret: config?.socialLogin?.githubClientSecret || "",
    },
  });

  // Form per Twilio
  const twilioForm = useForm<z.infer<typeof twilioSchema>>({
    resolver: zodResolver(twilioSchema),
    defaultValues: {
      enabled: config?.twilio?.enabled || false,
      accountSid: config?.twilio?.accountSid || "",
      authToken: config?.twilio?.authToken || "",
      verifyServiceSid: config?.twilio?.verifyServiceSid || "",
      fromNumber: config?.twilio?.fromNumber || "",
    },
  });

  // Form per i pagamenti
  const paymentForm = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      stripeEnabled: config?.payment?.stripeEnabled || false,
      stripePublicKey: config?.payment?.stripePublicKey || "",
      stripeSecretKey: config?.payment?.stripeSecretKey || "",
      paypalEnabled: config?.payment?.paypalEnabled || false,
      paypalClientId: config?.payment?.paypalClientId || "",
      paypalClientSecret: config?.payment?.paypalClientSecret || "",
    },
  });

  // Form per template email
  const [templateForm, setTemplateForm] = useState({
    subject: config?.emailTemplates?.[selectedTemplate]?.subject || "",
    body: config?.emailTemplates?.[selectedTemplate]?.body || "",
  });

  // Aggiornamento form quando cambiano i dati
  useEffect(() => {
    if (config) {
      // Email form
      if (config.email) {
        emailForm.reset({
          enabled: config.email.enabled,
          provider: config.email.provider,
          host: config.email.host || "",
          port: config.email.port || 587,
          secure: config.email.secure,
          username: config.email.username || "",
          password: config.email.password || "",
          from: config.email.from || "",
          sendgridApiKey: config.email.sendgridApiKey || "",
        });
      }

      // Social login form
      if (config.socialLogin) {
        socialLoginForm.reset({
          googleEnabled: config.socialLogin.googleEnabled,
          googleClientId: config.socialLogin.googleClientId || "",
          googleClientSecret: config.socialLogin.googleClientSecret || "",
          facebookEnabled: config.socialLogin.facebookEnabled,
          facebookAppId: config.socialLogin.facebookAppId || "",
          facebookAppSecret: config.socialLogin.facebookAppSecret || "",
          githubEnabled: config.socialLogin.githubEnabled,
          githubClientId: config.socialLogin.githubClientId || "",
          githubClientSecret: config.socialLogin.githubClientSecret || "",
        });
      }

      // Twilio form
      if (config.twilio) {
        twilioForm.reset({
          enabled: config.twilio.enabled,
          accountSid: config.twilio.accountSid || "",
          authToken: config.twilio.authToken || "",
          verifyServiceSid: config.twilio.verifyServiceSid || "",
          fromNumber: config.twilio.fromNumber || "",
        });
      }

      // Payment form
      if (config.payment) {
        paymentForm.reset({
          stripeEnabled: config.payment.stripeEnabled,
          stripePublicKey: config.payment.stripePublicKey || "",
          stripeSecretKey: config.payment.stripeSecretKey || "",
          paypalEnabled: config.payment.paypalEnabled,
          paypalClientId: config.payment.paypalClientId || "",
          paypalClientSecret: config.payment.paypalClientSecret || "",
        });
      }

      // Template email
      if (config.emailTemplates && config.emailTemplates[selectedTemplate]) {
        setTemplateForm({
          subject: config.emailTemplates[selectedTemplate].subject,
          body: config.emailTemplates[selectedTemplate].body,
        });
      }
    }
  }, [config, selectedTemplate]);

  // Mutazione per salvare le configurazioni
  const saveEmailConfigMutation = useMutation({
    mutationFn: async (data: z.infer<typeof emailConfigSchema>) => {
      const res = await apiRequest("PUT", "/api/admin/integrations/email", data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations"] });
      toast({
        title: "Configurazione email salvata",
        description: "Le impostazioni sono state aggiornate con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: "Impossibile salvare le impostazioni: " + error.message,
        variant: "destructive",
      });
    },
  });

  const saveSocialLoginConfigMutation = useMutation({
    mutationFn: async (data: z.infer<typeof socialLoginSchema>) => {
      const res = await apiRequest("PUT", "/api/admin/integrations/social-login", data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations"] });
      toast({
        title: "Configurazione social login salvata",
        description: "Le impostazioni sono state aggiornate con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: "Impossibile salvare le impostazioni: " + error.message,
        variant: "destructive",
      });
    },
  });

  const saveTwilioConfigMutation = useMutation({
    mutationFn: async (data: z.infer<typeof twilioSchema>) => {
      const res = await apiRequest("PUT", "/api/admin/integrations/twilio", data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations"] });
      toast({
        title: "Configurazione Twilio salvata",
        description: "Le impostazioni sono state aggiornate con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: "Impossibile salvare le impostazioni: " + error.message,
        variant: "destructive",
      });
    },
  });

  const savePaymentConfigMutation = useMutation({
    mutationFn: async (data: z.infer<typeof paymentSchema>) => {
      const res = await apiRequest("PUT", "/api/admin/integrations/payment", data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations"] });
      toast({
        title: "Configurazione pagamenti salvata",
        description: "Le impostazioni sono state aggiornate con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: "Impossibile salvare le impostazioni: " + error.message,
        variant: "destructive",
      });
    },
  });

  const saveEmailTemplateMutation = useMutation({
    mutationFn: async (data: { name: string, subject: string, body: string }) => {
      const res = await apiRequest("PUT", "/api/admin/integrations/email-template", data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations"] });
      toast({
        title: "Template email salvato",
        description: "Il template è stato aggiornato con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: "Impossibile salvare il template: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Invio email di test
  const sendTestEmailMutation = useMutation({
    mutationFn: async (data: { email: string, templateName: string }) => {
      const res = await apiRequest("POST", "/api/admin/integrations/test-email", data);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Email di test inviata",
        description: "L'email è stata inviata con successo. Controlla la tua casella di posta.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: "Impossibile inviare l'email di test: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Invio SMS di test
  const sendTestSMSMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string }) => {
      const res = await apiRequest("POST", "/api/admin/integrations/test-sms", data);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "SMS di test inviato",
        description: "L'SMS è stato inviato con successo. Controlla il tuo telefono.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: "Impossibile inviare l'SMS di test: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Gestione submit dei form
  const onSubmitEmailConfig = (data: z.infer<typeof emailConfigSchema>) => {
    saveEmailConfigMutation.mutate(data);
  };

  const onSubmitSocialLoginConfig = (data: z.infer<typeof socialLoginSchema>) => {
    saveSocialLoginConfigMutation.mutate(data);
  };

  const onSubmitTwilioConfig = (data: z.infer<typeof twilioSchema>) => {
    saveTwilioConfigMutation.mutate(data);
  };

  const onSubmitPaymentConfig = (data: z.infer<typeof paymentSchema>) => {
    savePaymentConfigMutation.mutate(data);
  };

  const handleTemplateChange = (templateName: string) => {
    setSelectedTemplate(templateName);
    if (config?.emailTemplates && config.emailTemplates[templateName]) {
      setTemplateForm({
        subject: config.emailTemplates[templateName].subject,
        body: config.emailTemplates[templateName].body,
      });
    } else {
      // Default empty template
      setTemplateForm({
        subject: "",
        body: "",
      });
    }
  };

  const handleTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveEmailTemplateMutation.mutate({
      name: selectedTemplate,
      subject: templateForm.subject,
      body: templateForm.body,
    });
  };

  const handleTestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress) {
      toast({
        title: "Errore",
        description: "Inserisci un indirizzo email valido",
        variant: "destructive",
      });
      return;
    }
    sendTestEmailMutation.mutate({
      email: testEmailAddress,
      templateName: selectedTemplate,
    });
  };

  const handleTestSMS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhoneNumber) {
      toast({
        title: "Errore",
        description: "Inserisci un numero di telefono valido",
        variant: "destructive",
      });
      return;
    }
    sendTestSMSMutation.mutate({
      phoneNumber: testPhoneNumber,
    });
  };

  // Template email disponibili
  const emailTemplates = [
    { id: "welcome", name: "Benvenuto" },
    { id: "passwordReset", name: "Reset Password" },
    { id: "verifyEmail", name: "Verifica Email" },
    { id: "accountLocked", name: "Account Bloccato" },
    { id: "passwordExpiring", name: "Password in Scadenza" },
    { id: "contactRequest", name: "Richiesta Informazioni" },
  ];

  return (
    <div className="flex h-full min-h-screen bg-neutral-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col pl-64 pb-16">
        <AdminHeader user={user} />
        <div className="flex-1 p-4">
          <h1 className="text-3xl font-bold mb-6">Integrazioni</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 grid grid-cols-4 w-full">
              <TabsTrigger value="email" className="flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="twilio" className="flex items-center">
                <MessageSquare className="mr-2 h-4 w-4" />
                SMS/Twilio
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center">
                <ExternalLink className="mr-2 h-4 w-4" />
                Social Login
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                Pagamenti
              </TabsTrigger>
            </TabsList>

            {/* Tab Email */}
            <TabsContent value="email">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Configurazione Email */}
                <Card>
                  <CardHeader>
                    <CardTitle>Configurazione Email</CardTitle>
                    <CardDescription>
                      Configura il servizio di invio email per le notifiche di sistema.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...emailForm}>
                      <form onSubmit={emailForm.handleSubmit(onSubmitEmailConfig)} className="space-y-4">
                        <FormField
                          control={emailForm.control}
                          name="enabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Abilita servizio email</FormLabel>
                                <FormDescription>
                                  Attiva il servizio per l'invio di email dal sistema.
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
                          control={emailForm.control}
                          name="provider"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Provider</FormLabel>
                              <div className="flex items-center space-x-2">
                                <Button
                                  type="button"
                                  variant={field.value === "smtp" ? "default" : "outline"}
                                  onClick={() => emailForm.setValue("provider", "smtp")}
                                >
                                  SMTP
                                </Button>
                                <Button
                                  type="button"
                                  variant={field.value === "sendgrid" ? "default" : "outline"}
                                  onClick={() => emailForm.setValue("provider", "sendgrid")}
                                >
                                  SendGrid
                                </Button>
                              </div>
                            </FormItem>
                          )}
                        />

                        {emailForm.watch("provider") === "smtp" ? (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={emailForm.control}
                                name="host"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Host SMTP</FormLabel>
                                    <FormControl>
                                      <Input placeholder="smtp.example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={emailForm.control}
                                name="port"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Porta</FormLabel>
                                    <FormControl>
                                      <Input type="number" placeholder="587" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={emailForm.control}
                              name="secure"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 rounded-md border p-3">
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>Usa SSL/TLS</FormLabel>
                                    <FormDescription>
                                      Usa una connessione sicura per l'invio delle email.
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={emailForm.control}
                              name="username"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Username</FormLabel>
                                  <FormControl>
                                    <Input placeholder="email@example.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={emailForm.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Password</FormLabel>
                                  <FormControl>
                                    <Input type="password" placeholder="******" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        ) : (
                          <FormField
                            control={emailForm.control}
                            name="sendgridApiKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>API Key SendGrid</FormLabel>
                                <FormControl>
                                  <Input placeholder="SG.xxxxxxxx" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={emailForm.control}
                          name="from"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Indirizzo mittente</FormLabel>
                              <FormControl>
                                <Input placeholder="noreply@tuodominio.com" {...field} />
                              </FormControl>
                              <FormDescription>
                                Questo indirizzo sarà usato come mittente per tutte le email inviate.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          className="w-full mt-6"
                          disabled={saveEmailConfigMutation.isPending}
                        >
                          Salva configurazione
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                {/* Template Email */}
                <Card>
                  <CardHeader>
                    <CardTitle>Template Email</CardTitle>
                    <CardDescription>
                      Gestisci i template delle email inviate dal sistema.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {emailTemplates.map((template) => (
                          <Button
                            key={template.id}
                            variant={selectedTemplate === template.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleTemplateChange(template.id)}
                          >
                            {template.name}
                          </Button>
                        ))}
                      </div>

                      <form onSubmit={handleTemplateSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="subject">Oggetto</Label>
                          <Input
                            id="subject"
                            value={templateForm.subject}
                            onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})}
                            placeholder="Oggetto dell'email"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="body">Contenuto</Label>
                          <Textarea
                            id="body"
                            value={templateForm.body}
                            onChange={(e) => setTemplateForm({...templateForm, body: e.target.value})}
                            placeholder="Contenuto dell'email in formato HTML"
                            className="min-h-[200px] font-mono text-sm"
                          />
                          <p className="text-sm text-gray-500">
                            Variabili disponibili: {"{nome}"}, {"{email}"}, {"{link}"}
                          </p>
                        </div>

                        <div className="flex justify-between mt-6">
                          <Button 
                            type="submit" 
                            disabled={saveEmailTemplateMutation.isPending}
                          >
                            Salva template
                          </Button>

                          <div className="flex items-center space-x-2">
                            <Input
                              placeholder="test@example.com"
                              value={testEmailAddress}
                              onChange={(e) => setTestEmailAddress(e.target.value)}
                              className="w-48"
                            />
                            <Button 
                              type="button"
                              variant="outline"
                              onClick={handleTestEmail}
                              disabled={sendTestEmailMutation.isPending || !emailForm.watch("enabled")}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Test
                            </Button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab Twilio */}
            <TabsContent value="twilio">
              <Card>
                <CardHeader>
                  <CardTitle>Configurazione SMS (Twilio)</CardTitle>
                  <CardDescription>
                    Configura Twilio per la verifica del numero di telefono e l'invio di SMS.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...twilioForm}>
                    <form onSubmit={twilioForm.handleSubmit(onSubmitTwilioConfig)} className="space-y-4">
                      <FormField
                        control={twilioForm.control}
                        name="enabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Abilita Twilio</FormLabel>
                              <FormDescription>
                                Attiva Twilio per la verifica dei numeri di telefono e l'invio di SMS.
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={twilioForm.control}
                          name="accountSid"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account SID</FormLabel>
                              <FormControl>
                                <Input placeholder="ACxxxxxxxx" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={twilioForm.control}
                          name="authToken"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Auth Token</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="xxxxxxxx" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={twilioForm.control}
                        name="verifyServiceSid"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Verify Service SID</FormLabel>
                            <FormControl>
                              <Input placeholder="VAxxxxxxxx" {...field} />
                            </FormControl>
                            <FormDescription>
                              Il SID del servizio Verify di Twilio per la verifica dei numeri di telefono.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={twilioForm.control}
                        name="fromNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Numero mittente</FormLabel>
                            <FormControl>
                              <Input placeholder="+1234567890" {...field} />
                            </FormControl>
                            <FormDescription>
                              Il numero di telefono da cui inviare gli SMS (deve essere registrato su Twilio).
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-between mt-6">
                        <Button 
                          type="submit" 
                          disabled={saveTwilioConfigMutation.isPending}
                        >
                          Salva configurazione
                        </Button>

                        <div className="flex items-center space-x-2">
                          <Input
                            placeholder="+39123456789"
                            value={testPhoneNumber}
                            onChange={(e) => setTestPhoneNumber(e.target.value)}
                            className="w-48"
                          />
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={handleTestSMS}
                            disabled={sendTestSMSMutation.isPending || !twilioForm.watch("enabled")}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Test SMS
                          </Button>
                        </div>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Social Login */}
            <TabsContent value="social">
              <Card>
                <CardHeader>
                  <CardTitle>Configurazione Social Login</CardTitle>
                  <CardDescription>
                    Configura le integrazioni con i social network per permettere agli utenti di accedere con i loro account social.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...socialLoginForm}>
                    <form onSubmit={socialLoginForm.handleSubmit(onSubmitSocialLoginConfig)} className="space-y-6">
                      {/* Google */}
                      <div className="rounded-lg border p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Google className="h-5 w-5 text-red-500" />
                            <h3 className="text-lg font-medium">Google</h3>
                          </div>
                          <FormField
                            control={socialLoginForm.control}
                            name="googleEnabled"
                            render={({ field }) => (
                              <FormItem>
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
                            control={socialLoginForm.control}
                            name="googleClientId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Client ID</FormLabel>
                                <FormControl>
                                  <Input {...field} disabled={!socialLoginForm.watch("googleEnabled")} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={socialLoginForm.control}
                            name="googleClientSecret"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Client Secret</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    {...field} 
                                    disabled={!socialLoginForm.watch("googleEnabled")} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Facebook */}
                      <div className="rounded-lg border p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Facebook className="h-5 w-5 text-blue-600" />
                            <h3 className="text-lg font-medium">Facebook</h3>
                          </div>
                          <FormField
                            control={socialLoginForm.control}
                            name="facebookEnabled"
                            render={({ field }) => (
                              <FormItem>
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
                            control={socialLoginForm.control}
                            name="facebookAppId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>App ID</FormLabel>
                                <FormControl>
                                  <Input {...field} disabled={!socialLoginForm.watch("facebookEnabled")} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={socialLoginForm.control}
                            name="facebookAppSecret"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>App Secret</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    {...field} 
                                    disabled={!socialLoginForm.watch("facebookEnabled")} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* GitHub */}
                      <div className="rounded-lg border p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Github className="h-5 w-5" />
                            <h3 className="text-lg font-medium">GitHub</h3>
                          </div>
                          <FormField
                            control={socialLoginForm.control}
                            name="githubEnabled"
                            render={({ field }) => (
                              <FormItem>
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
                            control={socialLoginForm.control}
                            name="githubClientId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Client ID</FormLabel>
                                <FormControl>
                                  <Input {...field} disabled={!socialLoginForm.watch("githubEnabled")} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={socialLoginForm.control}
                            name="githubClientSecret"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Client Secret</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    {...field} 
                                    disabled={!socialLoginForm.watch("githubEnabled")} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={saveSocialLoginConfigMutation.isPending}
                      >
                        Salva configurazione
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Pagamenti */}
            <TabsContent value="payment">
              <Card>
                <CardHeader>
                  <CardTitle>Configurazione Pagamenti</CardTitle>
                  <CardDescription>
                    Configura i gateway di pagamento per accettare pagamenti online.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...paymentForm}>
                    <form onSubmit={paymentForm.handleSubmit(onSubmitPaymentConfig)} className="space-y-6">
                      {/* Stripe */}
                      <div className="rounded-lg border p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <svg viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg" width="60" height="25" className="UserLogo variant-- ">
                              <title>Stripe logo</title>
                              <path fill="#635BFF" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.02-13.17 4.02-.86v3.54h3.14V9.1h-3.14v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C1.26 16.33.13 16.16.13 12.82c0-2.95 2.4-4.67 5.57-4.67 1.37 0 2.75.32 3.81.8v3.8a9.23 9.23 0 0 0-3.81-1.02c-.89 0-1.44.25-1.44.9 0 1.85 5.2 2.07 5.2 5.95z" fillRule="evenodd"></path>
                            </svg>
                          </div>
                          <FormField
                            control={paymentForm.control}
                            name="stripeEnabled"
                            render={({ field }) => (
                              <FormItem>
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
                            control={paymentForm.control}
                            name="stripePublicKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Chiave pubblica (Publishable Key)</FormLabel>
                                <FormControl>
                                  <Input placeholder="pk_..." {...field} disabled={!paymentForm.watch("stripeEnabled")} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={paymentForm.control}
                            name="stripeSecretKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Chiave segreta (Secret Key)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    placeholder="sk_..." 
                                    {...field} 
                                    disabled={!paymentForm.watch("stripeEnabled")} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* PayPal */}
                      <div className="rounded-lg border p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="25" viewBox="0 0 124.7 33.1">
                              <path d="M48 6.9H39c-.6 0-1.1.5-1.2 1.1l-3.5 22.1c-.1.4.2.8.6.8h4.2c.6 0 1.1-.5 1.2-1.1l.9-5.9c.1-.6.6-1.1 1.2-1.1h2.9c5.8 0 9.2-2.8 10-8.3.4-2.4 0-4.4-1.1-5.7-1.3-1.4-3.5-1.9-6.2-1.9zm1 8.2c-.5 3-2.8 3-5.1 3h-1.3l.9-5.7c.1-.3.4-.5.6-.5h.6c1.6 0 3 0 3.8.9.4.5.6 1.3.5 2.3zm24.1-.1h-4.2c-.3 0-.5.2-.6.5l-.2 1-.2-.4c-.8-1.2-2.4-1.5-4.1-1.5-3.8 0-7.1 2.9-7.7 7-.3 2 .1 4 1.3 5.4 1.1 1.2 2.6 1.8 4.5 1.8 3.2 0 4.9-2 4.9-2l-.2 1c-.1.4.2.8.6.8h3.8c.6 0 1.1-.5 1.2-1.1l2.3-14.4c0-.3-.2-.6-.4-.7.1.1 0 .1-.8.1zm-5.8 8.2c-.3 2-2 3.3-4 3.3-1 0-1.9-.3-2.4-1-.5-.6-.7-1.5-.6-2.5.3-1.9 2-3.3 3.9-3.3 1 0 1.8.3 2.4.9.6.7.8 1.6.7 2.6zm27-8.3h-4.2c-.4 0-.8.2-1 .5l-5.8 8.6-2.5-8.3c-.2-.5-.6-.8-1.1-.8h-4.1c-.5 0-.8.5-.7 1l4.6 13.5-4.3 6.1c-.3.5 0 1.1.5 1.1h4.2c.4 0 .8-.2 1-.5l13.9-20c.4-.5 0-1.2-.5-1.2z" fill="#253B80"/>
                              <path d="M94.6 6.9h-9c-.6 0-1.1.5-1.2 1.1l-3.5 22.1c-.1.4.2.8.6.8h4.6c.4 0 .7-.3.8-.7l1-6.3c.1-.6.6-1.1 1.2-1.1h2.9c5.8 0 9.2-2.8 10-8.3.4-2.4 0-4.4-1.1-5.7-1.3-1.4-3.6-1.9-6.3-1.9zm1 8.2c-.5 3-2.8 3-5.1 3h-1.3l.9-5.7c.1-.3.4-.5.6-.5h.6c1.6 0 3 0 3.8.9.5.5.6 1.3.5 2.3zm24.1-.1h-4.2c-.3 0-.5.2-.6.5l-.2 1-.2-.4c-.8-1.2-2.4-1.5-4.1-1.5-3.8 0-7.1 2.9-7.7 7-.3 2 .1 4 1.3 5.4 1.1 1.2 2.6 1.8 4.5 1.8 3.2 0 4.9-2 4.9-2l-.2 1c-.1.4.2.8.6.8h3.8c.6 0 1.1-.5 1.2-1.1l2.3-14.4c.1-.4-.2-.7-.4-.8-.1-.3-.2-.3-1-.3zm-5.9 8.2c-.3 2-2 3.3-4 3.3-1 0-1.9-.3-2.4-1-.5-.6-.7-1.5-.6-2.5.3-1.9 2-3.3 3.9-3.3 1 0 1.8.3 2.4.9.6.7.9 1.6.7 2.6zm11.9-15.4l-3.6 22.6c-.1.4.2.8.6.8h3.6c.6 0 1.1-.5 1.2-1.1l3.5-22.1c.1-.4-.2-.8-.6-.8h-4c-.3 0-.6.2-.7.6z" fill="#179BD7"/>
                              <path d="M8.5 6.9H-.5c-.6 0-1.1.5-1.2 1.1l-3.5 22.1c-.1.4.2.8.6.8h4.1c.6 0 1.1-.5 1.2-1.1l1-6c.1-.6.6-1.1 1.2-1.1h2.9c5.8 0 9.2-2.8 10-8.3.4-2.4 0-4.4-1.1-5.7-1.3-1.4-3.5-1.8-6.2-1.8zm1 8.2c-.5 3-2.8 3-5.1 3H3.1l.9-5.7c.1-.3.4-.5.6-.5h.6c1.6 0 3 0 3.8.9.5.5.6 1.3.5 2.3zm24.1-.1h-4.2c-.3 0-.5.2-.6.5l-.2 1-.2-.4c-.8-1.1-2.4-1.5-4.1-1.5-3.8 0-7.1 2.9-7.7 7-.3 2 .1 4 1.3 5.4 1.1 1.2 2.6 1.8 4.5 1.8 3.2 0 4.9-2 4.9-2l-.2 1c-.1.4.2.8.6.8h3.8c.6 0 1.1-.5 1.2-1.1L33 15c.1-.3-.1-.7-.4-.7.1.1-.1.1-1 .1zm-5.9 8.2c-.3 2-2 3.3-4 3.3-1 0-1.9-.3-2.4-1-.5-.6-.7-1.5-.6-2.5.3-1.9 2-3.3 3.9-3.3 1 0 1.8.3 2.4.9.6.7.8 1.6.7 2.6zm27.1-8.3h-4.2c-.4 0-.8.2-1 .5l-5.8 8.6-2.5-8.3c-.2-.5-.6-.8-1.1-.8h-4.1c-.5 0-.8.5-.7 1l4.6 13.5-4.3 6.1c-.3.5 0 1.1.5 1.1h4.2c.4 0 .8-.2 1-.5l13.9-20c.3-.5 0-1.2-.5-1.2z" fill="#253B80"/>
                            </svg>
                          </div>
                          <FormField
                            control={paymentForm.control}
                            name="paypalEnabled"
                            render={({ field }) => (
                              <FormItem>
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
                            control={paymentForm.control}
                            name="paypalClientId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Client ID</FormLabel>
                                <FormControl>
                                  <Input {...field} disabled={!paymentForm.watch("paypalEnabled")} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={paymentForm.control}
                            name="paypalClientSecret"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Client Secret</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    {...field} 
                                    disabled={!paymentForm.watch("paypalEnabled")} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={savePaymentConfigMutation.isPending}
                      >
                        Salva configurazione
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}