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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PageTitle from "@/components/page-title";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
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
  
  // Fetch security settings for password validation
  const { data: securitySettings, isLoading: isLoadingSecurity } = useQuery({
    queryKey: ['/api/admin/settings/security'],
    queryFn: async () => {
      const response = await fetch('/api/admin/settings/security');
      if (!response.ok) throw new Error('Errore nel recupero delle impostazioni di sicurezza');
      return response.json();
    }
  });
  
  // Crea schemi di validazione dinamici basati sulle impostazioni di sicurezza
  const getLoginSchema = () => {
    return z.object({
      username: z.string().min(3, "Username deve contenere almeno 3 caratteri"),
      password: z.string().min(
        securitySettings?.minPasswordLength || 6, 
        `Password deve contenere almeno ${securitySettings?.minPasswordLength || 6} caratteri`
      ),
    });
  };

  const getRegisterSchema = () => {
    const schema = insertUserSchema.pick({
      username: true,
      email: true,
      fullName: true,
      role: true,
    }).extend({
      password: z.string().min(
        securitySettings?.minPasswordLength || 8, 
        `Password deve contenere almeno ${securitySettings?.minPasswordLength || 8} caratteri`
      ),
      confirmPassword: z.string(),
    }).refine((data) => data.password === data.confirmPassword, {
      message: "Le password non corrispondono",
      path: ["confirmPassword"],
    });
    
    return schema;
  };

  // Definisci i tipi
  type LoginFormValues = z.infer<ReturnType<typeof getLoginSchema>>;
  type RegisterFormValues = z.infer<ReturnType<typeof getRegisterSchema>>;

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(getLoginSchema()),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(getRegisterSchema()),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      role: "user",
    },
  });
  
  // Aggiorna i form quando cambiano le impostazioni di sicurezza
  useEffect(() => {
    if (securitySettings) {
      loginForm.reset(loginForm.getValues());
      registerForm.reset(registerForm.getValues());
    }
  }, [securitySettings]);

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
  
  // Mostra le informazioni sui requisiti della password
  const renderPasswordRequirements = () => {
    if (!securitySettings) return null;
    
    const requirements = [];
    
    if (securitySettings.requireUppercase) {
      requirements.push("una lettera maiuscola");
    }
    
    if (securitySettings.requireLowercase) {
      requirements.push("una lettera minuscola");
    }
    
    if (securitySettings.requireNumber) {
      requirements.push("un numero");
    }
    
    if (securitySettings.requireSpecialChar) {
      requirements.push("un carattere speciale");
    }
    
    if (requirements.length === 0) return null;
    
    return (
      <Alert variant="info" className="my-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          La password deve contenere almeno {requirements.join(", ")}.
        </AlertDescription>
      </Alert>
    );
  };

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
                    
                    {renderPasswordRequirements()}
                    
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
                    
                    {renderPasswordRequirements()}
                    
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