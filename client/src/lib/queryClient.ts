import { QueryClient, QueryFunction } from "@tanstack/react-query";

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: RequestInit | undefined,
): Promise<any> {
  // Configura headers e body in base al tipo di dati
  let headers = {};
  let body = undefined;
  
  if (data) {
    // Se data è una istanza di FormData, non impostare Content-Type (lo fa il browser)
    if (data instanceof FormData) {
      body = data;
    } else {
      // Per i dati JSON, imposta l'header e serializza
      headers = { "Content-Type": "application/json" };
      body = JSON.stringify(data);
    }
  }
  
  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      credentials: "include",
      ...options,
    });

    if (!res.ok) {
      let errorMessage = res.statusText || "Errore nella richiesta";
      // Prova a ottenere il messaggio di errore dal body, se disponibile
      try {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          errorMessage = await res.text() || errorMessage;
        }
      } catch (e) {
        console.error("Errore nel parsing della risposta di errore:", e);
      }
      throw new Error(errorMessage);
    }
    
    // Se la risposta ha avuto successo, controlla se c'è un corpo JSON da restituire
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        return await res.json();
      } catch (e) {
        console.warn("Risposta indicata come JSON ma non parsabile:", e);
        return { success: true, responseStatus: res.status };
      }
    }
    
    // Per metodi che non restituiscono necessariamente JSON (come DELETE)
    // o per risposte vuote, restituisci un oggetto con il successo
    return { 
      success: true, 
      responseStatus: res.status,
      message: "Operazione completata con successo" 
    };
  } catch (error) {
    console.error(`Errore in ${method} ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const params = queryKey[1] as Record<string, any>;
    
    // Costruisci l'URL con i parametri di query se sono presenti
    let fetchUrl = url;
    if (params && Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      
      // Aggiungi solo parametri non vuoti, gestendo anche array
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Gestisci array (come brandIds e categoryIds)
          if (Array.isArray(value)) {
            // Aggiungi solo array non vuoti
            if (value.length > 0) {
              // Usa lo stesso parametro una volta con tutti i valori separati da virgola
              queryParams.append(key, value.join(','));
            }
          } 
          // Gestisci valori singoli
          else if (value !== "") {
            queryParams.append(key, String(value));
          }
        }
      });
      
      const queryString = queryParams.toString();
      if (queryString) {
        fetchUrl = `${url}?${queryString}`;
      }
    }
    
    try {
      const res = await fetch(fetchUrl, {
        credentials: "include",
      });
  
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }
  
      if (!res.ok) {
        let errorMessage = res.statusText || "Errore nella richiesta";
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await res.json();
            errorMessage = errorData.message || errorMessage;
          } else {
            errorMessage = await res.text() || errorMessage;
          }
        } catch (e) {
          console.error("Errore nel parsing della risposta di errore:", e);
        }
        throw new Error(errorMessage);
      }
      
      // Se la risposta è vuota o non è JSON, restituisci un oggetto di successo
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          return await res.json();
        } catch (e) {
          console.warn("Risposta indicata come JSON ma non parsabile:", e);
          return { success: true, responseStatus: res.status };
        }
      }
      
      return { 
        success: true, 
        responseStatus: res.status,
        message: "Operazione completata con successo" 
      };
    } catch (error) {
      console.error(`Errore in GET ${fetchUrl}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
