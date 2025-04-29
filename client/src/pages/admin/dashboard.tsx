import React from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/layout";
import { 
  Car, 
  Users, 
  FileText, 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown, 
  MinusIcon 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Vehicle, Request } from "@shared/schema";
import { formatDistance } from "date-fns";
import { it } from "date-fns/locale";

// Componente per una carta statistica del pannello
function StatCard({
  title,
  value,
  icon,
  trend = "none",
  trendValue,
  trendText,
  color = "blue",
}) {
  // Determina il colore della carta in base al parametro
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };

  // Determina l'icona e il colore del trend
  const trendIcon =
    trend === "up" ? (
      <TrendingUp className="h-4 w-4 text-green-700" />
    ) : trend === "down" ? (
      <TrendingDown className="h-4 w-4 text-red-700" />
    ) : (
      <MinusIcon className="h-4 w-4 text-gray-500" />
    );

  const trendColor =
    trend === "up"
      ? "text-green-700"
      : trend === "down"
      ? "text-red-700"
      : "text-gray-500";

  return (
    <Card className={`${colorClasses[color]} border`}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          <div className="p-2 rounded-full bg-white/80">{icon}</div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-2xl font-bold">{value}</div>
        {trendValue && (
          <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
            {trendIcon}
            <span>
              {trendValue} {trendText}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    retry: false,
  });

  return (
    <AdminLayout title="Dashboard">
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[130px] w-full" />
            ))}
          </div>
          <Skeleton className="h-[350px] w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Statistiche principali */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Totale Veicoli"
              value={stats.vehicles}
              icon={<Car className="h-5 w-5" />}
              color="blue"
            />
            <StatCard
              title="Utenti"
              value={stats.users}
              icon={<Users className="h-5 w-5" />}
              color="indigo"
            />
            <StatCard
              title="Richieste"
              value={stats.requests}
              trend={stats.pendingRequests > 0 ? "up" : "none"}
              trendValue={stats.pendingRequests > 0 ? stats.pendingRequests : null}
              trendText="in attesa"
              icon={<FileText className="h-5 w-5" />}
              color="green"
            />
            <StatCard
              title="Richieste Completate"
              value={stats.completedRequests}
              icon={<ShoppingCart className="h-5 w-5" />}
              color="yellow"
            />
          </div>

          {/* Tab per contenuti recenti */}
          <Tabs defaultValue="vehicles" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="vehicles">Veicoli Recenti</TabsTrigger>
              <TabsTrigger value="requests">Richieste Recenti</TabsTrigger>
            </TabsList>

            <TabsContent value="vehicles" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Ultimi Veicoli Aggiunti</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {stats.recentVehicles && stats.recentVehicles.length > 0 ? (
                      stats.recentVehicles.map((vehicle: Vehicle) => (
                        <div
                          key={vehicle.id}
                          className="py-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-12 h-12 bg-cover bg-center rounded" 
                              style={{
                                backgroundImage: vehicle.mainImage 
                                  ? `url(${vehicle.mainImage})`
                                  : "url(https://placehold.co/100x100/gray/white?text=Auto)"
                              }}
                            />
                            <div>
                              <div className="font-medium">{vehicle.title}</div>
                              <div className="text-sm text-gray-500">
                                {vehicle.condition} - {vehicle.mileage.toLocaleString('it-IT')} km
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Link
                              href={`/admin/vehicles/${vehicle.id}`}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Modifica
                            </Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-gray-500">
                        Nessun veicolo trovato
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requests" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Ultime Richieste</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {stats.recentRequests && stats.recentRequests.length > 0 ? (
                      stats.recentRequests.map((request: Request) => (
                        <div
                          key={request.id}
                          className="py-3 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium">
                              {request.fullName} 
                              {request.isCompany && request.companyName ? 
                                ` - ${request.companyName}` : 
                                ''}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.email} - {request.phone}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {formatDistance(
                                new Date(request.createdAt),
                                new Date(),
                                { 
                                  addSuffix: true,
                                  locale: it
                                }
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              request.status === "new" 
                                ? "bg-blue-100 text-blue-800" 
                                : request.status === "in_progress" 
                                ? "bg-yellow-100 text-yellow-800" 
                                : request.status === "completed" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {request.status === "new" 
                                ? "Nuova" 
                                : request.status === "in_progress" 
                                ? "In lavorazione" 
                                : request.status === "completed" 
                                ? "Completata" 
                                : request.status}
                            </span>
                            <Link
                              href={`/admin/requests/${request.id}`}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Dettagli
                            </Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-gray-500">
                        Nessuna richiesta trovata
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </AdminLayout>
  );
}