import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertRequestSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface RequestFormProps {
  vehicleId: number;
  selectedRentalType?: string;
}

// Extend the insert schema with additional validation
const requestFormSchema = insertRequestSchema.extend({
  privacy: z.boolean().refine(val => val === true, {
    message: "È necessario accettare la privacy policy",
  }),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

export default function RequestForm({ vehicleId, selectedRentalType }: RequestFormProps) {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      vehicleId,
      fullName: "",
      email: "",
      phone: "",
      interestType: selectedRentalType || "Acquisto diretto",
      message: "",
      privacy: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: RequestFormValues) => {
      const { privacy, ...requestData } = data;
      const res = await apiRequest("POST", "/api/requests", requestData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Richiesta inviata",
        description: "La tua richiesta è stata inviata con successo. Ti contatteremo al più presto.",
      });
      setSubmitted(true);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore nell'invio della richiesta. Riprova più tardi.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RequestFormValues) => {
    mutation.mutate(data);
  };

  // Interest type options
  const interestTypes = [
    "Acquisto diretto",
    "Noleggio a Lungo Termine",
    "Rent to Buy",
    "Finanziamento",
    "Altro"
  ];

  if (submitted) {
    return (
      <div className="bg-green-50 p-6 rounded-lg text-center">
        <h3 className="text-xl font-semibold text-green-700 mb-2">Grazie per la tua richiesta!</h3>
        <p className="text-green-600 mb-4">
          Abbiamo ricevuto la tua richiesta di informazioni. Un nostro consulente ti contatterà al più presto.
        </p>
        <Button onClick={() => setSubmitted(false)} variant="outline">
          Invia un'altra richiesta
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome e Cognome*</FormLabel>
                <FormControl>
                  <Input placeholder="Inserisci il tuo nome e cognome" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email*</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Inserisci la tua email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefono*</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="Inserisci il tuo numero di telefono" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="interestType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interessato a</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un'opzione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {interestTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Messaggio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Inserisci eventuali dettagli o domande"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="privacy"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Acconsento al trattamento dei miei dati personali secondo la <a href="#" className="text-primary hover:underline">Privacy Policy</a>*
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        
        <Button
          type="submit"
          className="w-full md:w-auto"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Invio in corso...
            </>
          ) : (
            'Invia Richiesta'
          )}
        </Button>
      </form>
    </Form>
  );
}
