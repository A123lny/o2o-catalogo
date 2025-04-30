import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const [, setLocation] = useLocation();
  const { logoutMutation, user } = useAuth();

  useEffect(() => {
    // Se l'utente è autenticato, esegui il logout
    if (user) {
      logoutMutation.mutate(undefined, {
        onSuccess: () => {
          // Reindirizza alla pagina di login dopo il logout
          setLocation("/auth");
        }
      });
    } else {
      // Se l'utente non è autenticato, vai alla pagina di login
      setLocation("/auth");
    }
  }, [user, logoutMutation, setLocation]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h1 className="text-xl font-semibold mb-2">Logout in corso...</h1>
      <p className="text-muted-foreground">Stai per essere reindirizzato.</p>
    </div>
  );
}