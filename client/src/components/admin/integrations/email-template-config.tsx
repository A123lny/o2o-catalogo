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
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Tipo per i template email
export interface EmailTemplateType {
  subject: string;
  body: string;
}

export interface EmailTemplatesType {
  [key: string]: EmailTemplateType;
}

interface EmailTemplateConfigProps {
  templates: EmailTemplatesType;
  onTemplatesSaved?: () => void;
}

// Schema per i template email
const schema = z.object({
  name: z.string().min(1, "Seleziona un template"),
  subject: z.string().min(1, "L'oggetto è obbligatorio"),
  body: z.string().min(1, "Il corpo dell'email è obbligatorio"),
});

export function EmailTemplateConfig({ templates, onTemplatesSaved }: EmailTemplateConfigProps) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [templateNames, setTemplateNames] = useState<string[]>([]);
  
  // Form per il template
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      subject: "",
      body: "",
    },
  });
  
  // Inizializza l'elenco dei template disponibili
  useEffect(() => {
    if (templates) {
      const names = Object.keys(templates);
      setTemplateNames(names);
      
      // Seleziona il primo template se c'è
      if (names.length > 0 && !selectedTemplate) {
        setSelectedTemplate(names[0]);
        const template = templates[names[0]];
        
        form.reset({
          name: names[0],
          subject: template.subject,
          body: template.body,
        });
      }
    }
  }, [templates, form, selectedTemplate]);
  
  // Quando cambia il template selezionato
  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value);
    if (templates[value]) {
      form.reset({
        name: value,
        subject: templates[value].subject,
        body: templates[value].body,
      });
    }
  };

  // Mutazione per salvare
  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const res = await apiRequest("PUT", "/api/admin/integrations/email-template", values);
      if (!res.ok) throw new Error("Errore nel salvataggio del template email");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Template salvato",
        description: "Il template email è stato salvato con successo",
      });
      if (onTemplatesSaved) onTemplatesSaved();
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
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleTemplateChange(value);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un template" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {templateNames.map(name => (
                      <SelectItem key={name} value={name}>
                        {name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Seleziona il template email da modificare
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>Modifica Template: {selectedTemplate}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Oggetto</FormLabel>
                      <FormControl>
                        <Input placeholder="Oggetto dell'email" {...field} />
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
                      <FormLabel>Corpo dell'email</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Contenuto HTML dell'email" 
                          className="min-h-[300px] font-mono text-sm"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Puoi usare codice HTML e le seguenti variabili:
                        <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                          <li><code className="bg-muted p-1 rounded">{"{{username}}"}</code> - Nome utente</li>
                          <li><code className="bg-muted p-1 rounded">{"{{siteName}}"}</code> - Nome del sito</li>
                          <li><code className="bg-muted p-1 rounded">{"{{url}}"}</code> - URL del sito</li>
                        </ul>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}
          
          <Button
            type="submit"
            className="w-full mt-6"
            disabled={saveMutation.isPending || !selectedTemplate}
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
        </form>
      </Form>
    </div>
  );
}