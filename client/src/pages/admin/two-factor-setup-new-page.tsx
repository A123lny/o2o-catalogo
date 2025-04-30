import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";
import TwoFactorSetupNew from "@/components/two-factor-setup-new";

export default function TwoFactorSetupNewPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect se l'utente non è autenticato
  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-neutral-100">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader user={user} />
        
        <main className="flex-1 overflow-y-auto p-4">
          <TwoFactorSetupNew />
        </main>
      </div>
    </div>
  );
}