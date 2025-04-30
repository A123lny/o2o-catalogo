import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Schema per la validazione del form
const paymentConfigSchema = z.object({
  enabled: z.boolean().default(false),
  publicKey: z.string().min(1, "Chiave pubblica richiesta").nullable().optional(),
  secretKey: z.string().min(1, "Chiave segreta richiesta").nullable().optional(),
});

type PaymentConfigType = z.infer<typeof paymentConfigSchema>;

type PaymentConfigProps = {
  provider: "stripe" | "paypal";
};

export default function PaymentConfig({ provider }: PaymentConfigProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Carica la configurazione esistente
  const { data: config, isLoading } = useQuery({
    queryKey: [`/api/integrations/payment/${provider}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/integrations/payment/${provider}`);
      if (!response.ok) {
        throw new Error("Errore nel caricamento della configurazione");
      }
      return response.json();
    },
  });
  
  // Form per la modifica della configurazione
  const form = useForm<PaymentConfigType>({
    resolver: zodResolver(paymentConfigSchema),
    defaultValues: {
      enabled: false,
      publicKey: "",
      secretKey: "",
    },
  });
  
  // Aggiorna il form quando i dati vengono caricati
  useEffect(() => {
    if (config) {
      form.reset({
        enabled: config.enabled,
        publicKey: config.publicKey || "",
        secretKey: config.secretKey || "",
      });
    }
  }, [config, form]);
  
  // Mutation per salvare la configurazione
  const saveMutation = useMutation({
    mutationFn: async (data: PaymentConfigType) => {
      const response = await apiRequest("POST", `/api/integrations/payment/${provider}`, data);
      if (!response.ok) {
        throw new Error("Errore durante il salvataggio");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurazione salvata",
        description: `La configurazione per ${getProviderLabel(provider)} è stata salvata con successo.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/integrations/payment/${provider}`] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Si è verificato un errore: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: PaymentConfigType) => {
    saveMutation.mutate(data);
  };
  
  const isEnabled = form.watch("enabled");
  
  // Helper per ottenere l'etichetta del provider
  const getProviderLabel = (provider: string): string => {
    switch (provider) {
      case "stripe": return "Stripe";
      case "paypal": return "PayPal";
      default: return provider;
    }
  };
  
  // Helper per ottenere le descrizioni dei campi
  const getPublicKeyLabel = (provider: string): string => {
    switch (provider) {
      case "stripe": return "Publishable Key";
      case "paypal": return "Client ID";
      default: return "Chiave Pubblica";
    }
  };
  
  const getSecretKeyLabel = (provider: string): string => {
    switch (provider) {
      case "stripe": return "Secret Key";
      case "paypal": return "Client Secret";
      default: return "Chiave Segreta";
    }
  };
  
  const getPublicKeyDescription = (provider: string): string => {
    switch (provider) {
      case "stripe": return "La Publishable Key è sicura da includere nel codice frontend";
      case "paypal": return "Il Client ID è sicuro da includere nel codice frontend";
      default: return "";
    }
  };
  
  const getSecretKeyDescription = (provider: string): string => {
    switch (provider) {
      case "stripe": return "La Secret Key deve essere mantenuta privata e usata solo sul server";
      case "paypal": return "Il Client Secret deve essere mantenuto privato e usato solo sul server";
      default: return "";
    }
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>{getProviderLabel(provider)}</FormLabel>
                      <FormDescription>
                        Abilita o disabilita i pagamenti tramite {getProviderLabel(provider)}
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
              
              <div className={isEnabled ? "" : "opacity-50 pointer-events-none"}>
                <div className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="publicKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{getPublicKeyLabel(provider)}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={`${getPublicKeyLabel(provider)}`} />
                        </FormControl>
                        {getPublicKeyDescription(provider) && (
                          <FormDescription>
                            {getPublicKeyDescription(provider)}
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="secretKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{getSecretKeyLabel(provider)}</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder={`${getSecretKeyLabel(provider)}`} />
                        </FormControl>
                        {getSecretKeyDescription(provider) && (
                          <FormDescription>
                            {getSecretKeyDescription(provider)}
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {provider === "stripe" && (
                  <div className="mt-4 bg-primary/10 p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2">Come ottenere le chiavi di Stripe</h3>
                    <ol className="list-decimal pl-5 text-sm space-y-1">
                      <li>Accedi al tuo account Stripe Dashboard</li>
                      <li>Vai su Developers &gt; API keys</li>
                      <li>Copia la "Publishable key" (inizia con pk_) nel campo Publishable Key</li>
                      <li>Copia la "Secret key" (inizia con sk_) nel campo Secret Key</li>
                    </ol>
                  </div>
                )}
                
                {provider === "paypal" && (
                  <div className="mt-4 bg-primary/10 p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2">Come ottenere le credenziali di PayPal</h3>
                    <ol className="list-decimal pl-5 text-sm space-y-1">
                      <li>Accedi al tuo account PayPal Developer Dashboard</li>
                      <li>Vai su Apps & Credentials</li>
                      <li>Crea una nuova app o seleziona un'app esistente</li>
                      <li>Copia il "Client ID" e il "Secret" nei rispettivi campi</li>
                    </ol>
                  </div>
                )}
                
                <div className="pt-6">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvataggio...
                      </>
                    ) : (
                      "Salva Configurazione"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}

// Componente di wrapper per gestire entrambi i provider di pagamento
export function PaymentConfigs() {
  const [activeTab, setActiveTab] = useState<string>("stripe");
  
  return (
    <Tabs defaultValue="stripe" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="stripe">Stripe</TabsTrigger>
        <TabsTrigger value="paypal">PayPal</TabsTrigger>
      </TabsList>
      
      <TabsContent value="stripe">
        <PaymentConfig provider="stripe" />
      </TabsContent>
      
      <TabsContent value="paypal">
        <PaymentConfig provider="paypal" />
      </TabsContent>
    </Tabs>
  );
}