import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: RequestInit | undefined,
): Promise<any> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    ...options,
  });

  await throwIfResNotOk(res);
  
  // Per evitare errori con le risposte vuote
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await res.json();
  }
  
  return res;
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
    
    const res = await fetch(fetchUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
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
