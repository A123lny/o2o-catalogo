import { createContext, ReactNode, useContext, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { InsertUser, User, LoginData } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Tipo per la risposta di login quando è richiesto 2FA
type TwoFactorLoginResponse = {
  requiresTwoFactor: true;
  userId: number;
  username: string;
};

// Tipo per la richiesta di verifica 2FA
type TwoFactorVerifyRequest = {
  userId: number;
  token: string;
  isBackupCode?: boolean;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User | TwoFactorLoginResponse, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, InsertUser>;
  verifyTwoFactorMutation: UseMutationResult<User, Error, TwoFactorVerifyRequest>;
  twoFactorState: {
    pendingUserId: number | null;
    pendingUsername: string | null;
    requiresTwoFactor: boolean;
  };
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [twoFactorState, setTwoFactorState] = useState<{
    pendingUserId: number | null;
    pendingUsername: string | null;
    requiresTwoFactor: boolean;
  }>({
    pendingUserId: null,
    pendingUsername: null,
    requiresTwoFactor: false
  });
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credentials),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || "Autenticazione fallita");
        }
        
        const userData = await response.json();
        return userData;
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },
    onSuccess: (responseData: User | TwoFactorLoginResponse) => {
      // Controlla se l'autenticazione richiede 2FA
      if ('requiresTwoFactor' in responseData) {
        // Se richiede 2FA, imposta lo stato per la verifica 2FA
        setTwoFactorState({
          pendingUserId: responseData.userId,
          pendingUsername: responseData.username,
          requiresTwoFactor: true
        });
        
        toast({
          title: "Verifica richiesta",
          description: "È necessaria la verifica con autenticazione a due fattori",
        });
      } else {
        // Se non richiede 2FA, procedi con il login normale
        queryClient.setQueryData(["/api/user"], responseData);
        
        // Resetta lo stato 2FA (se per caso era impostato)
        setTwoFactorState({
          pendingUserId: null,
          pendingUsername: null,
          requiresTwoFactor: false
        });
        
        toast({
          title: "Login effettuato",
          description: `Benvenuto, ${responseData.fullName}!`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login fallito",
        description: error.message || "Si è verificato un errore durante il login",
        variant: "destructive",
      });
    },
  });
  
  // Mutation per verifica 2FA
  const verifyTwoFactorMutation = useMutation({
    mutationFn: async ({ userId, token, isBackupCode = false }: TwoFactorVerifyRequest) => {
      try {
        const response = await fetch("/api/login/2fa", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            userId, 
            token, 
            isBackupCode
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || "Verifica 2FA fallita");
        }
        
        const userData = await response.json();
        return userData;
      } catch (error) {
        console.error("2FA verification error:", error);
        throw error;
      }
    },
    onSuccess: (userData: User) => {
      // Aggiorna i dati utente
      queryClient.setQueryData(["/api/user"], userData);
      
      // Resetta lo stato 2FA
      setTwoFactorState({
        pendingUserId: null,
        pendingUsername: null,
        requiresTwoFactor: false
      });
      
      toast({
        title: "Verifica completata",
        description: `Benvenuto, ${userData.fullName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verifica fallita",
        description: error.message || "Si è verificato un errore durante la verifica del codice",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      try {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credentials),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || "Registrazione fallita");
        }
        
        const userData = await response.text();
        return JSON.parse(userData);
      } catch (error) {
        console.error("Registration error:", error);
        throw error;
      }
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registrazione completata",
        description: "Il tuo account è stato creato con successo!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registrazione fallita",
        description: error.message || "Si è verificato un errore durante la registrazione",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await fetch("/api/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          }
        });
        
        if (!response.ok) {
          throw new Error("Logout fallito");
        }
      } catch (error) {
        console.error("Logout error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logout effettuato",
        description: "Hai effettuato il logout con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout fallito",
        description: error.message || "Si è verificato un errore durante il logout",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        verifyTwoFactorMutation,
        twoFactorState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
