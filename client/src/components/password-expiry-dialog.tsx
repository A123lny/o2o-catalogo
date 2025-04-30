import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Loader2 } from "lucide-react";

// Schema di validazione per il cambio password
const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Inserisci la password attuale"),
    newPassword: z.string().min(8, "La nuova password deve contenere almeno 8 caratteri"),
    confirmPassword: z.string().min(1, "Conferma la nuova password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Le password non corrispondono",
    path: ["confirmPassword"],
  });

type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;

interface PasswordExpiryDialogProps {
  isOpen: boolean;
  userId: number;
  onPasswordChanged: () => void;
}

export function PasswordExpiryDialog({
  isOpen,
  userId,
  onPasswordChanged,
}: PasswordExpiryDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  
  const form = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: PasswordChangeFormValues) {
    setIsSubmitting(true);
    setServerErrors([]);

    try {
      const response = await apiRequest("POST", "/api/user/change-password", {
        userId,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.errors && Array.isArray(errorData.errors)) {
          setServerErrors(errorData.errors);
        } else {
          setServerErrors([errorData.message || "Si è verificato un errore durante il cambio password"]);
        }
        return;
      }

      toast({
        title: "Password aggiornata",
        description: "La tua password è stata aggiornata con successo",
      });

      // Resetta il form
      form.reset();
      
      // Aggiorna l'utente nel queryClient
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Notifica il componente parent
      onPasswordChanged();
    } catch (error) {
      console.error("Errore durante il cambio password:", error);
      setServerErrors(["Si è verificato un errore durante il cambio password"]);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>La tua password è scaduta</DialogTitle>
          <DialogDescription>
            Per motivi di sicurezza, è necessario modificare la password.
            Per favore, crea una nuova password che soddisfi i requisiti di sicurezza.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {serverErrors.length > 0 && (
              <div className="p-3 bg-destructive/20 rounded-md border border-destructive text-destructive text-sm">
                <ul className="list-disc pl-4">
                  {serverErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password attuale</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Inserisci la password attuale" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nuova password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Inserisci la nuova password" {...field} />
                  </FormControl>
                  <FormMessage />
                  <div className="text-xs text-muted-foreground">
                    La password deve contenere almeno 8 caratteri, inclusi lettere maiuscole, minuscole, numeri e caratteri speciali.
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conferma password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Conferma la nuova password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aggiornamento...
                  </>
                ) : (
                  "Aggiorna password"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}