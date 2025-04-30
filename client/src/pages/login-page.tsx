import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

// Components
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import PageTitle from "@/components/page-title";
import { TwoFactorVerify } from "@/components/two-factor-verify";

// Validazione
const loginSchema = z.object({
  username: z.string().min(3, "Username deve contenere almeno 3 caratteri"),
  password: z.string().min(6, "Password deve contenere almeno 6 caratteri"),
  rememberMe: z.boolean().optional().default(false)
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(8, "Password deve contenere almeno 8 caratteri"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { 
    user, 
    loginMutation, 
    registerMutation, 
    verifyTwoFactorMutation,
    twoFactorState
  } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  
  // Fetch general settings to get site name
  const { data: generalSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/settings/general'],
    queryFn: async () => {
      const response = await fetch('/api/settings/general');
      if (!response.ok) throw new Error('Errore nel recupero delle impostazioni generali');
      return response.json();
    }
  });

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      role: "user",
    },
  });

  useEffect(() => {
    // If user is already logged in, redirect to home
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  function onLoginSubmit(data: LoginFormValues) {
    loginMutation.mutate(data);
  }

  function onRegisterSubmit(data: RegisterFormValues) {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  }

  // Funzione per gestire la verifica 2FA completata
  const handleVerified = () => {
    // Quando la verifica 2FA è completata con successo, verifyTwoFactorMutation già aggiorna il context
    // Non serve fare altro qui
  };
  
  // Funzione per annullare la verifica 2FA
  const handleCancel2FA = () => {
    // Resetta lo stato di verifica 2FA (non è necessario, ma è per sicurezza)
    // In un'implementazione reale, potremmo voler comunicare con il server per annullare la sessione
    window.location.reload();
  };

  // Se è richiesta la verifica 2FA, mostra il componente di verifica
  if (twoFactorState.requiresTwoFactor && twoFactorState.pendingUserId) {
    return (
      <div className="flex min-h-screen bg-gray-100 items-center justify-center p-6">
        <PageTitle title="Verifica Autenticazione" />
        <TwoFactorVerify 
          userId={twoFactorState.pendingUserId}
          onVerified={handleVerified}
          onCancel={handleCancel2FA}
        />
      </div>
    );
  }
  
  // Se è richiesto il setup iniziale del 2FA, reindirizza alla pagina di configurazione
  if (twoFactorState.requiresTwoFactorSetup && twoFactorState.pendingUserId) {
    return (
      <div className="flex min-h-screen bg-gray-100 items-center justify-center p-6">
        <PageTitle title="Configurazione 2FA" />
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Configurazione Richiesta</CardTitle>
            <CardDescription>
              È necessario configurare l'autenticazione a due fattori per continuare.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Per motivi di sicurezza, è richiesto configurare l'autenticazione a due fattori (2FA) per il tuo account.
              Questo processo richiederà di scansionare un codice QR con un'app di autenticazione sul tuo telefono.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleCancel2FA}>
              Annulla
            </Button>
            <Button onClick={() => setLocation('/admin/two-factor-setup-new')}>
              Configura 2FA
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <PageTitle title="Accedi o Registrati" />
      
      {/* Left Column - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {isLoadingSettings ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Caricamento...</span>
                </div>
              ) : (
                <span className="text-primary font-bold">
                  {generalSettings?.siteName ? (
                    <>
                      {generalSettings.siteName.split(' ')[0]}
                      {generalSettings.siteName.split(' ').length > 1 && (
                        <span className="text-secondary">
                          {' '}{generalSettings.siteName.split(' ').slice(1).join(' ')}
                        </span>
                      )}
                    </>
                  ) : (
                    <>o2o <span className="text-secondary">Mobility</span></>
                  )}
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-center">
              Accedi o registrati per gestire il tuo account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Accedi</TabsTrigger>
                <TabsTrigger value="register">Registrati</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Inserisci il tuo username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Inserisci la tua password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex items-center justify-between">
                      <FormField
                        control={loginForm.control}
                        name="rememberMe"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                              <input 
                                type="checkbox" 
                                checked={field.value}
                                onChange={field.onChange}
                                id="rememberMe" 
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                            </FormControl>
                            <label htmlFor="rememberMe" className="text-sm text-muted-foreground">
                              Ricordami
                            </label>
                          </FormItem>
                        )}
                      />
                      <button 
                        type="button" 
                        className="text-sm font-medium text-primary hover:underline" 
                        onClick={() => alert("Funzionalità di recupero password in arrivo!")}
                      >
                        Password dimenticata?
                      </button>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Accesso in corso...
                        </>
                      ) : (
                        "Accedi"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Scegli un username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Inserisci la tua email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Inserisci il tuo nome e cognome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Crea una password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conferma Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Conferma la tua password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Registrazione in corso...
                        </>
                      ) : (
                        "Registrati"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="text-center text-sm text-muted-foreground">
            Effettuando l'accesso o la registrazione, accetti i nostri <a href="#" className="underline">Termini di servizio</a> e <a href="#" className="underline">Privacy Policy</a>.
          </CardFooter>
        </Card>
      </div>
      
      {/* Right Column - Hero Section */}
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center text-white p-12">
        <div className="max-w-lg">
          <h1 className="text-4xl font-bold mb-6">Benvenuto nel sistema di gestione</h1>
          <p className="text-lg mb-8">
            Accedi al tuo account per gestire tutti gli aspetti della tua flotta auto, 
            configurare opzioni di noleggio e monitorare le richieste dei clienti.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Gestione Veicoli</h3>
              <p>Aggiungi, modifica e configura il tuo catalogo di veicoli.</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Opzioni Noleggio</h3>
              <p>Configura pacchetti di noleggio personalizzati per ogni veicolo.</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Richieste Clienti</h3>
              <p>Monitora e gestisci tutte le richieste di informazioni in arrivo.</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Statistiche</h3>
              <p>Visualizza report e metriche sul rendimento del tuo business.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}