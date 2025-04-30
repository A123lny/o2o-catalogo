import { useState, useEffect } from "react";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Cog,
  Mail,
  Phone,
  Facebook,
  Github,
  CreditCard,
  Send,
  Loader2,
  Save,
  AlertTriangle,
  CheckCircle,
  DollarSign,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label";
import { FaGoogle } from "react-icons/fa";

// Schema per la configurazione email
const emailConfigSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.string().default("smtp"),
  host: z.string().optional(),
  port: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  from: z.string().optional(),
  smtpSecure: z.boolean().default(true),
  sendgridApiKey: z.string().optional(),
});

// Schema per template email
const emailTemplateSchema = z.object({
  name: z.string().min(1, "Il nome del template è obbligatorio"),
  subject: z.string().min(1, "L'oggetto è obbligatorio"),
  body: z.string().min(1, "Il corpo del messaggio è obbligatorio"),
});

// Schema per Twilio
const twilioConfigSchema = z.object({
  enabled: z.boolean().default(false),
  accountSid: z.string().optional(),
  authToken: z.string().optional(),
  phoneNumber: z.string().optional(),
  verifyServiceSid: z.string().optional(),
});

// Schema per Social Login
const socialLoginConfigSchema = z.object({
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

// Schema per i sistemi di pagamento
const paymentConfigSchema = z.object({
  stripeEnabled: z.boolean().default(false),
  stripePublicKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  paypalEnabled: z.boolean().default(false),
  paypalClientId: z.string().optional(),
  paypalClientSecret: z.string().optional(),
});

// Schema per test email
const testEmailSchema = z.object({
  to: z.string().email("Inserisci un indirizzo email valido"),
  templateName: z.string().min(1, "Seleziona un template"),
});

// Schema per test SMS
const testSmsSchema = z.object({
  to: z.string().min(1, "Inserisci un numero di telefono"),
});

export default function IntegrationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [emailTemplate, setEmailTemplate] = useState<string>("");
  const [testEmailModalOpen, setTestEmailModalOpen] = useState(false);
  const [testSmsModalOpen, setTestSmsModalOpen] = useState(false);

  // Fetch delle configurazioni delle integrazioni
  const { data: integrations, isLoading } = useQuery({
    queryKey: ['/api/admin/integrations'],
    queryFn: async () => {
      const response = await fetch('/api/admin/integrations');
      if (!response.ok) throw new Error('Errore nel recupero delle integrazioni');
      return response.json();
    },
  });

  // Form per la configurazione email
  const emailForm = useForm({
    resolver: zodResolver(emailConfigSchema),
    defaultValues: {
      enabled: false,
      provider: "smtp",
      host: "",
      port: "",
      username: "",
      password: "",
      from: "",
      smtpSecure: true,
      sendgridApiKey: "",
    },
  });

  // Aggiorniamo i valori predefiniti quando arrivano i dati
  useEffect(() => {
    if (integrations?.email) {
      emailForm.reset({
        enabled: integrations.email.enabled,
        provider: integrations.email.provider || "smtp",
        host: integrations.email.host || "",
        port: integrations.email.port || "",
        username: integrations.email.username || "",
        password: integrations.email.password || "",
        from: integrations.email.from || "",
        smtpSecure: integrations.email.smtpSecure !== false,
        sendgridApiKey: integrations.email.sendgridApiKey || "",
      });
    }
  }, [integrations?.email]);

  // Form per il template email
  const emailTemplateForm = useForm({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      name: "",
      subject: "",
      body: "",
    },
  });

  // Aggiorniamo i valori del template quando viene selezionato
  useEffect(() => {
    if (emailTemplate && integrations?.emailTemplates && integrations.emailTemplates[emailTemplate]) {
      const template = integrations.emailTemplates[emailTemplate];
      emailTemplateForm.reset({
        name: emailTemplate,
        subject: template.subject,
        body: template.body,
      });
    } else {
      emailTemplateForm.reset({
        name: emailTemplate || "",
        subject: "",
        body: "",
      });
    }
  }, [emailTemplate, integrations?.emailTemplates]);

  // Form per la configurazione Twilio
  const twilioForm = useForm({
    resolver: zodResolver(twilioConfigSchema),
    defaultValues: {
      enabled: false,
      accountSid: "",
      authToken: "",
      phoneNumber: "",
      verifyServiceSid: "",
    },
  });

  // Aggiorniamo i valori predefiniti di Twilio
  useEffect(() => {
    if (integrations?.twilio) {
      twilioForm.reset({
        enabled: integrations.twilio.enabled,
        accountSid: integrations.twilio.accountSid || "",
        authToken: integrations.twilio.authToken || "",
        phoneNumber: integrations.twilio.phoneNumber || "",
        verifyServiceSid: integrations.twilio.verifyServiceSid || "",
      });
    }
  }, [integrations?.twilio]);

  // Form per i Social Login
  const socialLoginForm = useForm({
    resolver: zodResolver(socialLoginConfigSchema),
    defaultValues: {
      googleEnabled: false,
      googleClientId: "",
      googleClientSecret: "",
      facebookEnabled: false,
      facebookAppId: "",
      facebookAppSecret: "",
      githubEnabled: false,
      githubClientId: "",
      githubClientSecret: "",
    },
  });

  // Aggiorniamo i valori predefiniti dei Social Login
  useEffect(() => {
    if (integrations?.socialLogin) {
      socialLoginForm.reset({
        googleEnabled: integrations.socialLogin.googleEnabled,
        googleClientId: integrations.socialLogin.googleClientId || "",
        googleClientSecret: integrations.socialLogin.googleClientSecret || "",
        facebookEnabled: integrations.socialLogin.facebookEnabled,
        facebookAppId: integrations.socialLogin.facebookAppId || "",
        facebookAppSecret: integrations.socialLogin.facebookAppSecret || "",
        githubEnabled: integrations.socialLogin.githubEnabled,
        githubClientId: integrations.socialLogin.githubClientId || "",
        githubClientSecret: integrations.socialLogin.githubClientSecret || "",
      });
    }
  }, [integrations?.socialLogin]);

  // Form per la configurazione dei pagamenti
  const paymentForm = useForm({
    resolver: zodResolver(paymentConfigSchema),
    defaultValues: {
      stripeEnabled: false,
      stripePublicKey: "",
      stripeSecretKey: "",
      paypalEnabled: false,
      paypalClientId: "",
      paypalClientSecret: "",
    },
  });

  // Aggiorniamo i valori predefiniti dei Pagamenti
  useEffect(() => {
    if (integrations?.payment) {
      paymentForm.reset({
        stripeEnabled: integrations.payment.stripeEnabled,
        stripePublicKey: integrations.payment.stripePublicKey || "",
        stripeSecretKey: integrations.payment.stripeSecretKey || "",
        paypalEnabled: integrations.payment.paypalEnabled,
        paypalClientId: integrations.payment.paypalClientId || "",
        paypalClientSecret: integrations.payment.paypalClientSecret || "",
      });
    }
  }, [integrations?.payment]);

  // Form per il test email
  const testEmailForm = useForm({
    resolver: zodResolver(testEmailSchema),
    defaultValues: {
      to: user?.email || "",
      templateName: "",
    },
  });

  // Form per il test SMS
  const testSmsForm = useForm({
    resolver: zodResolver(testSmsSchema),
    defaultValues: {
      to: "",
    },
  });

  // Mutation per salvare la configurazione email
  const saveEmailConfigMutation = useMutation({
    mutationFn: async (data: z.infer<typeof emailConfigSchema>) => {
      return apiRequest("PUT", "/api/admin/integrations/email", data);
    },
    onSuccess: () => {
      toast({
        title: "Configurazione email salvata",
        description: "La configurazione email è stata salvata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/integrations'] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio della configurazione email.",
        variant: "destructive",
      });
    },
  });

  // Mutation per salvare il template email
  const saveEmailTemplateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof emailTemplateSchema>) => {
      return apiRequest("PUT", "/api/admin/integrations/email-template", data);
    },
    onSuccess: () => {
      toast({
        title: "Template email salvato",
        description: "Il template email è stato salvato con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/integrations'] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio del template email.",
        variant: "destructive",
      });
    },
  });

  // Mutation per salvare la configurazione Twilio
  const saveTwilioConfigMutation = useMutation({
    mutationFn: async (data: z.infer<typeof twilioConfigSchema>) => {
      return apiRequest("PUT", "/api/admin/integrations/twilio", data);
    },
    onSuccess: () => {
      toast({
        title: "Configurazione Twilio salvata",
        description: "La configurazione Twilio è stata salvata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/integrations'] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio della configurazione Twilio.",
        variant: "destructive",
      });
    },
  });

  // Mutation per salvare la configurazione Social Login
  const saveSocialLoginConfigMutation = useMutation({
    mutationFn: async (data: z.infer<typeof socialLoginConfigSchema>) => {
      return apiRequest("PUT", "/api/admin/integrations/social-login", data);
    },
    onSuccess: () => {
      toast({
        title: "Configurazione Social Login salvata",
        description: "La configurazione Social Login è stata salvata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/integrations'] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio della configurazione Social Login.",
        variant: "destructive",
      });
    },
  });

  // Mutation per salvare la configurazione Pagamenti
  const savePaymentConfigMutation = useMutation({
    mutationFn: async (data: z.infer<typeof paymentConfigSchema>) => {
      return apiRequest("PUT", "/api/admin/integrations/payment", data);
    },
    onSuccess: () => {
      toast({
        title: "Configurazione Pagamenti salvata",
        description: "La configurazione dei Pagamenti è stata salvata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/integrations'] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio della configurazione Pagamenti.",
        variant: "destructive",
      });
    },
  });

  // Mutation per inviare l'email di test
  const sendTestEmailMutation = useMutation({
    mutationFn: async (data: z.infer<typeof testEmailSchema>) => {
      return apiRequest("POST", "/api/admin/integrations/test-email", data);
    },
    onSuccess: () => {
      toast({
        title: "Email di test inviata",
        description: "L'email di test è stata inviata con successo.",
      });
      setTestEmailModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'invio dell'email di test.",
        variant: "destructive",
      });
    },
  });

  // Mutation per inviare l'SMS di test
  const sendTestSmsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof testSmsSchema>) => {
      return apiRequest("POST", "/api/admin/integrations/test-sms", data);
    },
    onSuccess: () => {
      toast({
        title: "SMS di test inviato",
        description: "L'SMS di test è stato inviato con successo.",
      });
      setTestSmsModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'invio dell'SMS di test.",
        variant: "destructive",
      });
    },
  });

  // Handler per il form email
  const onEmailSubmit = (data: z.infer<typeof emailConfigSchema>) => {
    saveEmailConfigMutation.mutate(data);
  };

  // Handler per il form template email
  const onEmailTemplateSubmit = (data: z.infer<typeof emailTemplateSchema>) => {
    saveEmailTemplateMutation.mutate(data);
  };

  // Handler per il form Twilio
  const onTwilioSubmit = (data: z.infer<typeof twilioConfigSchema>) => {
    saveTwilioConfigMutation.mutate(data);
  };

  // Handler per il form Social Login
  const onSocialLoginSubmit = (data: z.infer<typeof socialLoginConfigSchema>) => {
    saveSocialLoginConfigMutation.mutate(data);
  };

  // Handler per il form Pagamenti
  const onPaymentSubmit = (data: z.infer<typeof paymentConfigSchema>) => {
    savePaymentConfigMutation.mutate(data);
  };

  // Handler per il form test email
  const onTestEmailSubmit = (data: z.infer<typeof testEmailSchema>) => {
    sendTestEmailMutation.mutate(data);
  };

  // Handler per il form test SMS
  const onTestSmsSubmit = (data: z.infer<typeof testSmsSchema>) => {
    sendTestSmsMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <div className="pl-64 pb-16">
        <AdminHeader title="Integrazioni" description="Configura le integrazioni con servizi esterni" icon={<Cog className="w-8 h-8" />} />

        <main className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Caricamento integrazioni...</span>
            </div>
          ) : (
            <Tabs defaultValue="email">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="twilio">SMS/Telefono</TabsTrigger>
                <TabsTrigger value="social">Social Login</TabsTrigger>
                <TabsTrigger value="payment">Pagamenti</TabsTrigger>
                <TabsTrigger value="templates">Template Email</TabsTrigger>
              </TabsList>

              {/* Tab Email */}
              <TabsContent value="email">
                <Card>
                  <CardHeader>
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 mr-2" />
                      <CardTitle>Configurazione Email</CardTitle>
                    </div>
                    <CardDescription>
                      Configura il sistema di invio email. Le email verranno utilizzate per notifiche e comunicazioni con gli utenti.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...emailForm}>
                      <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                        <FormField
                          control={emailForm.control}
                          name="enabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Abilita invio email</FormLabel>
                                <FormDescription>
                                  Quando abilitato, il sistema potrà inviare email automatiche.
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
                              <div className="flex space-x-4">
                                <div className={`cursor-pointer p-4 border rounded-md ${field.value === "smtp" ? "bg-primary/10 border-primary" : ""}`} onClick={() => field.onChange("smtp")}>
                                  <div className="flex items-center">
                                    <Mail className="h-5 w-5 mr-2" />
                                    <span>SMTP</span>
                                  </div>
                                </div>
                                <div className={`cursor-pointer p-4 border rounded-md ${field.value === "sendgrid" ? "bg-primary/10 border-primary" : ""}`} onClick={() => field.onChange("sendgrid")}>
                                  <div className="flex items-center">
                                    <Mail className="h-5 w-5 mr-2" />
                                    <span>SendGrid</span>
                                  </div>
                                </div>
                              </div>
                              <FormDescription>
                                Seleziona il provider di servizi email da utilizzare.
                              </FormDescription>
                              <FormMessage />
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
                                    <FormLabel>Porta SMTP</FormLabel>
                                    <FormControl>
                                      <Input placeholder="587" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={emailForm.control}
                                name="username"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                      <Input placeholder="user@example.com" {...field} />
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
                                      <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={emailForm.control}
                              name="smtpSecure"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Usa SSL/TLS</FormLabel>
                                    <FormDescription>
                                      Abilita la crittografia SSL/TLS per la connessione SMTP.
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      className="ml-auto"
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
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
                                  <Input type="password" placeholder="SG.xxxxxxxx" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Ottieni la tua API key dal pannello SendGrid.
                                </FormDescription>
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
                              <FormLabel>Indirizzo mittente (From)</FormLabel>
                              <FormControl>
                                <Input placeholder="noreply@tuodominio.com" {...field} />
                              </FormControl>
                              <FormDescription>
                                L'indirizzo email che verrà mostrato come mittente delle email.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-between">
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => setTestEmailModalOpen(true)}
                            disabled={!emailForm.watch("enabled")}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Invia email di test
                          </Button>
                          <Button type="submit" disabled={saveEmailConfigMutation.isPending}>
                            {saveEmailConfigMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Salvataggio...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Salva configurazione
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Twilio */}
              <TabsContent value="twilio">
                <Card>
                  <CardHeader>
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 mr-2" />
                      <CardTitle>Configurazione SMS e Telefono</CardTitle>
                    </div>
                    <CardDescription>
                      Configura Twilio per inviare SMS e verificare numeri di telefono. Utile per autenticazione a due fattori e notifiche via SMS.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...twilioForm}>
                      <form onSubmit={twilioForm.handleSubmit(onTwilioSubmit)} className="space-y-6">
                        <FormField
                          control={twilioForm.control}
                          name="enabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Abilita Twilio</FormLabel>
                                <FormDescription>
                                  Quando abilitato, il sistema potrà inviare SMS e verificare numeri di telefono.
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

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={twilioForm.control}
                            name="accountSid"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Account SID</FormLabel>
                                <FormControl>
                                  <Input placeholder="ACxxxxxxxxxxxx" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Il tuo SID account dalla dashboard Twilio.
                                </FormDescription>
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
                                  <Input type="password" placeholder="xxxxxxxxxxxxxxxx" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Il tuo token di autenticazione dalla dashboard Twilio.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={twilioForm.control}
                            name="phoneNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Numero di telefono</FormLabel>
                                <FormControl>
                                  <Input placeholder="+1234567890" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Il numero di telefono Twilio da utilizzare per inviare SMS.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={twilioForm.control}
                            name="verifyServiceSid"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Verify Service SID</FormLabel>
                                <FormControl>
                                  <Input placeholder="VAxxxxxxxxxxxxxxx" {...field} />
                                </FormControl>
                                <FormDescription>
                                  L'ID del servizio Verify se utilizzi Twilio Verify.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-between">
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => setTestSmsModalOpen(true)}
                            disabled={!twilioForm.watch("enabled")}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Invia SMS di test
                          </Button>
                          <Button type="submit" disabled={saveTwilioConfigMutation.isPending}>
                            {saveTwilioConfigMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Salvataggio...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Salva configurazione
                              </>
                            )}
                          </Button>
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
                    <div className="flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      <CardTitle>Social Login</CardTitle>
                    </div>
                    <CardDescription>
                      Configura l'accesso tramite account social media. Gli utenti potranno accedere utilizzando i loro account esistenti sui social network.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...socialLoginForm}>
                      <form onSubmit={socialLoginForm.handleSubmit(onSocialLoginSubmit)} className="space-y-6">
                        {/* Google */}
                        <div className="border rounded-lg p-4 mb-6">
                          <div className="flex items-center mb-4">
                            <FaGoogle className="text-red-500 w-5 h-5 mr-2" />
                            <h3 className="text-lg font-semibold">Google</h3>
                            <FormField
                              control={socialLoginForm.control}
                              name="googleEnabled"
                              render={({ field }) => (
                                <FormItem className="ml-auto">
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

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={socialLoginForm.control}
                              name="googleClientId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Client ID</FormLabel>
                                  <FormControl>
                                    <Input placeholder="xxxxxxxx.apps.googleusercontent.com" {...field} />
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
                                    <Input type="password" placeholder="GOCSPX-xxxxxxx" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <p className="text-sm mt-2 text-muted-foreground">
                            Ottieni le tue credenziali dalla <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary">Google Cloud Console</a>.
                          </p>
                        </div>

                        {/* Facebook */}
                        <div className="border rounded-lg p-4 mb-6">
                          <div className="flex items-center mb-4">
                            <Facebook className="text-blue-600 w-5 h-5 mr-2" />
                            <h3 className="text-lg font-semibold">Facebook</h3>
                            <FormField
                              control={socialLoginForm.control}
                              name="facebookEnabled"
                              render={({ field }) => (
                                <FormItem className="ml-auto">
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

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={socialLoginForm.control}
                              name="facebookAppId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>App ID</FormLabel>
                                  <FormControl>
                                    <Input placeholder="123456789012345" {...field} />
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
                                    <Input type="password" placeholder="abcdef1234567890" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <p className="text-sm mt-2 text-muted-foreground">
                            Ottieni le tue credenziali dal <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-primary">Facebook Developer Portal</a>.
                          </p>
                        </div>

                        {/* GitHub */}
                        <div className="border rounded-lg p-4 mb-6">
                          <div className="flex items-center mb-4">
                            <Github className="w-5 h-5 mr-2" />
                            <h3 className="text-lg font-semibold">GitHub</h3>
                            <FormField
                              control={socialLoginForm.control}
                              name="githubEnabled"
                              render={({ field }) => (
                                <FormItem className="ml-auto">
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

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={socialLoginForm.control}
                              name="githubClientId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Client ID</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Iv1.xxxxxxxxxxxxxxxx" {...field} />
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
                                    <Input type="password" placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <p className="text-sm mt-2 text-muted-foreground">
                            Ottieni le tue credenziali da <a href="https://github.com/settings/developers" target="_blank" rel="noopener noreferrer" className="text-primary">GitHub Developer Settings</a>.
                          </p>
                        </div>

                        <Button type="submit" disabled={saveSocialLoginConfigMutation.isPending}>
                          {saveSocialLoginConfigMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Salvataggio...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Salva configurazione
                            </>
                          )}
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
                    <div className="flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      <CardTitle>Sistemi di Pagamento</CardTitle>
                    </div>
                    <CardDescription>
                      Configura i gateway di pagamento per accettare pagamenti online sul tuo sito.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...paymentForm}>
                      <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-6">
                        {/* Stripe */}
                        <div className="border rounded-lg p-4 mb-6">
                          <div className="flex items-center mb-4">
                            <div className="flex-1 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" className="w-5 h-5 text-indigo-600 mr-2" fill="currentColor">
                                <path d="M165 144.7l-43.3 9.2-.2 142.4c0 26.3 19.8 43.3 46.1 43.3 14.6 0 25.3-2.7 31.2-5.9v-33.8c-5.7 2.3-33.7 10.5-33.7-15.7V221h33.7v-37.8h-33.7zm89.1 51.6l-2.7-13.1H213v153.2h44.3V233.3c10.5-13.8 28.2-11.1 33.9-9.3v-40.8c-6-2.1-26.7-6-37.1 13.1zm92.3-72.3l-44.6 9.5v36.2l44.6-9.5zM44.9 228.3c0-6.9 5.8-9.6 15.1-9.7 13.5 0 30.7 4.1 44.2 11.4v-41.8c-14.7-5.8-29.4-8.1-44.1-8.1-36 0-60 18.8-60 50.2 0 49.2 67.5 41.2 67.5 62.4 0 8.2-7.1 10.9-17 10.9-14.7 0-33.7-6.1-48.6-14.2v40c16.5 7.1 33.2 10.1 48.5 10.1 36.9 0 62.3-15.8 62.3-47.8 0-52.9-67.9-43.4-67.9-63.4zM640 261.6c0-45.5-22-81.4-64.2-81.4s-67.9 35.9-67.9 81.1c0 53.5 30.3 78.2 73.5 78.2 21.2 0 37.1-4.8 49.2-11.5v-33.4c-12.1 6.1-26 9.8-43.6 9.8-17.3 0-32.5-6.1-34.5-26.9h86.9c.2-2.3.6-11.6.6-15.9zm-87.9-16.8c0-20 12.3-28.4 23.4-28.4 10.9 0 22.5 8.4 22.5 28.4zm-112.9-64.6c-17.4 0-28.6 8.2-34.8 13.9l-2.3-11H363v204.8l44.4-9.4.1-50.2c6.4 4.7 15.9 11.2 31.4 11.2 31.8 0 60.8-23.2 60.8-79.6.1-51.6-29.3-79.7-60.5-79.7zm-10.6 122.5c-10.4 0-16.6-3.8-20.9-8.4l-.3-66c4.6-5.1 11-8.8 21.2-8.8 16.2 0 27.4 18.2 27.4 41.4.1 23.9-10.9 41.8-27.4 41.8zm-126.7 33.7h44.6V183.2h-44.6z"/>
                              </svg>
                              <h3 className="text-lg font-semibold">Stripe</h3>
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

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={paymentForm.control}
                              name="stripePublicKey"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Chiave pubblica</FormLabel>
                                  <FormControl>
                                    <Input placeholder="pk_test_..." {...field} />
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
                                  <FormLabel>Chiave segreta</FormLabel>
                                  <FormControl>
                                    <Input type="password" placeholder="sk_test_..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <p className="text-sm mt-2 text-muted-foreground">
                            Ottieni le tue chiavi API dalla <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary">Dashboard Stripe</a>.
                          </p>
                        </div>

                        {/* PayPal */}
                        <div className="border rounded-lg p-4 mb-6">
                          <div className="flex items-center mb-4">
                            <div className="flex-1 flex items-center">
                              <DollarSign className="w-5 h-5 text-blue-500 mr-2" />
                              <h3 className="text-lg font-semibold">PayPal</h3>
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

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={paymentForm.control}
                              name="paypalClientId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Client ID</FormLabel>
                                  <FormControl>
                                    <Input placeholder="AXxxxxxxxxxxxxxxxx" {...field} />
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
                                    <Input type="password" placeholder="EGxxxxxxxxxxxxxxxx" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <p className="text-sm mt-2 text-muted-foreground">
                            Ottieni le tue credenziali dal <a href="https://developer.paypal.com/developer/applications" target="_blank" rel="noopener noreferrer" className="text-primary">PayPal Developer Dashboard</a>.
                          </p>
                        </div>

                        <Button type="submit" disabled={savePaymentConfigMutation.isPending}>
                          {savePaymentConfigMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Salvataggio...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Salva configurazione
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Template Email */}
              <TabsContent value="templates">
                <Card>
                  <CardHeader>
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 mr-2" />
                      <CardTitle>Template Email</CardTitle>
                    </div>
                    <CardDescription>
                      Gestisci i template per le email inviate dal sistema.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-4 mb-6">
                      <div className="w-1/3 border rounded-md p-4">
                        <h3 className="text-lg font-semibold mb-4">Template disponibili</h3>
                        
                        <div className="space-y-2">
                          <div className={`p-2 border rounded cursor-pointer hover:bg-accent ${emailTemplate === "welcome" ? "bg-accent" : ""}`}
                               onClick={() => setEmailTemplate("welcome")}>
                            Email di benvenuto
                          </div>
                          <div className={`p-2 border rounded cursor-pointer hover:bg-accent ${emailTemplate === "password_reset" ? "bg-accent" : ""}`}
                               onClick={() => setEmailTemplate("password_reset")}>
                            Reset password
                          </div>
                          <div className={`p-2 border rounded cursor-pointer hover:bg-accent ${emailTemplate === "verification" ? "bg-accent" : ""}`}
                               onClick={() => setEmailTemplate("verification")}>
                            Verifica email
                          </div>
                          <div className={`p-2 border rounded cursor-pointer hover:bg-accent ${emailTemplate === "request_confirmation" ? "bg-accent" : ""}`}
                               onClick={() => setEmailTemplate("request_confirmation")}>
                            Conferma richiesta
                          </div>
                          <div className={`p-2 border rounded cursor-pointer hover:bg-accent ${emailTemplate === "password_changed" ? "bg-accent" : ""}`}
                               onClick={() => setEmailTemplate("password_changed")}>
                            Password cambiata
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-2/3 border rounded-md p-4">
                        <h3 className="text-lg font-semibold mb-4">Editor template</h3>
                        
                        {emailTemplate ? (
                          <Form {...emailTemplateForm}>
                            <form onSubmit={emailTemplateForm.handleSubmit(onEmailTemplateSubmit)} className="space-y-4">
                              <FormField
                                control={emailTemplateForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nome template</FormLabel>
                                    <FormControl>
                                      <Input {...field} disabled />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={emailTemplateForm.control}
                                name="subject"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Oggetto email</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      L'oggetto che verrà mostrato nell'email.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={emailTemplateForm.control}
                                name="body"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Corpo del messaggio</FormLabel>
                                    <FormControl>
                                      <Textarea rows={12} {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      Puoi utilizzare variabili nel formato {{nomevariabile}}. Es: {{username}}, {{siteName}}, {{url}}.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <Button type="submit" disabled={saveEmailTemplateMutation.isPending}>
                                {saveEmailTemplateMutation.isPending ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Salvataggio...
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Salva template
                                  </>
                                )}
                              </Button>
                            </form>
                          </Form>
                        ) : (
                          <div className="flex items-center justify-center h-64">
                            <p className="text-muted-foreground">Seleziona un template dalla lista per modificarlo</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>

      {/* Dialog per test email */}
      <Dialog open={testEmailModalOpen} onOpenChange={setTestEmailModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invia email di test</DialogTitle>
            <DialogDescription>
              Compila i campi per inviare un'email di test e verificare la configurazione.
            </DialogDescription>
          </DialogHeader>

          <Form {...testEmailForm}>
            <form onSubmit={testEmailForm.handleSubmit(onTestEmailSubmit)} className="space-y-4">
              <FormField
                control={testEmailForm.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destinatario</FormLabel>
                    <FormControl>
                      <Input placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={testEmailForm.control}
                name="templateName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template</FormLabel>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <option value="">Seleziona un template</option>
                      {integrations?.emailTemplates && Object.keys(integrations.emailTemplates).map((key) => (
                        <option key={key} value={key}>{key}</option>
                      ))}
                    </select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setTestEmailModalOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={sendTestEmailMutation.isPending}>
                  {sendTestEmailMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Invio in corso...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Invia email di test
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog per test SMS */}
      <Dialog open={testSmsModalOpen} onOpenChange={setTestSmsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invia SMS di test</DialogTitle>
            <DialogDescription>
              Inserisci un numero di telefono per inviare un SMS di test e verificare la configurazione Twilio.
            </DialogDescription>
          </DialogHeader>

          <Form {...testSmsForm}>
            <form onSubmit={testSmsForm.handleSubmit(onTestSmsSubmit)} className="space-y-4">
              <FormField
                control={testSmsForm.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numero di telefono</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormDescription>
                      Inserisci il numero in formato internazionale (es. +39xxxxxxxxxx).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setTestSmsModalOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={sendTestSmsMutation.isPending}>
                  {sendTestSmsMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Invio in corso...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Invia SMS di test
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}