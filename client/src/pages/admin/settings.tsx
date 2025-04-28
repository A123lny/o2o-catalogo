import { useState } from "react";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Save, Cog, Mail, Globe, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";

const generalSettingsSchema = z.object({
  siteName: z.string().min(1, "Il nome del sito è obbligatorio"),
  siteDescription: z.string(),
  contactEmail: z.string().email("Inserisci un indirizzo email valido"),
  phoneNumber: z.string(),
  address: z.string(),
});

const emailSettingsSchema = z.object({
  smtpServer: z.string().min(1, "Il server SMTP è obbligatorio"),
  smtpPort: z.string().min(1, "La porta SMTP è obbligatoria"),
  smtpUsername: z.string().min(1, "Lo username SMTP è obbligatorio"),
  smtpPassword: z.string().min(1, "La password SMTP è obbligatoria"),
  emailFrom: z.string().email("Inserisci un indirizzo email valido"),
  emailReplyTo: z.string().email("Inserisci un indirizzo email valido"),
});

const securitySettingsSchema = z.object({
  enableTwoFactor: z.boolean().default(false),
  sessionTimeout: z.string().default("60"),
  allowedIps: z.string().optional(),
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;
type EmailSettingsValues = z.infer<typeof emailSettingsSchema>;
type SecuritySettingsValues = z.infer<typeof securitySettingsSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");

  const generalForm = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      siteName: "AutoPrestige",
      siteDescription: "Catalogo veicoli di lusso e sportivi",
      contactEmail: "info@autoprestige.it",
      phoneNumber: "+39 012 3456789",
      address: "Via Roma 123, Milano",
    },
  });

  const emailForm = useForm<EmailSettingsValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      smtpServer: "smtp.example.com",
      smtpPort: "587",
      smtpUsername: "user@example.com",
      smtpPassword: "••••••••",
      emailFrom: "noreply@autoprestige.it",
      emailReplyTo: "info@autoprestige.it",
    },
  });

  const securityForm = useForm<SecuritySettingsValues>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      enableTwoFactor: false,
      sessionTimeout: "60",
      allowedIps: "",
    },
  });

  const onGeneralSubmit = (data: GeneralSettingsValues) => {
    console.log("General settings submitted:", data);
    toast({
      title: "Impostazioni generali salvate",
      description: "Le impostazioni generali sono state salvate con successo.",
    });
  };

  const onEmailSubmit = (data: EmailSettingsValues) => {
    console.log("Email settings submitted:", data);
    toast({
      title: "Impostazioni email salvate",
      description: "Le impostazioni email sono state salvate con successo.",
    });
  };

  const onSecuritySubmit = (data: SecuritySettingsValues) => {
    console.log("Security settings submitted:", data);
    toast({
      title: "Impostazioni sicurezza salvate",
      description: "Le impostazioni di sicurezza sono state salvate con successo.",
    });
  };

  return (
    <div className="flex h-screen bg-neutral-100">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader user={user} />
        
        <main className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-neutral-800">Impostazioni</h1>
            <p className="text-neutral-500">Configura le impostazioni del sistema</p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="general">
                <Cog className="h-4 w-4 mr-2" /> Generali
              </TabsTrigger>
              <TabsTrigger value="email">
                <Mail className="h-4 w-4 mr-2" /> Email
              </TabsTrigger>
              <TabsTrigger value="security">
                <Lock className="h-4 w-4 mr-2" /> Sicurezza
              </TabsTrigger>
            </TabsList>
            
            {/* General Settings */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>Impostazioni Generali</CardTitle>
                  <CardDescription>
                    Configura le impostazioni di base dell'applicazione
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...generalForm}>
                    <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-4">
                      <FormField
                        control={generalForm.control}
                        name="siteName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome del Sito</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              Questo nome verrà mostrato nell'intestazione del sito e nelle email
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={generalForm.control}
                        name="siteDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrizione del Sito</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              Una breve descrizione dell'attività, utilizzata per il SEO
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={generalForm.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email di Contatto</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormDescription>
                              L'indirizzo email utilizzato per ricevere le notifiche dal sito
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={generalForm.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Numero di Telefono</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={generalForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Indirizzo</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button type="submit">
                          <Save className="h-4 w-4 mr-2" /> Salva Impostazioni
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Email Settings */}
            <TabsContent value="email">
              <Card>
                <CardHeader>
                  <CardTitle>Impostazioni Email</CardTitle>
                  <CardDescription>
                    Configura il sistema di invio email per notifiche e comunicazioni
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...emailForm}>
                    <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={emailForm.control}
                          name="smtpServer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Server SMTP</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={emailForm.control}
                          name="smtpPort"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Porta SMTP</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={emailForm.control}
                          name="smtpUsername"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username SMTP</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={emailForm.control}
                          name="smtpPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password SMTP</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={emailForm.control}
                          name="emailFrom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Da</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
                              </FormControl>
                              <FormDescription>
                                Indirizzo utilizzato come mittente delle email
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={emailForm.control}
                          name="emailReplyTo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rispondi A</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
                              </FormControl>
                              <FormDescription>
                                Indirizzo per le risposte dei destinatari
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button type="submit">
                          <Save className="h-4 w-4 mr-2" /> Salva Impostazioni
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Security Settings */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Impostazioni Sicurezza</CardTitle>
                  <CardDescription>
                    Configura i parametri di sicurezza dell'applicazione
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...securityForm}>
                    <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-4">
                      <FormField
                        control={securityForm.control}
                        name="sessionTimeout"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timeout Sessione (minuti)</FormLabel>
                            <FormControl>
                              <Input type="number" min="5" max="1440" {...field} />
                            </FormControl>
                            <FormDescription>
                              Tempo di inattività dopo il quale la sessione scade (in minuti)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={securityForm.control}
                        name="allowedIps"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IP Consentiti per Amministrazione</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Es. 192.168.1.1, 10.0.0.1" />
                            </FormControl>
                            <FormDescription>
                              Elenco separato da virgole di indirizzi IP che possono accedere al pannello di amministrazione. Lasciare vuoto per consentire tutti gli IP.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button type="submit">
                          <Save className="h-4 w-4 mr-2" /> Salva Impostazioni
                        </Button>
                      </div>
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