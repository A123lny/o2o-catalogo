import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PasswordExpiryDialog } from "@/components/password-expiry-dialog";

interface AuthWrapperProps {
  children: ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { 
    user, 
    showPasswordExpiryDialog, 
    setShowPasswordExpiryDialog,
    changePasswordMutation
  } = useAuth();

  // Funzione per gestire il cambio password completato
  const handlePasswordChanged = () => {
    // Nascondi il dialogo
    setShowPasswordExpiryDialog(false);
  };

  return (
    <>
      {/* Mostra il dialogo di cambio password se l'utente è loggato e la password è scaduta */}
      {user && showPasswordExpiryDialog && (
        <PasswordExpiryDialog
          isOpen={showPasswordExpiryDialog}
          userId={user.id}
          onPasswordChanged={handlePasswordChanged}
        />
      )}
      
      {/* Contenuto principale dell'applicazione */}
      {children}
    </>
  );
}