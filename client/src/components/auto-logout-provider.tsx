import { ReactNode } from "react";
import { useAutoLogout } from "@/hooks/use-auto-logout";
import { useAuth } from "@/hooks/use-auth";

interface AutoLogoutProviderProps {
  children: ReactNode;
}

export function AutoLogoutProvider({ children }: AutoLogoutProviderProps) {
  const { user } = useAuth();
  
  // Utilizza il hook solo se l'utente è autenticato
  if (user) {
    useAutoLogout();
  }
  
  return <>{children}</>;
}