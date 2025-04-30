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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { SiFacebook, SiGithub } from "react-icons/si";

// Schema per la validazione del form
const socialConfigSchema = z.object({
  enabled: z.boolean().default(false),
  clientId: z.string().min(1, "Questo campo è obbligatorio"),
  clientSecret: z.string().min(1, "Questo campo è obbligatorio"),
  callbackUrl: z.string().optional(),
});

type SocialConfigType = z.infer<typeof socialConfigSchema>;

type SocialLoginConfigProps = {
  provider: "google" | "facebook" | "github";
};

export default function SocialLoginConfig({ provider }: SocialLoginConfigProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Carica la configurazione esistente per questo provider
  const { data: config, isLoading } = useQuery({
    queryKey: [`/api/integrations/social/${provider}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/integrations/social/${provider}`);
      if (!response.ok) {
        if (response.status === 404) {
          return { enabled: false, clientId: "", clientSecret: "", callbackUrl: "" };
        }
        throw new Error("Errore nel caricamento della configurazione");
      }
      return response.json();
    },
  });
  
  // Form per la modifica della configurazione
  const form = useForm<SocialConfigType>({
    resolver: zodResolver(socialConfigSchema),
    defaultValues: {
      enabled: false,
      clientId: "",
      clientSecret: "",
      callbackUrl: "",
    },
  });
  
  // Aggiorna il form quando i dati vengono caricati
  useEffect(() => {
    if (config) {
      form.reset({
        enabled: config.enabled,
        clientId: config.clientId || "",
        clientSecret: config.clientSecret || "",
        callbackUrl: config.callbackUrl || "",
      });
    }
  }, [config, form]);
  
  // Mutation per salvare la configurazione
  const saveMutation = useMutation({
    mutationFn: async (data: SocialConfigType) => {
      const response = await apiRequest("POST", `/api/integrations/social/${provider}`, data);
      if (!response.ok) {
        throw new Error("Errore durante il salvataggio");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurazione salvata",
        description: `La configurazione per ${getProviderName(provider)} è stata salvata con successo.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/integrations/social/${provider}`] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Si è verificato un errore: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: SocialConfigType) => {
    saveMutation.mutate(data);
  };
  
  // Helper per ottenere il nome del provider
  const getProviderName = (provider: string) => {
    switch (provider) {
      case "google":
        return "Google";
      case "facebook":
        return "Facebook";
      case "github":
        return "GitHub";
      default:
        return provider;
    }
  };
  
  // Helper per ottenere l'icona del provider
  const getProviderIcon = () => {
    switch (provider) {
      case "google":
        return <FcGoogle className="h-6 w-6" />;
      case "facebook":
        return <SiFacebook className="h-6 w-6 text-blue-600" />;
      case "github":
        return <SiGithub className="h-6 w-6" />;
      default:
        return null;
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-6">
        <div className="flex items-center">
          {getProviderIcon()}
          <CardTitle className="ml-2">Login con {getProviderName(provider)}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Abilitato</FormLabel>
                      <FormDescription>
                        Abilita o disabilita il login con {getProviderName(provider)}
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
              
              <div className={form.watch("enabled") ? "space-y-4" : "space-y-4 opacity-50 pointer-events-none"}>
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client ID</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" placeholder={`${getProviderName(provider)} Client ID`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="clientSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Secret</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder={`${getProviderName(provider)} Client Secret`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="callbackUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL di Callback (opzionale)</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" placeholder="https://yourwebsite.com/auth/callback" />
                      </FormControl>
                      <FormDescription>
                        Se lasciato vuoto, verrà utilizzato l'URL predefinito
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
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
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}