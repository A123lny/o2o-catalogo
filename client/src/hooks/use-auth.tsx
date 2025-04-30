import { createContext, ReactNode, useContext, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { InsertUser, User, LoginData } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Tipo esteso per l'utente che include il flag di password scaduta
type UserWithPasswordState = User & {
  passwordExpired?: boolean;
};

// Tipo per la risposta di login quando è richiesto 2FA
type TwoFactorLoginResponse = {
  requiresTwoFactor?: boolean;
  requiresTwoFactorSetup?: boolean;
  userId: number;
  username: string;
  passwordExpired?: boolean;
};

// Tipo per la richiesta di verifica 2FA
type TwoFactorVerifyRequest = {
  userId: number;
  token: string;
  isBackupCode?: boolean;
  passwordExpired?: boolean;
};

// Tipo per la richiesta di cambio password
type PasswordChangeRequest = {
  userId: number;
  currentPassword: string;
  newPassword: string;
};

type AuthContextType = {
  user: UserWithPasswordState | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<UserWithPasswordState | TwoFactorLoginResponse, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<UserWithPasswordState, Error, InsertUser>;
  verifyTwoFactorMutation: UseMutationResult<UserWithPasswordState, Error, TwoFactorVerifyRequest>;
  changePasswordMutation: UseMutationResult<UserWithPasswordState, Error, PasswordChangeRequest>;
  twoFactorState: {
    pendingUserId: number | null;
    pendingUsername: string | null;
    requiresTwoFactor: boolean;
    requiresTwoFactorSetup: boolean;
  };
  showPasswordExpiryDialog: boolean;
  setShowPasswordExpiryDialog: (show: boolean) => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [twoFactorState, setTwoFactorState] = useState<{
    pendingUserId: number | null;
    pendingUsername: string | null;
    requiresTwoFactor: boolean;
    requiresTwoFactorSetup: boolean;
  }>({
    pendingUserId: null,
    pendingUsername: null,
    requiresTwoFactor: false,
    requiresTwoFactorSetup: false
  });
  
  // Stato per il dialogo di cambio password quando scaduta
  const [showPasswordExpiryDialog, setShowPasswordExpiryDialog] = useState(false);
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<UserWithPasswordState | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    onSuccess: (data) => {
      // Se l'utente è loggato e la password è scaduta, mostra il dialogo di cambio password
      if (data && data.passwordExpired) {
        setShowPasswordExpiryDialog(true);
      }
    }
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
    onSuccess: (responseData: UserWithPasswordState | TwoFactorLoginResponse) => {
      // Controlla se l'autenticazione richiede 2FA o setup 2FA
      if ('requiresTwoFactor' in responseData && responseData.requiresTwoFactor) {
        // Se richiede 2FA, imposta lo stato per la verifica 2FA
        setTwoFactorState({
          pendingUserId: responseData.userId,
          pendingUsername: responseData.username,
          requiresTwoFactor: true,
          requiresTwoFactorSetup: false
        });
        
        toast({
          title: "Verifica richiesta",
          description: "È necessaria la verifica con autenticazione a due fattori",
        });
      } else if ('requiresTwoFactorSetup' in responseData && responseData.requiresTwoFactorSetup) {
        // Se richiede il setup di 2FA, imposta lo stato per il setup
        setTwoFactorState({
          pendingUserId: responseData.userId,
          pendingUsername: responseData.username,
          requiresTwoFactor: false,
          requiresTwoFactorSetup: true
        });
        
        toast({
          title: "Setup 2FA richiesto",
          description: "È necessario configurare l'autenticazione a due fattori",
        });
      } else {
        // Se non richiede 2FA, procedi con il login normale
        queryClient.setQueryData(["/api/user"], responseData);
        
        // Resetta lo stato 2FA (se per caso era impostato)
        setTwoFactorState({
          pendingUserId: null,
          pendingUsername: null,
          requiresTwoFactor: false,
          requiresTwoFactorSetup: false
        });
        
        // Controlla se la password è scaduta
        if ('passwordExpired' in responseData && responseData.passwordExpired) {
          setShowPasswordExpiryDialog(true);
          
          toast({
            title: "Password scaduta",
            description: "La tua password è scaduta. È necessario cambiarla.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login effettuato",
            description: `Benvenuto${responseData.fullName ? ', ' + responseData.fullName : ''}!`,
          });
        }
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
    mutationFn: async ({ userId, token, isBackupCode = false, passwordExpired }: TwoFactorVerifyRequest) => {
      try {
        const response = await fetch("/api/login/2fa", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            userId, 
            token, 
            isBackupCode,
            passwordExpired
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
    onSuccess: (userData: UserWithPasswordState) => {
      // Aggiorna i dati utente
      queryClient.setQueryData(["/api/user"], userData);
      
      // Resetta lo stato 2FA
      setTwoFactorState({
        pendingUserId: null,
        pendingUsername: null,
        requiresTwoFactor: false,
        requiresTwoFactorSetup: false
      });
      
      // Controlla se la password è scaduta
      if (userData.passwordExpired) {
        setShowPasswordExpiryDialog(true);
        
        toast({
          title: "Password scaduta",
          description: "La tua password è scaduta. È necessario cambiarla.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Verifica completata",
          description: `Benvenuto${userData.fullName ? ', ' + userData.fullName : ''}!`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Verifica fallita",
        description: error.message || "Si è verificato un errore durante la verifica del codice",
        variant: "destructive",
      });
    },
  });

  // Mutation per il cambio password
  const changePasswordMutation = useMutation({
    mutationFn: async ({ userId, currentPassword, newPassword }: PasswordChangeRequest) => {
      try {
        const response = await apiRequest("POST", "/api/user/change-password", {
          userId,
          currentPassword,
          newPassword
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Cambio password fallito");
        }
        
        const userData = await response.json();
        return userData;
      } catch (error: any) {
        console.error("Password change error:", error);
        throw error;
      }
    },
    onSuccess: (userData: UserWithPasswordState) => {
      // Aggiorna i dati utente
      queryClient.setQueryData(["/api/user"], userData);
      
      // Nascondi il dialogo di cambio password
      setShowPasswordExpiryDialog(false);
      
      toast({
        title: "Password aggiornata",
        description: "La tua password è stata aggiornata con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cambio password fallito",
        description: error.message || "Si è verificato un errore durante il cambio password",
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
    onSuccess: (user: UserWithPasswordState) => {
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
      
      // Resetta lo stato di 2FA e cambio password
      setTwoFactorState({
        pendingUserId: null,
        pendingUsername: null,
        requiresTwoFactor: false,
        requiresTwoFactorSetup: false
      });
      setShowPasswordExpiryDialog(false);
      
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
        changePasswordMutation,
        twoFactorState,
        showPasswordExpiryDialog,
        setShowPasswordExpiryDialog
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
