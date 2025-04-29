import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox"; 
import { 
  Save, 
  Cog, 
  Mail, 
  Globe, 
  Lock, 
  MapPin, 
  Shield, 
  List,
  Loader2
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

const provinceSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Il nome della provincia è obbligatorio"),
  code: z.string().min(2, "Il codice provincia è obbligatorio").max(2, "Il codice provincia deve essere di 2 caratteri"),
  isActive: z.boolean().default(true),
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;
type SecuritySettingsValues = z.infer<typeof securitySettingsSchema>;
type ProvinceValues = z.infer<typeof provinceSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [newProvince, setNewProvince] = useState<ProvinceValues>({ name: "", code: "", isActive: true });
  const [selectedProvinces, setSelectedProvinces] = useState<number[]>([]);
  const [selectedAllProvinces, setSelectedAllProvinces] = useState(false);
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

  // Fetch provinces
  const { data: provinces, isLoading: isLoadingProvinces } = useQuery({
    queryKey: ['/api/admin/provinces'],
    queryFn: async () => {
      const response = await fetch('/api/admin/provinces');
      if (!response.ok) throw new Error('Errore nel recupero delle province');
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

  // Toggle province selection
  const toggleProvinceSelection = (id: number) => {
    setSelectedProvinces(prev => 
      prev.includes(id) 
        ? prev.filter(provinceId => provinceId !== id) 
        : [...prev, id]
    );
  };

  // Toggle select all provinces
  const toggleAllProvinces = () => {
    if (selectedAllProvinces || (provinces && provinces.length > 0 && selectedProvinces.length === provinces.length)) {
      setSelectedProvinces([]);
      setSelectedAllProvinces(false);
    } else if (provinces && provinces.length > 0) {
      // Assicuriamoci che provinces esista e che abbia degli elementi prima di usare map
      const provinceIds = provinces.map((province) => province.id || 0).filter(id => id > 0);
      setSelectedProvinces(provinceIds);
      setSelectedAllProvinces(true);
    }
  };

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

  const addProvince = useMutation({
    mutationFn: async (data: ProvinceValues) => {
      setIsSubmitting(true);
      const response = await apiRequest('POST', '/api/admin/provinces', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Provincia aggiunta",
        description: "La provincia è stata aggiunta con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/provinces'] });
      setNewProvince({ name: "", code: "", isActive: true });
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiunta della provincia.",
        variant: "destructive",
      });
      console.error("Error adding province:", error);
      setIsSubmitting(false);
    }
  });

  const updateProvinceStatus = useMutation({
    mutationFn: async ({ ids, isActive }: { ids: number[], isActive: boolean }) => {
      setIsSubmitting(true);
      const response = await apiRequest('PUT', '/api/admin/provinces/update-status', { ids, isActive });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Stato province aggiornato",
        description: "Lo stato delle province selezionate è stato aggiornato con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/provinces'] });
      setSelectedProvinces([]);
      setSelectedAllProvinces(false);
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento dello stato delle province.",
        variant: "destructive",
      });
      console.error("Error updating province status:", error);
      setIsSubmitting(false);
    }
  });

  const onGeneralSubmit = (data: GeneralSettingsValues) => {
    updateGeneralSettings.mutate(data);
  };

  const onSecuritySubmit = (data: SecuritySettingsValues) => {
    updateSecuritySettings.mutate(data);
  };

  const onProvinceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvince.name || !newProvince.code) {
      toast({
        title: "Dati mancanti",
        description: "Inserisci nome e codice provincia.",
        variant: "destructive",
      });
      return;
    }
    
    addProvince.mutate(newProvince);
  };

  const handleActivateProvinces = () => {
    if (selectedProvinces.length === 0) {
      toast({
        title: "Selezione vuota",
        description: "Seleziona almeno una provincia.",
        variant: "destructive",
      });
      return;
    }
    
    updateProvinceStatus.mutate({ ids: selectedProvinces, isActive: true });
  };

  const handleDeactivateProvinces = () => {
    if (selectedProvinces.length === 0) {
      toast({
        title: "Selezione vuota",
        description: "Seleziona almeno una provincia.",
        variant: "destructive",
      });
      return;
    }
    
    updateProvinceStatus.mutate({ ids: selectedProvinces, isActive: false });
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
                            <FormDescription>
                              Partita IVA dell'azienda
                            </FormDescription>
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
                                <Input {...field} placeholder="URL pagina Facebook" />
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
                                <Input {...field} placeholder="URL pagina Instagram" />
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
                                <Input {...field} placeholder="URL pagina LinkedIn" />
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
                              <Input {...field} placeholder="Testo da mostrare nel footer" />
                            </FormControl>
                            <FormDescription>
                              Es. "Tutti i diritti riservati." (il nome del sito e l'anno verranno aggiunti automaticamente)
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
            
            {/* Province Settings */}
            <TabsContent value="provinces">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Aggiungi Provincia</CardTitle>
                    <CardDescription>
                      Aggiungi una nuova provincia al sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={onProvinceSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <FormLabel>Nome Provincia</FormLabel>
                        <Input 
                          placeholder="Es. Milano" 
                          value={newProvince.name} 
                          onChange={(e) => setNewProvince({...newProvince, name: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <FormLabel>Codice Provincia</FormLabel>
                        <Input 
                          placeholder="Es. MI" 
                          maxLength={2}
                          value={newProvince.code} 
                          onChange={(e) => setNewProvince({...newProvince, code: e.target.value.toUpperCase()})}
                        />
                        <FormDescription>
                          Il codice deve essere di 2 caratteri (es. MI per Milano)
                        </FormDescription>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="province-active" 
                          checked={newProvince.isActive}
                          onCheckedChange={(checked) => 
                            setNewProvince({...newProvince, isActive: checked as boolean})
                          }
                        />
                        <label
                          htmlFor="province-active"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Provincia attiva
                        </label>
                      </div>
                      
                      <div className="pt-2">
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Aggiunta in corso...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" /> Aggiungi Provincia
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Gestione Province</CardTitle>
                    <CardDescription>
                      Attiva o disattiva province in blocco
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedProvinces.length > 0 && (
                      <div className="flex items-center justify-between mb-4 p-2 bg-muted rounded-md">
                        <div className="text-sm">
                          {selectedProvinces.length} province selezionate
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleActivateProvinces}
                            disabled={isSubmitting}
                          >
                            Attiva
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleDeactivateProvinces}
                            disabled={isSubmitting}
                          >
                            Disattiva
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox 
                                checked={selectedAllProvinces || (provinces && provinces.length > 0 && selectedProvinces.length === provinces.length)} 
                                onCheckedChange={(checked) => {
                                  if (provinces && provinces.length > 0) {
                                    if (checked) {
                                      setSelectedProvinces(provinces.map(province => province.id || 0).filter(id => id > 0));
                                      setSelectedAllProvinces(true);
                                    } else {
                                      setSelectedProvinces([]);
                                      setSelectedAllProvinces(false);
                                    }
                                  }
                                }}
                              />
                            </TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Codice</TableHead>
                            <TableHead>Stato</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoadingProvinces ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                              </TableCell>
                            </TableRow>
                          ) : provinces && provinces.length > 0 ? (
                            provinces.map((province: any) => (
                              <TableRow key={province.id}>
                                <TableCell>
                                  <Checkbox 
                                    checked={selectedProvinces.includes(province.id || 0)} 
                                    onCheckedChange={(checked) => {
                                      const id = province.id || 0;
                                      if (id > 0) {
                                        if (checked) {
                                          setSelectedProvinces(prev => [...prev, id]);
                                        } else {
                                          setSelectedProvinces(prev => prev.filter(provinceId => provinceId !== id));
                                        }
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell>{province.name}</TableCell>
                                <TableCell>{province.code}</TableCell>
                                <TableCell>
                                  {province.isActive ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Attiva
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      Disattiva
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-4">
                                Nessuna provincia trovata
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                    <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Password</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={securityForm.control}
                            name="passwordMinLength"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Lunghezza minima</FormLabel>
                                <FormControl>
                                  <Input type="number" min="6" max="30" {...field} value={field.value.toString()} />
                                </FormControl>
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
                                  <Input type="number" min="0" max="365" {...field} value={field.value.toString()} />
                                </FormControl>
                                <FormDescription>
                                  0 = mai
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <FormField
                            control={securityForm.control}
                            name="passwordHistoryCount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ricorda ultime n password</FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" max="20" {...field} value={field.value.toString()} />
                                </FormControl>
                                <FormDescription>
                                  0 = disabilitato
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <FormField
                            control={securityForm.control}
                            name="passwordRequireUppercase"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4">
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Richiedi maiuscole</FormLabel>
                                  <FormDescription>
                                    Almeno un carattere maiuscolo
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
                            control={securityForm.control}
                            name="passwordRequireLowercase"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4">
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Richiedi minuscole</FormLabel>
                                  <FormDescription>
                                    Almeno un carattere minuscolo
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <FormField
                            control={securityForm.control}
                            name="passwordRequireNumber"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4">
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Richiedi numeri</FormLabel>
                                  <FormDescription>
                                    Almeno un carattere numerico
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
                            control={securityForm.control}
                            name="passwordRequireSpecialChar"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4">
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Richiedi caratteri speciali</FormLabel>
                                  <FormDescription>
                                    Almeno un carattere speciale ($, @, !, ecc)
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
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Protezione accesso</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={securityForm.control}
                            name="sessionTimeoutMinutes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Timeout sessione (minuti)</FormLabel>
                                <FormControl>
                                  <Input type="number" min="5" max="1440" {...field} value={field.value.toString()} />
                                </FormControl>
                                <FormDescription>
                                  Tempo di inattività dopo il quale la sessione scade
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
                                  <Input type="number" min="1" max="10" {...field} value={field.value.toString()} />
                                </FormControl>
                                <FormDescription>
                                  Numero di tentativi prima del blocco account
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <FormField
                            control={securityForm.control}
                            name="lockoutDurationMinutes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Durata blocco (minuti)</FormLabel>
                                <FormControl>
                                  <Input type="number" min="1" max="1440" {...field} value={field.value.toString()} />
                                </FormControl>
                                <FormDescription>
                                  Tempo di blocco dopo troppi tentativi falliti
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={securityForm.control}
                            name="enable2FA"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4">
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Autenticazione a due fattori</FormLabel>
                                  <FormDescription>
                                    Abilita 2FA per gli account amministratore
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
                      </div>
                      
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvataggio...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" /> Salva Impostazioni
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Activity Logs */}
            <TabsContent value="logs">
              <Card>
                <CardHeader>
                  <CardTitle>Log delle Attività</CardTitle>
                  <CardDescription>
                    Visualizza le operazioni recenti del sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data/Ora</TableHead>
                          <TableHead>Utente</TableHead>
                          <TableHead>Azione</TableHead>
                          <TableHead>Dettagli</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingLogs ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            </TableCell>
                          </TableRow>
                        ) : activityLogs && activityLogs.length > 0 ? (
                          activityLogs.map((log: any) => (
                            <TableRow key={log.id}>
                              <TableCell className="whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleString('it-IT')}
                              </TableCell>
                              <TableCell>{log.username || log.userId}</TableCell>
                              <TableCell>{log.action}</TableCell>
                              <TableCell>
                                {log.entityType && 
                                  <span className="text-sm text-muted-foreground">
                                    {log.entityType} {log.entityId ? `#${log.entityId}` : ''}
                                  </span>
                                }
                                {log.details && 
                                  <span className="text-sm block text-muted-foreground truncate max-w-[300px]">
                                    {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                                  </span>
                                }
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              Nessun log di attività trovato
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}