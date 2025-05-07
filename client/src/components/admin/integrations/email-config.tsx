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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Schema per la configurazione email
const schema = z.object({
  host: z.string().min(1, "Il server SMTP è obbligatorio"),
  port: z.string().min(1, "La porta è obbligatoria"),
  username: z.string().min(1, "L'username è obbligatorio"),
  password: z.string().min(1, "La password è obbligatoria"),
  from: z.string().email("Formato email non valido").min(1, "L'indirizzo mittente è obbligatorio"),
  encryption: z.string().optional(),
});

// Tipo per la configurazione email
export interface EmailConfigType {
  id?: number;
  enabled: boolean;
  host: string;
  port: string;
  username: string;
  password: string;
  from: string;
  encryption?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EmailConfigProps {
  config: EmailConfigType;
  onConfigSaved?: () => void;
}

export function EmailConfig({ config, onConfigSaved }: EmailConfigProps) {
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  
  // Form per la configurazione
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      host: "",
      port: "",
      username: "",
      password: "",
      from: "",
      encryption: "tls",
    },
  });
  
  console.log("Email config received:", config);
  
  // Aggiorna il form quando la configurazione cambia
  useEffect(() => {
    if (config) {
      // Forza la conversione a booleano
      const enabled = Boolean(config.enabled);
      console.log("Setting isEnabled to:", enabled, "Type:", typeof enabled);
      setIsEnabled(enabled);
      
      form.reset({
        host: config.host || "",
        port: config.port || "",
        username: config.username || "",
        password: config.password || "",
        from: config.from || "",
        encryption: config.encryption || "tls",
      });
    }
  }, [config, form]);

  // Mutazione per salvare
  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      console.log("Saving with isEnabled:", isEnabled);
      const payload = {
        ...values,
        enabled: isEnabled,
      };
      
      const res = await apiRequest("PUT", "/api/integrations/email", payload);
      if (!res.ok) throw new Error("Errore nel salvataggio della configurazione email");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurazione salvata",
        description: "La configurazione email è stata salvata con successo",
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium">Abilita il sistema di email</h3>
          <p className="text-sm text-muted-foreground">
            Attiva o disattiva l'invio di email dal sistema
          </p>
        </div>
        <Switch 
          checked={isEnabled} 
          onCheckedChange={setIsEnabled}
          data-testid="email-enabled-switch"
        />
      </div>
      
      <div className={isEnabled ? "" : "opacity-50 pointer-events-none"}>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Server SMTP</FormLabel>
                    <FormControl>
                      <Input placeholder="smtp.example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porta</FormLabel>
                    <FormControl>
                      <Input placeholder="587" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="from"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Indirizzo mittente</FormLabel>
                  <FormControl>
                    <Input placeholder="noreply@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Questo indirizzo apparirà come mittente nelle email inviate
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="encryption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Crittografia</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona il tipo di crittografia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="tls">TLS</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                      <SelectItem value="none">Nessuna</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Il tipo di crittografia da utilizzare per la connessione SMTP
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
    </div>
  );
}