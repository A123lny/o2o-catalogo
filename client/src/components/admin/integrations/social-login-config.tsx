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

// Schema per la configurazione Social Login
const schema = z.object({
  googleClientId: z.string().optional(),
  googleClientSecret: z.string().optional(),
  facebookAppId: z.string().optional(),
  facebookAppSecret: z.string().optional(),
  githubClientId: z.string().optional(),
  githubClientSecret: z.string().optional(),
});

// Tipo per la configurazione Social Login
export interface SocialLoginConfigType {
  googleEnabled: boolean;
  facebookEnabled: boolean;
  githubEnabled: boolean;
  googleClientId?: string;
  googleClientSecret?: string;
  facebookAppId?: string;
  facebookAppSecret?: string;
  githubClientId?: string;
  githubClientSecret?: string;
}

interface SocialLoginConfigProps {
  config: SocialLoginConfigType;
  onConfigSaved?: () => void;
}

export function SocialLoginConfig({ config, onConfigSaved }: SocialLoginConfigProps) {
  const { toast } = useToast();
  const [googleEnabled, setGoogleEnabled] = useState(config?.googleEnabled ?? false);
  const [facebookEnabled, setFacebookEnabled] = useState(config?.facebookEnabled ?? false);
  const [githubEnabled, setGithubEnabled] = useState(config?.githubEnabled ?? false);
  
  // Form per la configurazione
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      googleClientId: config?.googleClientId || "",
      googleClientSecret: config?.googleClientSecret || "",
      facebookAppId: config?.facebookAppId || "",
      facebookAppSecret: config?.facebookAppSecret || "",
      githubClientId: config?.githubClientId || "",
      githubClientSecret: config?.githubClientSecret || "",
    },
  });
  
  // Aggiorna il form quando la configurazione cambia
  useEffect(() => {
    if (config) {
      setGoogleEnabled(config.googleEnabled === true);
      setFacebookEnabled(config.facebookEnabled === true);
      setGithubEnabled(config.githubEnabled === true);
      
      form.reset({
        googleClientId: config.googleClientId || "",
        googleClientSecret: config.googleClientSecret || "",
        facebookAppId: config.facebookAppId || "",
        facebookAppSecret: config.facebookAppSecret || "",
        githubClientId: config.githubClientId || "",
        githubClientSecret: config.githubClientSecret || "",
      });
    }
  }, [config, form]);

  // Mutazione per salvare
  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        ...values,
        googleEnabled,
        facebookEnabled,
        githubEnabled,
      };
      
      const res = await apiRequest("PUT", "/api/admin/integrations/social-login", payload);
      if (!res.ok) throw new Error("Errore nel salvataggio della configurazione Social Login");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurazione salvata",
        description: "La configurazione Social Login è stata salvata con successo",
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
          {/* Google */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Google</CardTitle>
                <Switch
                  checked={googleEnabled}
                  onCheckedChange={setGoogleEnabled}
                />
              </div>
            </CardHeader>
            <CardContent className={googleEnabled ? "" : "opacity-50 pointer-events-none"}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="googleClientId"
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
                  name="googleClientSecret"
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
                  Configurare il redirect URI nella console Google Cloud come: 
                  <code className="px-1 py-0.5 bg-muted rounded mx-1">/auth/google/callback</code>
                </FormDescription>
              </div>
            </CardContent>
          </Card>
          
          {/* Facebook */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Facebook</CardTitle>
                <Switch
                  checked={facebookEnabled}
                  onCheckedChange={setFacebookEnabled}
                />
              </div>
            </CardHeader>
            <CardContent className={facebookEnabled ? "" : "opacity-50 pointer-events-none"}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="facebookAppId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>App ID</FormLabel>
                      <FormControl>
                        <Input placeholder="App ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="facebookAppSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>App Secret</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="App Secret" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormDescription>
                  Configurare il redirect URI nel Facebook Developer Portal come: 
                  <code className="px-1 py-0.5 bg-muted rounded mx-1">/auth/facebook/callback</code>
                </FormDescription>
              </div>
            </CardContent>
          </Card>
          
          {/* GitHub */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">GitHub</CardTitle>
                <Switch
                  checked={githubEnabled}
                  onCheckedChange={setGithubEnabled}
                />
              </div>
            </CardHeader>
            <CardContent className={githubEnabled ? "" : "opacity-50 pointer-events-none"}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="githubClientId"
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
                  name="githubClientSecret"
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
                  Configurare il redirect URI in GitHub OAuth Apps come: 
                  <code className="px-1 py-0.5 bg-muted rounded mx-1">/auth/github/callback</code>
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