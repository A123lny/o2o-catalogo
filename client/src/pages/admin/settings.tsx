import { useState, useEffect } from "react";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";
import { useAuth } from "@/hooks/use-auth";
import { ProvincesSolution } from "@/components/admin/provinces-solution";
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
import { 
  Save, 
  Cog, 
  MapPin, 
  Shield, 
  List,
  Loader2
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

const generalSettingsSchema = z.object({
  siteName: z.string().min(1, "Il nome del sito è obbligatorio"),
  logoPath: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  contactEmail: z.string().email("Inserisci un indirizzo email valido").optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  vatNumber: z.string().optional().nullable(),
  socialFacebook: z.string().optional().nullable(),
  socialInstagram: z.string().optional().nullable(),
  socialLinkedin: z.string().optional().nullable(),
  footerText: z.string().optional().nullable(),
});

const securitySettingsSchema = z.object({
  minPasswordLength: z.number().min(6).max(30),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
  requireNumber: z.boolean(),
  requireSpecialChar: z.boolean(),
  passwordExpiryDays: z.number().min(0).max(365),
  passwordHistoryCount: z.number().min(0).max(20),
  enable2FA: z.boolean(),
  failedLoginAttempts: z.number().min(1).max(10),
  lockoutDurationMinutes: z.number().min(1).max(1440),
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;
type SecuritySettingsValues = z.infer<typeof securitySettingsSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch general settings
  const { data: generalSettings, isLoading: isLoadingGeneral } = useQuery({
    queryKey: ['/api/settings/general'],
    queryFn: async () => {
      const response = await fetch('/api/settings/general');
      if (!response.ok) throw new Error('Errore nel recupero delle impostazioni generali');
      return response.json();
    }
  });

  // Fetch security settings
  const { data: securitySettings, isLoading: isLoadingSecurity } = useQuery({
    queryKey: ['/api/admin/settings/security'],
    queryFn: async () => {
      const response = await fetch('/api/admin/settings/security');
      if (!response.ok) throw new Error('Errore nel recupero delle impostazioni di sicurezza');
      return response.json();
    }
  });

  // Fetch activity logs
  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['/api/admin/activity-logs'],
    queryFn: async () => {
      const response = await fetch('/api/admin/activity-logs');
      if (!response.ok) throw new Error('Errore nel recupero dei log di attività');
      return response.json();
    }
  });

  useEffect(() => {
    if (logs) {
      setActivityLogs(logs);
    }
  }, [logs]);

  const generalForm = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      siteName: "o2o Mobility",
      logoPath: "",
      primaryColor: "#3b82f6",
      secondaryColor: "#f97316",
      contactEmail: "",
      contactPhone: "",
      address: "",
      vatNumber: "",
      socialFacebook: "",
      socialInstagram: "",
      socialLinkedin: "",
      footerText: "© 2023 o2o Mobility. Tutti i diritti riservati.",
    }
  });

  // Set default values when data is loaded
  useEffect(() => {
    if (generalSettings) {
      generalForm.reset({
        siteName: generalSettings.siteName || "o2o Mobility",
        logoPath: generalSettings.logoPath || "",
        primaryColor: generalSettings.primaryColor || "#3b82f6",
        secondaryColor: generalSettings.secondaryColor || "#f97316",
        contactEmail: generalSettings.contactEmail || "",
        contactPhone: generalSettings.contactPhone || "",
        address: generalSettings.address || "",
        vatNumber: generalSettings.vatNumber || "",
        socialFacebook: generalSettings.socialFacebook || "",
        socialInstagram: generalSettings.socialInstagram || "",
        socialLinkedin: generalSettings.socialLinkedin || "",
        footerText: generalSettings.footerText || "© 2023 o2o Mobility. Tutti i diritti riservati.",
      });
    }
  }, [generalSettings, generalForm]);

  const securityForm = useForm<SecuritySettingsValues>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      minPasswordLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecialChar: true,
      passwordExpiryDays: 90,
      passwordHistoryCount: 5,
      enable2FA: false,
      failedLoginAttempts: 5,
      lockoutDurationMinutes: 30,
    },
  });
  
  // Set default values when data is loaded
  useEffect(() => {
    if (securitySettings) {
      securityForm.reset({
        minPasswordLength: securitySettings.minPasswordLength || 8,
        requireUppercase: securitySettings.requireUppercase || true,
        requireLowercase: securitySettings.requireLowercase || true,
        requireNumber: securitySettings.requireNumber || true,
        requireSpecialChar: securitySettings.requireSpecialChar || true,
        passwordExpiryDays: securitySettings.passwordExpiryDays || 90,
        passwordHistoryCount: securitySettings.passwordHistoryCount || 5,
        enable2FA: securitySettings.enable2FA || false,
        failedLoginAttempts: securitySettings.failedLoginAttempts || 5,
        lockoutDurationMinutes: securitySettings.lockoutDurationMinutes || 30,
      });
    }
  }, [securitySettings, securityForm]);

  // Mutations for updating settings
  const updateGeneralSettings = useMutation({
    mutationFn: async (data: GeneralSettingsValues) => {
      setIsSubmitting(true);
      const response = await apiRequest('PATCH', '/api/admin/settings/general', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Impostazioni generali aggiornate",
        description: "Le impostazioni generali sono state aggiornate con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/general'] });
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento delle impostazioni generali.",
        variant: "destructive",
      });
      console.error("Error updating general settings:", error);
      setIsSubmitting(false);
    }
  });

  const updateSecuritySettings = useMutation({
    mutationFn: async (data: SecuritySettingsValues) => {
      setIsSubmitting(true);
      const response = await apiRequest('PATCH', '/api/admin/settings/security', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Impostazioni di sicurezza aggiornate",
        description: "Le impostazioni di sicurezza sono state aggiornate con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings/security'] });
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento delle impostazioni di sicurezza.",
        variant: "destructive",
      });
      console.error("Error updating security settings:", error);
      setIsSubmitting(false);
    }
  });

  const onGeneralSubmit = (data: GeneralSettingsValues) => {
    updateGeneralSettings.mutate(data);
  };

  const onSecuritySubmit = (data: SecuritySettingsValues) => {
    updateSecuritySettings.mutate(data);
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
              <TabsTrigger value="provinces">
                <MapPin className="h-4 w-4 mr-2" /> Province
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="h-4 w-4 mr-2" /> Sicurezza
              </TabsTrigger>
              <TabsTrigger value="logs">
                <List className="h-4 w-4 mr-2" /> Attività
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
                              Questo nome verrà mostrato nell'intestazione, nel footer e nelle email
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={generalForm.control}
                        name="logoPath"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL Logo</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://esempio.com/logo.png" />
                            </FormControl>
                            <FormDescription>
                              URL del logo aziendale (utilizzerà il nome del sito se mancante)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={generalForm.control}
                          name="primaryColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Colore Primario</FormLabel>
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <div className="w-10 h-10 rounded border" style={{ backgroundColor: field.value || '#3b82f6' }} />
                              </div>
                              <FormDescription>
                                Colore primario (es. #3b82f6)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={generalForm.control}
                          name="secondaryColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Colore Secondario</FormLabel>
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <div className="w-10 h-10 rounded border" style={{ backgroundColor: field.value || '#f97316' }} />
                              </div>
                              <FormDescription>
                                Colore secondario (es. #f97316)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
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
                          name="contactPhone"
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
                      
                      <FormField
                        control={generalForm.control}
                        name="vatNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Partita IVA</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={generalForm.control}
                          name="socialFacebook"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Facebook</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://facebook.com/..." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={generalForm.control}
                          name="socialInstagram"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instagram</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://instagram.com/..." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={generalForm.control}
                          name="socialLinkedin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>LinkedIn</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://linkedin.com/..." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={generalForm.control}
                        name="footerText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Testo Footer</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              Testo visualizzato nel footer del sito (es. copyright)
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
                            <Save className="h-4 w-4 mr-2" /> Salva Impostazioni
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Province Settings */}
            <TabsContent value="provinces">
              <ProvincesSolution />
            </TabsContent>
            
            {/* Security Settings */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Impostazioni di Sicurezza</CardTitle>
                  <CardDescription>
                    Configura le impostazioni di sicurezza del sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...securityForm}>
                    <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={securityForm.control}
                          name="minPasswordLength"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lunghezza minima password</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                              </FormControl>
                              <FormDescription>
                                Minimo 6 caratteri, massimo 30
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={securityForm.control}
                          name="passwordExpiryDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Scadenza password (giorni)</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                              </FormControl>
                              <FormDescription>
                                0 = nessuna scadenza
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={securityForm.control}
                          name="passwordHistoryCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Storico password</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                              </FormControl>
                              <FormDescription>
                                Numero di password precedenti da ricordare (0-20)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={securityForm.control}
                          name="failedLoginAttempts"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tentativi di accesso falliti</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                              </FormControl>
                              <FormDescription>
                                Tentativi falliti prima del blocco dell'account
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={securityForm.control}
                        name="lockoutDurationMinutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Durata blocco (minuti)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormDescription>
                              Durata del blocco dell'account dopo i tentativi falliti
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={securityForm.control}
                          name="requireUppercase"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between p-3 rounded-md border">
                              <div>
                                <FormLabel>Richiedi maiuscole</FormLabel>
                                <FormDescription>
                                  La password deve contenere almeno un carattere maiuscolo
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={securityForm.control}
                          name="requireLowercase"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between p-3 rounded-md border">
                              <div>
                                <FormLabel>Richiedi minuscole</FormLabel>
                                <FormDescription>
                                  La password deve contenere almeno un carattere minuscolo
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={securityForm.control}
                          name="requireNumber"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between p-3 rounded-md border">
                              <div>
                                <FormLabel>Richiedi numeri</FormLabel>
                                <FormDescription>
                                  La password deve contenere almeno un numero
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={securityForm.control}
                          name="requireSpecialChar"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between p-3 rounded-md border">
                              <div>
                                <FormLabel>Richiedi caratteri speciali</FormLabel>
                                <FormDescription>
                                  La password deve contenere almeno un carattere speciale
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={securityForm.control}
                        name="enable2FA"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between p-3 rounded-md border">
                            <div>
                              <FormLabel>Abilita 2FA</FormLabel>
                              <FormDescription>
                                Richiedi autenticazione a due fattori per gli accessi
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
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
                            <Save className="h-4 w-4 mr-2" /> Salva Impostazioni
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Activity Logs */}
            <TabsContent value="logs">
              <Card>
                <CardHeader>
                  <CardTitle>Log di Attività</CardTitle>
                  <CardDescription>
                    Visualizza le ultime attività nel sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingLogs ? (
                    <div className="w-full py-10 flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : !activityLogs || activityLogs.length === 0 ? (
                    <div className="text-center py-8 border rounded-md">
                      Nessun log di attività disponibile
                    </div>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Utente</TableHead>
                            <TableHead>Azione</TableHead>
                            <TableHead>Dettagli</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activityLogs.map((log, index) => (
                            <TableRow key={index}>
                              <TableCell>{new Date(log.createdAt).toLocaleString('it-IT')}</TableCell>
                              <TableCell>{log.username || 'Sistema'}</TableCell>
                              <TableCell>{log.action}</TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {typeof log.details === 'object' 
                                  ? JSON.stringify(log.details) 
                                  : log.details}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}