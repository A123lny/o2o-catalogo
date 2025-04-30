import { useState, useEffect, useMemo } from "react";
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

// Schema di base, verrà esteso con le regole dalle impostazioni di sicurezza
const baseLoginSchema = z.object({
  username: z.string().min(3, "Username deve contenere almeno 3 caratteri"),
  password: z.string(),
});

const baseRegisterSchema = insertUserSchema.extend({
  password: z.string(),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

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
  
  // Costruisci dinamicamente gli schemi di validazione in base alle impostazioni di sicurezza
  const loginSchema = useMemo(() => {
    let passwordSchema = z.string();
    
    if (securitySettings) {
      // Aggiungi validazione lunghezza minima
      if (securitySettings.minPasswordLength > 0) {
        passwordSchema = passwordSchema.min(
          securitySettings.minPasswordLength,
          `La password deve contenere almeno ${securitySettings.minPasswordLength} caratteri`
        );
      } else {
        passwordSchema = passwordSchema.min(6, "La password deve contenere almeno 6 caratteri");
      }
      
      // Aggiungi altre validazioni se necessarie in base alle impostazioni
      const patterns = [];
      const patternMessages = [];
      
      if (securitySettings.requireUppercase) {
        patterns.push(/[A-Z]/);
        patternMessages.push("una lettera maiuscola");
      }
      
      if (securitySettings.requireLowercase) {
        patterns.push(/[a-z]/);
        patternMessages.push("una lettera minuscola");
      }
      
      if (securitySettings.requireNumber) {
        patterns.push(/[0-9]/);
        patternMessages.push("un numero");
      }
      
      if (securitySettings.requireSpecialChar) {
        patterns.push(/[^A-Za-z0-9]/);
        patternMessages.push("un carattere speciale");
      }
      
      // Aggiungi validazione di pattern se ci sono requisiti
      if (patterns.length > 0) {
        for (let i = 0; i < patterns.length; i++) {
          const pattern = patterns[i];
          const message = patternMessages[i];
          passwordSchema = passwordSchema.refine(
            (value) => pattern.test(value),
            { message: `La password deve contenere almeno ${message}` }
          );
        }
      }
    } else {
      // Validazione predefinita se le impostazioni non sono disponibili
      passwordSchema = passwordSchema.min(6, "La password deve contenere almeno 6 caratteri");
    }
    
    return baseLoginSchema.extend({
      password: passwordSchema
    });
  }, [securitySettings]);
  
  const registerSchema = useMemo(() => {
    let passwordSchema = z.string();
    
    if (securitySettings) {
      // Aggiungi validazione lunghezza minima
      if (securitySettings.minPasswordLength > 0) {
        passwordSchema = passwordSchema.min(
          securitySettings.minPasswordLength,
          `La password deve contenere almeno ${securitySettings.minPasswordLength} caratteri`
        );
      } else {
        passwordSchema = passwordSchema.min(8, "La password deve contenere almeno 8 caratteri");
      }
      
      // Aggiungi altre validazioni se necessarie in base alle impostazioni
      const patterns = [];
      const patternMessages = [];
      
      if (securitySettings.requireUppercase) {
        patterns.push(/[A-Z]/);
        patternMessages.push("una lettera maiuscola");
      }
      
      if (securitySettings.requireLowercase) {
        patterns.push(/[a-z]/);
        patternMessages.push("una lettera minuscola");
      }
      
      if (securitySettings.requireNumber) {
        patterns.push(/[0-9]/);
        patternMessages.push("un numero");
      }
      
      if (securitySettings.requireSpecialChar) {
        patterns.push(/[^A-Za-z0-9]/);
        patternMessages.push("un carattere speciale");
      }
      
      // Aggiungi validazione di pattern se ci sono requisiti
      if (patterns.length > 0) {
        for (let i = 0; i < patterns.length; i++) {
          const pattern = patterns[i];
          const message = patternMessages[i];
          passwordSchema = passwordSchema.refine(
            (value) => pattern.test(value),
            { message: `La password deve contenere almeno ${message}` }
          );
        }
      }
    } else {
      // Validazione predefinita se le impostazioni non sono disponibili
      passwordSchema = passwordSchema.min(8, "La password deve contenere almeno 8 caratteri");
    }
    
    return baseRegisterSchema.extend({
      password: passwordSchema
    });
  }, [securitySettings]);
  
  // Definisci i tipi dopo aver creato gli schemi
  type LoginFormValues = z.infer<typeof loginSchema>;
  type RegisterFormValues = z.infer<typeof registerSchema>;

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
    // Ricrea il form quando cambiano gli schemi di validazione
    context: securitySettings
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
    // Ricrea il form quando cambiano gli schemi di validazione
    context: securitySettings
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