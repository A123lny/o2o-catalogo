import { useState } from "react";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";
import { Cog, Mail, Phone, CreditCard, Users as UsersIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<string>("email");

  return (
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
                  <div className="p-4 border rounded-lg mb-4">
                    <h3 className="text-lg font-medium mb-2">Stato implementazione</h3>
                    <p className="mb-2">Questa sezione consente di configurare:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Attivazione/disattivazione del sistema email</li>
                      <li>Configurazione provider SMTP o SendGrid</li>
                      <li>Test dell'invio email con template personalizzati</li>
                    </ul>
                    <p className="mt-3 text-muted-foreground">
                      Il database e le API per la gestione delle email sono implementati e sono funzionanti.
                    </p>
                  </div>
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
                  <div className="p-4 border rounded-lg mb-4">
                    <h3 className="text-lg font-medium mb-2">Stato implementazione</h3>
                    <p className="mb-2">Questa sezione consente di configurare:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Integrazione con Twilio per invio SMS</li>
                      <li>Servizio di verifica numero telefono</li>
                      <li>Integrazione SMS per l'autenticazione a due fattori</li>
                    </ul>
                    <p className="mt-3 text-muted-foreground">
                      Il database e le API per la gestione degli SMS sono implementati e sono funzionanti.
                    </p>
                  </div>
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
                  <div className="space-y-6">
                    <SocialLoginConfig provider="google" />
                    <SocialLoginConfig provider="facebook" />
                    <SocialLoginConfig provider="github" />
                  </div>
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
                  <div className="p-4 border rounded-lg mb-4">
                    <h3 className="text-lg font-medium mb-2">Stato implementazione</h3>
                    <p className="mb-2">Questa sezione consente di configurare:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Integrazione con Stripe</li>
                      <li>Integrazione con PayPal</li>
                    </ul>
                    <p className="mt-3 text-muted-foreground">
                      Il database e le API per la gestione dei pagamenti sono implementati e sono funzionanti.
                    </p>
                  </div>
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
                  <div className="p-4 border rounded-lg mb-4">
                    <h3 className="text-lg font-medium mb-2">Stato implementazione</h3>
                    <p className="mb-2">Questa sezione consente di configurare:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Templates per email di benvenuto</li>
                      <li>Templates per reset password</li>
                      <li>Templates per verifica email</li>
                      <li>Templates per conferma richieste</li>
                    </ul>
                    <p className="mt-3 text-muted-foreground">
                      Il database e le API per la gestione dei template email sono implementati e sono funzionanti.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}