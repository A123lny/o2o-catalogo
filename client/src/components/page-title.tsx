import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface PageTitleProps {
  title?: string;
  suffix?: string;
}

export default function PageTitle({ title, suffix }: PageTitleProps) {
  const { data: generalSettings } = useQuery({
    queryKey: ['/api/settings/general'],
    queryFn: async () => {
      const response = await fetch('/api/settings/general');
      if (!response.ok) throw new Error('Errore nel recupero delle impostazioni generali');
      return response.json();
    }
  });

  const siteName = generalSettings?.siteName || "o2o Mobility";

  useEffect(() => {
    // Se è specificato un titolo, usa "Titolo - SiteName"
    // Altrimenti usa solo "SiteName" con un eventuale suffisso
    document.title = title 
      ? `${title} - ${siteName}` 
      : suffix 
        ? `${siteName} - ${suffix}` 
        : siteName;
  }, [title, siteName, suffix]);

  // Questo componente non renderizza nulla nell'interfaccia
  return null;
}