import React from "react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Car, 
  TagsIcon,
  Settings, 
  Users, 
  FileText, 
  LogOut, 
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export default function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation, isLoading } = useAuth();
  const [isVehiclesOpen, setIsVehiclesOpen] = React.useState(location.includes("/admin/vehicles") || location.includes("/admin/rental-options"));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-[400px]">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Accesso negato</h1>
        <p>Non hai i permessi necessari per accedere a questa pagina.</p>
        <Button asChild>
          <Link href="/auth">Accedi</Link>
        </Button>
      </div>
    );
  }

  const menuItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5 mr-2" />,
      href: "/admin",
      active: location === "/admin",
    },
    {
      title: "Marchi e Categorie",
      icon: <TagsIcon className="w-5 h-5 mr-2" />,
      href: "/admin/brands-categories",
      active: location === "/admin/brands-categories",
    },
    {
      title: "Gestione Veicoli",
      icon: <Car className="w-5 h-5 mr-2" />,
      children: [
        {
          title: "Veicoli",
          href: "/admin/vehicles",
          active: location === "/admin/vehicles",
        },
        {
          title: "Opzioni di Noleggio",
          href: "/admin/rental-options",
          active: location === "/admin/rental-options",
        },
      ],
    },
    {
      title: "Richieste Informazioni",
      icon: <FileText className="w-5 h-5 mr-2" />,
      href: "/admin/requests",
      active: location === "/admin/requests",
    },
    {
      title: "Utenti",
      icon: <Users className="w-5 h-5 mr-2" />,
      href: "/admin/users",
      active: location === "/admin/users",
    },
    {
      title: "Impostazioni",
      icon: <Settings className="w-5 h-5 mr-2" />,
      href: "/admin/settings",
      active: location === "/admin/settings",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
        <div className="p-2">
          <nav className="space-y-1">
            {menuItems.map((item, index) => {
              if (item.children) {
                return (
                  <Collapsible
                    key={index}
                    open={isVehiclesOpen}
                    onOpenChange={setIsVehiclesOpen}
                    className="w-full"
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        className={cn(
                          "flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors",
                          item.children.some((child) => child.active) && "bg-gray-100 font-medium"
                        )}
                      >
                        {item.icon}
                        <span className="flex-1 text-left">{item.title}</span>
                        {isVehiclesOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-10 space-y-1 mt-1">
                      {item.children.map((child, childIndex) => (
                        <Link
                          key={childIndex}
                          href={child.href}
                          className={cn(
                            "flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors",
                            child.active && "bg-gray-100 font-medium",
                            "w-full text-left"
                          )}
                        >
                          {child.title}
                        </Link>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              }

              return (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors",
                    item.active && "bg-gray-100 font-medium",
                    "w-full"
                  )}
                >
                  {item.icon}
                  {item.title}
                </Link>
              );
            })}

            <button
              onClick={() => logoutMutation.mutate()}
              className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors text-red-600"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </button>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && <p className="text-gray-500 mt-1">{description}</p>}
        </header>
        {children}
      </main>
    </div>
  );
}