import { useEffect, useRef } from 'react';
import { useAuth } from './use-auth';
import { useQuery } from '@tanstack/react-query';

export function useAutoLogout() {
  const { user, logoutMutation } = useAuth();
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  
  // Fetch security settings to get auto logout time
  const { data: securitySettings } = useQuery({
    queryKey: ['/api/admin/settings/security'],
    queryFn: async () => {
      const response = await fetch('/api/admin/settings/security');
      if (!response.ok) throw new Error('Errore nel recupero delle impostazioni di sicurezza');
      return response.json();
    },
    enabled: !!user, // Solo se l'utente è autenticato
  });

  // Reset timer on any activity
  const resetTimer = () => {
    lastActivityRef.current = Date.now();
  };

  // Setup event listeners for user activity
  useEffect(() => {
    // Attiva solo se c'è un utente e il tempo di logout automatico è > 0
    if (user && securitySettings?.autoLogoutMinutes && securitySettings.autoLogoutMinutes > 0) {
      // Converti minuti in millisecondi
      const logoutTimeMs = securitySettings.autoLogoutMinutes * 60 * 1000;
      
      // Aggiungi listener per attività dell'utente
      const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
      
      const handleUserActivity = () => {
        resetTimer();
      };
      
      activityEvents.forEach(event => {
        window.addEventListener(event, handleUserActivity);
      });
      
      // Funzione che controlla l'inattività
      const checkInactivity = () => {
        const currentTime = Date.now();
        const timeElapsed = currentTime - lastActivityRef.current;
        
        if (timeElapsed >= logoutTimeMs) {
          // Tempo di inattività superato, esegui logout
          logoutMutation.mutate();
        }
      };
      
      // Imposta l'intervallo per controllare l'inattività (ogni 30 secondi)
      logoutTimerRef.current = setInterval(checkInactivity, 30000);
      
      // Cleanup
      return () => {
        if (logoutTimerRef.current) {
          clearInterval(logoutTimerRef.current);
        }
        
        activityEvents.forEach(event => {
          window.removeEventListener(event, handleUserActivity);
        });
      };
    } else if (logoutTimerRef.current) {
      // Se l'utente non è autenticato o il logout automatico è disabilitato, pulisci l'intervallo
      clearInterval(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, [user, securitySettings, logoutMutation]);

  // Inizializza il riferimento all'ultima attività
  useEffect(() => {
    resetTimer();
  }, []);

  return { resetTimer };
}