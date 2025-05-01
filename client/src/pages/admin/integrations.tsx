import { useState } from "react";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";
import AdminProtectedRoute from "@/components/admin/protected-route";
import SocialLoginConfig from "@/components/admin/social-login-config";
import EmailConfig from "@/components/admin/email-config-new";
import TwilioConfig from "@/components/admin/twilio-config";
import { PaymentConfigs } from "@/components/admin/payment-config";
import EmailTemplateConfig from "@/components/admin/email-template-config";
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
                  <EmailConfig />
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
                  <TwilioConfig />
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
                  <PaymentConfigs />
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
                  <EmailTemplateConfig />
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