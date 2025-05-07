import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";
import AdminProtectedRoute from "@/components/admin/protected-route";
import { Cog, Mail, Phone, CreditCard, Users as UsersIcon, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// Importazioni a livello di componente
import EmailConfigComponent from "@/components/admin/email-config";
import TwilioConfigComponent from "@/components/admin/twilio-config";
import SocialLoginConfigComponent from "@/components/admin/social-login-config";
import { PaymentConfigsComponent } from "@/components/admin/payment-config";
import EmailTemplateConfigComponent from "@/components/admin/email-template-config";

// Implementazioni locali dei componenti come fallback
import { EmailConfig } from "@/components/admin/integrations/email-config";
import { TwilioConfig } from "@/components/admin/integrations/twilio-config";
import { SocialLoginConfig } from "@/components/admin/integrations/social-login-config";
import { PaymentConfig } from "@/components/admin/integrations/payment-config";
import { EmailTemplateConfig } from "@/components/admin/integrations/email-template-config";

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<string>("email");
  const [retryCounter, setRetryCounter] = useState(0);

  // Carica tutte le configurazioni di integrazione
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/integrations", retryCounter],
    queryFn: async () => {
      try {
        // Per l'email, proviamo prima con l'endpoint dedicato e solo se fallisce usiamo quello integrato
        const emailRes = await apiRequest("GET", "/api/integrations/email");
        
        if (emailRes.ok) {
          const emailConfig = await emailRes.json();
          console.log("Dati email caricati da endpoint dedicato:", emailConfig);
          
          // Restituisci un oggetto con solo i dati email per ora
          return {
            email: emailConfig,
            socialLogin: null,
            twilio: null,
            payment: null,
            emailTemplates: null
          };
        } else {
          // Fallback al caricamento integrato
          const res = await apiRequest("GET", "/api/admin/integrations");
          if (!res.ok) throw new Error("Errore nel caricamento delle configurazioni");
          return res.json();
        }
      } catch (error) {
        console.error("Errore nel caricamento delle configurazioni:", error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 30000, // 30 secondi
  });

  const handleRetry = () => {
    setRetryCounter(prev => prev + 1);
    refetch();
  };

  // In caso di errore, mostra un messaggio di errore
  if (error) {
    return (
      <AdminProtectedRoute>
        <div className="min-h-screen bg-background">
          <AdminSidebar />
          <div className="pl-64 pb-16">
            <AdminHeader 
              title="Integrazioni" 
              description="Configura le integrazioni con servizi esterni" 
              icon={<Cog className="w-8 h-8" />} 
            />
            <main className="p-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Errore di caricamento</AlertTitle>
                <AlertDescription>
                  <p className="mb-4">Si è verificato un errore nel caricamento delle configurazioni. Assicurati di avere i permessi di amministratore per accedere a questa pagina.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRetry}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Riprova
                  </Button>
                </AlertDescription>
              </Alert>
            </main>
          </div>
        </div>
      </AdminProtectedRoute>
    );
  }
  
  // Mostra caricamento
  if (isLoading) {
    return (
      <AdminProtectedRoute>
        <div className="min-h-screen bg-background">
          <AdminSidebar />
          <div className="pl-64 pb-16">
            <AdminHeader 
              title="Integrazioni" 
              description="Configura le integrazioni con servizi esterni" 
              icon={<Cog className="w-8 h-8" />} 
            />
            <main className="p-6 flex justify-center items-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Caricamento configurazioni in corso...</p>
              </div>
            </main>
          </div>
        </div>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-background">
        <AdminSidebar />

        <div className="pl-64 pb-16">
          <AdminHeader 
            title="Integrazioni" 
            description="Configura le integrazioni con servizi esterni" 
            icon={<Cog className="w-8 h-8" />} 
          />

          <main className="p-6">
            <Tabs defaultValue="email" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="twilio">SMS/Telefono</TabsTrigger>
                <TabsTrigger value="social">Social Login</TabsTrigger>
                <TabsTrigger value="payment">Pagamenti</TabsTrigger>
                <TabsTrigger value="templates">Template Email</TabsTrigger>
              </TabsList>

              {/* Tab Email */}
              <TabsContent value="email">
                <Card>
                  <CardHeader>
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 mr-2" />
                      <CardTitle>Configurazione Email</CardTitle>
                    </div>
                    <CardDescription>
                      Configura il sistema di invio email. Le email verranno utilizzate per notifiche e comunicazioni con gli utenti.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data?.email ? (
                      <EmailConfig 
                        config={data.email} 
                        onConfigSaved={() => refetch()}
                      />
                    ) : (
                      <Alert>
                        <AlertTitle>Configurazione non disponibile</AlertTitle>
                        <AlertDescription>
                          Non è stato possibile caricare la configurazione email.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Twilio */}
              <TabsContent value="twilio">
                <Card>
                  <CardHeader>
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 mr-2" />
                      <CardTitle>Configurazione SMS e Telefono</CardTitle>
                    </div>
                    <CardDescription>
                      Configura Twilio per inviare SMS e verificare numeri di telefono. Utile per autenticazione a due fattori e notifiche via SMS.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data?.twilio ? (
                      <TwilioConfig 
                        config={data.twilio} 
                        onConfigSaved={() => refetch()}
                      />
                    ) : (
                      <Alert>
                        <AlertTitle>Configurazione non disponibile</AlertTitle>
                        <AlertDescription>
                          Non è stato possibile caricare la configurazione Twilio.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Social Login */}
              <TabsContent value="social">
                <Card>
                  <CardHeader>
                    <div className="flex items-center">
                      <UsersIcon className="w-5 h-5 mr-2" />
                      <CardTitle>Social Login</CardTitle>
                    </div>
                    <CardDescription>
                      Configura l'accesso tramite account social media. Gli utenti potranno accedere utilizzando i loro account esistenti sui social network.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data?.socialLogin ? (
                      <SocialLoginConfig 
                        config={data.socialLogin} 
                        onConfigSaved={() => refetch()}
                      />
                    ) : (
                      <Alert>
                        <AlertTitle>Configurazione non disponibile</AlertTitle>
                        <AlertDescription>
                          Non è stato possibile caricare la configurazione dei social login.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Pagamenti */}
              <TabsContent value="payment">
                <Card>
                  <CardHeader>
                    <div className="flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      <CardTitle>Sistemi di Pagamento</CardTitle>
                    </div>
                    <CardDescription>
                      Configura i gateway di pagamento per accettare pagamenti online sul tuo sito.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data?.payment ? (
                      <PaymentConfig 
                        config={data.payment} 
                        onConfigSaved={() => refetch()}
                      />
                    ) : (
                      <Alert>
                        <AlertTitle>Configurazione non disponibile</AlertTitle>
                        <AlertDescription>
                          Non è stato possibile caricare la configurazione dei pagamenti.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Template Email */}
              <TabsContent value="templates">
                <Card>
                  <CardHeader>
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 mr-2" />
                      <CardTitle>Template Email</CardTitle>
                    </div>
                    <CardDescription>
                      Gestisci i template per le email inviate dal sistema.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data?.emailTemplates ? (
                      <EmailTemplateConfig 
                        templates={data.emailTemplates} 
                        onTemplatesSaved={() => refetch()}
                      />
                    ) : (
                      <Alert>
                        <AlertTitle>Configurazione non disponibile</AlertTitle>
                        <AlertDescription>
                          Non è stato possibile caricare i template delle email.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}