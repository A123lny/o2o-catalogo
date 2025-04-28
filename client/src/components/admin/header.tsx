import { useState } from "react";
import { Link } from "wouter";
import { User } from "@shared/schema";
import {
  Search,
  Bell,
  ChevronDown,
  User as UserIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

interface AdminHeaderProps {
  user: User | null;
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const [search, setSearch] = useState("");
  const { logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Searching for:", search);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between p-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-64">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-500">
            <Search className="h-4 w-4" />
          </span>
          <Input
            type="text"
            placeholder="Cerca..."
            className="pl-10 pr-4 py-2 w-full"
            value={search}
            onChange={handleSearchChange}
          />
        </form>
        
        {/* User Menu */}
        <div className="flex items-center space-x-4">
          <button className="text-neutral-500 hover:text-neutral-700">
            <Bell className="h-5 w-5" />
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center space-x-2 focus:outline-none">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                {user ? (
                  <span className="text-sm font-medium">{getInitials(user.fullName)}</span>
                ) : (
                  <UserIcon className="h-4 w-4" />
                )}
              </div>
              <span className="font-medium text-neutral-700">
                {user?.fullName || 'Admin'}
              </span>
              <ChevronDown className="h-4 w-4 text-neutral-500" />
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Il mio account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/admin/settings" className="w-full">
                  Impostazioni
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/" className="w-full">
                  Vai al sito
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
