import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Car,
  Mail,
  Tag,
  Users,
  Settings,
  Plug,
  LogOut,
  Megaphone
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminSidebar() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  const isActive = (path: string) => {
    return location === path;
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="w-64 bg-sidebar flex flex-col h-screen text-sidebar-foreground">
      <div className="p-4 bg-primary">
        <div className="flex items-center">
          <Link href="/">
            <div className="cursor-pointer">
              <span className="font-bold text-xl">AUTO<span className="opacity-80">PRESTIGE</span></span>
            </div>
          </Link>
        </div>
        <div className="text-sm opacity-80 mt-1">Pannello Amministrativo</div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
          Generale
        </div>
        
        <Link href="/admin">
          <div className={`flex items-center px-4 py-3 hover:bg-sidebar-accent ${isActive('/admin') ? 'bg-sidebar-accent' : ''}`}>
            <LayoutDashboard className="w-5 h-5 mr-3" />
            <span>Dashboard</span>
          </div>
        </Link>
        
        <Link href="/admin/vehicles">
          <div className={`flex items-center px-4 py-3 hover:bg-sidebar-accent ${isActive('/admin/vehicles') || isActive('/admin/vehicles/new') || location.startsWith('/admin/vehicles/') ? 'bg-sidebar-accent' : ''}`}>
            <Car className="w-5 h-5 mr-3" />
            <span>Veicoli</span>
          </div>
        </Link>
        
        <Link href="/admin/promos">
          <div className={`flex items-center px-4 py-3 hover:bg-sidebar-accent ${isActive('/admin/promos') ? 'bg-sidebar-accent' : ''}`}>
            <Megaphone className="w-5 h-5 mr-3" />
            <span>Gestione Promo</span>
          </div>
        </Link>
        
        <Link href="/admin/requests">
          <div className={`flex items-center px-4 py-3 hover:bg-sidebar-accent ${isActive('/admin/requests') ? 'bg-sidebar-accent' : ''}`}>
            <Mail className="w-5 h-5 mr-3" />
            <span>Richieste</span>
          </div>
        </Link>
        
        <Link href="/admin/brands-categories">
          <div className={`flex items-center px-4 py-3 hover:bg-sidebar-accent ${isActive('/admin/brands-categories') ? 'bg-sidebar-accent' : ''}`}>
            <Tag className="w-5 h-5 mr-3" />
            <span>Marche & Categorie</span>
          </div>
        </Link>
        
        <div className="px-4 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mt-4">
          Impostazioni
        </div>
        
        <Link href="/admin/users">
          <div className={`flex items-center px-4 py-3 hover:bg-sidebar-accent ${isActive('/admin/users') ? 'bg-sidebar-accent' : ''}`}>
            <Users className="w-5 h-5 mr-3" />
            <span>Utenti & Permessi</span>
          </div>
        </Link>
        
        <Link href="/admin/settings">
          <div className={`flex items-center px-4 py-3 hover:bg-sidebar-accent ${isActive('/admin/settings') ? 'bg-sidebar-accent' : ''}`}>
            <Settings className="w-5 h-5 mr-3" />
            <span>Configurazione</span>
          </div>
        </Link>
        
        <div className={`flex items-center px-4 py-3 hover:bg-sidebar-accent text-sidebar-foreground/80 cursor-pointer`}>
          <Plug className="w-5 h-5 mr-3" />
          <span>Integrazioni</span>
        </div>
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="outline"
          className="w-full justify-start text-sidebar-foreground bg-sidebar-accent hover:bg-sidebar-accent/80"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}
