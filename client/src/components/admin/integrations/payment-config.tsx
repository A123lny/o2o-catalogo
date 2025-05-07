import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// UI Components
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Schema per la configurazione dei pagamenti
const schema = z.object({
  stripePublicKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  paypalClientId: z.string().optional(),
  paypalClientSecret: z.string().optional(),
});

// Tipo per la configurazione dei pagamenti
export interface PaymentConfigType {
  stripeEnabled: boolean;
  paypalEnabled: boolean;
  stripePublicKey?: string;
  stripeSecretKey?: string;
  paypalClientId?: string;
  paypalClientSecret?: string;
}

interface PaymentConfigProps {
  config: PaymentConfigType;
  onConfigSaved?: () => void;
}

export function PaymentConfig({ config, onConfigSaved }: PaymentConfigProps) {
  const { toast } = useToast();
  const [stripeEnabled, setStripeEnabled] = useState(config?.stripeEnabled ?? false);
  const [paypalEnabled, setPaypalEnabled] = useState(config?.paypalEnabled ?? false);
  
  // Form per la configurazione
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      stripePublicKey: config?.stripePublicKey || "",
      stripeSecretKey: config?.stripeSecretKey || "",
      paypalClientId: config?.paypalClientId || "",
      paypalClientSecret: config?.paypalClientSecret || "",
    },
  });
  
  // Aggiorna il form quando la configurazione cambia
  useEffect(() => {
    if (config) {
      setStripeEnabled(config.stripeEnabled === true);
      setPaypalEnabled(config.paypalEnabled === true);
      
      form.reset({
        stripePublicKey: config.stripePublicKey || "",
        stripeSecretKey: config.stripeSecretKey || "",
        paypalClientId: config.paypalClientId || "",
        paypalClientSecret: config.paypalClientSecret || "",
      });
    }
  }, [config, form]);

  // Mutazione per salvare
  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        ...values,
        stripeEnabled,
        paypalEnabled,
      };
      
      const res = await apiRequest("PUT", "/api/admin/integrations/payment", payload);
      if (!res.ok) throw new Error("Errore nel salvataggio della configurazione dei pagamenti");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurazione salvata",
        description: "La configurazione dei pagamenti è stata salvata con successo",
      });
      if (onConfigSaved) onConfigSaved();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Si è verificato un errore: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    saveMutation.mutate(values);
  });

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Stripe */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Stripe</CardTitle>
                <Switch
                  checked={stripeEnabled}
                  onCheckedChange={setStripeEnabled}
                />
              </div>
            </CardHeader>
            <CardContent className={stripeEnabled ? "" : "opacity-50 pointer-events-none"}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="stripePublicKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chiave Pubblica</FormLabel>
                      <FormControl>
                        <Input placeholder="pk_test_..." {...field} />
                      </FormControl>
                      <FormDescription>
                        La chiave pubblica (Publishable Key) di Stripe
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="stripeSecretKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chiave Segreta</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="sk_test_..." {...field} />
                      </FormControl>
                      <FormDescription>
                        La chiave segreta (Secret Key) di Stripe. Assicurati di usare la chiave di test in ambiente di sviluppo.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* PayPal */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">PayPal</CardTitle>
                <Switch
                  checked={paypalEnabled}
                  onCheckedChange={setPaypalEnabled}
                />
              </div>
            </CardHeader>
            <CardContent className={paypalEnabled ? "" : "opacity-50 pointer-events-none"}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="paypalClientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Client ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="paypalClientSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Secret</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Client Secret" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormDescription>
                  Configura l'app su PayPal Developer Dashboard e ottieni le credenziali Client ID e Secret
                </FormDescription>
              </div>
            </CardContent>
          </Card>
          
          <Button
            type="submit"
            className="w-full mt-6"
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
        </form>
      </Form>
    </div>
  );
}