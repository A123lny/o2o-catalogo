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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Schema per la validazione del form
const emailTemplateSchema = z.object({
  name: z.string().min(1, "Nome template richiesto"),
  subject: z.string().min(1, "Oggetto richiesto"),
  body: z.string().min(1, "Corpo dell'email richiesto"),
});

type EmailTemplateType = z.infer<typeof emailTemplateSchema>;

export default function EmailTemplateConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTemplate, setActiveTemplate] = useState<string>("welcome");
  
  // Carica i template esistenti
  const { data: templates, isLoading } = useQuery({
    queryKey: ["/api/integrations/email-templates"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/integrations/email-templates");
      if (!response.ok) {
        throw new Error("Errore nel caricamento dei template");
      }
      return response.json();
    },
  });
  
  // Form per la modifica dei template
  const form = useForm<EmailTemplateType>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      name: activeTemplate,
      subject: "",
      body: "",
    },
  });
  
  // Aggiorna il form quando cambia il template attivo
  useEffect(() => {
    if (templates && templates[activeTemplate]) {
      form.reset({
        name: activeTemplate,
        subject: templates[activeTemplate].subject || "",
        body: templates[activeTemplate].body || "",
      });
    } else {
      // Template predefiniti se non esistono nel database
      let defaultSubject = "";
      let defaultBody = "";
      
      switch (activeTemplate) {
        case "welcome":
          defaultSubject = "Benvenuto su o2o Mobility";
          defaultBody = "Ciao {{username}},\n\nBenvenuto su o2o Mobility! Siamo lieti di averti a bordo.\n\nGrazie,\nIl team di o2o Mobility";
          break;
        case "password-reset":
          defaultSubject = "Richiesta di reset password";
          defaultBody = "Ciao {{username}},\n\nHai richiesto il reset della tua password. Clicca sul link seguente per procedere:\n\n{{resetLink}}\n\nSe non hai richiesto questo reset, ignora questa email.\n\nGrazie,\nIl team di o2o Mobility";
          break;
        case "verification":
          defaultSubject = "Verifica il tuo indirizzo email";
          defaultBody = "Ciao {{username}},\n\nGrazie per la registrazione! Per completare il processo, verifica il tuo indirizzo email cliccando sul link seguente:\n\n{{verificationLink}}\n\nGrazie,\nIl team di o2o Mobility";
          break;
        case "request-confirmation":
          defaultSubject = "Conferma della tua richiesta";
          defaultBody = "Ciao {{username}},\n\nLa tua richiesta è stata ricevuta ed è in fase di elaborazione.\n\nDettagli della richiesta:\n{{requestDetails}}\n\nTi contatteremo presto.\n\nGrazie,\nIl team di o2o Mobility";
          break;
      }
      
      form.reset({
        name: activeTemplate,
        subject: defaultSubject,
        body: defaultBody,
      });
    }
  }, [activeTemplate, templates, form]);
  
  // Mutation per salvare il template
  const saveMutation = useMutation({
    mutationFn: async (data: EmailTemplateType) => {
      const response = await apiRequest("POST", "/api/admin/integrations/email-template", data);
      
      if (!response.ok) {
        let errorMessage = "Errore durante il salvataggio del template";
        try {
          // Verifichiamo se il corpo della risposta contiene testo
          const text = await response.text();
          if (text) {
            try {
              // Proviamo a convertire il testo in JSON
              const jsonData = JSON.parse(text);
              errorMessage = jsonData?.message || errorMessage;
            } catch (e) {
              // Se non è JSON, usiamo il testo come messaggio di errore
              errorMessage = text || errorMessage;
            }
          }
        } catch (e) {
          console.error("Errore durante la lettura della risposta", e);
        }
        throw new Error(errorMessage);
      }
      
      // Se la risposta è ok, non proviamo a fare il parsing JSON
      // ma restituiamo direttamente i dati inviati
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Template salvato",
        description: "Il template email è stato salvato con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/email-templates"] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Si è verificato un errore: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: EmailTemplateType) => {
    saveMutation.mutate(data);
  };
  
  // Test email
  const [testEmail, setTestEmail] = useState("");
  
  const sendTestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/integrations/test-email", {
        to: testEmail,
        templateName: activeTemplate,
      });
      
      if (!response.ok) {
        let errorMessage = "Errore durante l'invio dell'email di test";
        try {
          // Verifichiamo se il corpo della risposta contiene testo
          const text = await response.text();
          if (text) {
            try {
              // Proviamo a convertire il testo in JSON
              const jsonData = JSON.parse(text);
              errorMessage = jsonData?.message || errorMessage;
            } catch (e) {
              // Se non è JSON, usiamo il testo come messaggio di errore
              errorMessage = text || errorMessage;
            }
          }
        } catch (e) {
          console.error("Errore durante la lettura della risposta", e);
        }
        throw new Error(errorMessage);
      }
      
      // Se la risposta è ok, non proviamo a fare il parsing JSON
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Email inviata",
        description: "L'email di test è stata inviata con successo.",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Si è verificato un errore: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const sendTestEmail = () => {
    if (!testEmail) {
      toast({
        title: "Errore",
        description: "Inserisci un indirizzo email valido",
        variant: "destructive",
      });
      return;
    }
    sendTestMutation.mutate();
  };
  
  const templateOptions = [
    { id: "welcome", label: "Benvenuto" },
    { id: "password-reset", label: "Reset Password" },
    { id: "verification", label: "Verifica Email" },
    { id: "request-confirmation", label: "Conferma Richiesta" },
  ];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Template Email</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="welcome" 
            value={activeTemplate} 
            onValueChange={setActiveTemplate}
            className="space-y-4"
          >
            <TabsList className="grid grid-cols-4">
              {templateOptions.map(option => (
                <TabsTrigger key={option.id} value={option.id}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {templateOptions.map(option => (
              <TabsContent key={option.id} value={option.id}>
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Oggetto</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Oggetto dell'email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="body"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Corpo dell'Email</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Contenuto dell'email" 
                                className="min-h-[200px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="pt-2">
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
                            "Salva Template"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </TabsContent>
            ))}
          </Tabs>
          
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Test Email</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1">
                <div className="space-y-2">
                  <label htmlFor="test-email" className="text-sm font-medium">
                    Indirizzo Email
                  </label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                type="button" 
                onClick={sendTestEmail}
                disabled={sendTestMutation.isPending}
              >
                {sendTestMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  "Invia Email di Test"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Variabili disponibili nei template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">Puoi utilizzare le seguenti variabili nei tuoi template:</p>
            <ul className="list-disc pl-6 text-sm space-y-1">
              <li><code>{"{username}"}</code> - Nome utente</li>
              <li><code>{"{siteName}"}</code> - Nome del sito</li>
              <li><code>{"{resetLink}"}</code> - Link per il reset della password</li>
              <li><code>{"{verificationLink}"}</code> - Link per la verifica dell'email</li>
              <li><code>{"{requestDetails}"}</code> - Dettagli della richiesta</li>
              <li><code>{"{date}"}</code> - Data corrente</li>
              <li><code>{"{url}"}</code> - URL del sito</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}