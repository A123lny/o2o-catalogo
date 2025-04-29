import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function Footer() {
  // Fetch general settings for site name and footer content
  const { data: generalSettings, isLoading } = useQuery({
    queryKey: ['/api/settings/general'],
    queryFn: async () => {
      const response = await fetch('/api/settings/general');
      if (!response.ok) throw new Error('Errore nel recupero delle impostazioni generali');
      return response.json();
    }
  });

  const currentYear = new Date().getFullYear();
  const siteName = generalSettings?.siteName || "o2o Mobility";
  const footerText = generalSettings?.footerText || "Tutti i diritti riservati.";

  return (
    <footer className="bg-neutral-800 text-white py-4">
      <div className="container mx-auto px-4">
        <div className="border-t border-neutral-700 py-4">
          <div className="flex justify-center">
            {isLoading ? (
              <div className="flex items-center text-neutral-400 text-sm">
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                <span>Caricamento...</span>
              </div>
            ) : (
              <p className="text-neutral-400 text-sm text-center">
                © {currentYear} {siteName}. {footerText}
              </p>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
