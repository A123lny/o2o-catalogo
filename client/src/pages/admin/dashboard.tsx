import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";
import StatCard from "@/components/admin/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useAuth } from "@/hooks/use-auth";

const COLORS = ['#1a4f8c', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  const { data: brands } = useQuery({
    queryKey: ['/api/brands'],
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
  });

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const categoryChartData = stats?.vehiclesByCategory 
    ? Object.entries(stats.vehiclesByCategory).map(([categoryId, count]) => {
        const category = categories?.find(c => c.id === parseInt(categoryId));
        return {
          name: category?.name || `Category ${categoryId}`,
          value: count,
        };
      })
    : [];

  const brandChartData = stats?.vehiclesByBrand
    ? Object.entries(stats.vehiclesByBrand).map(([brandId, count]) => {
        const brand = brands?.find(b => b.id === parseInt(brandId));
        return {
          name: brand?.name || `Brand ${brandId}`,
          value: count,
        };
      })
    : [];

  return (
    <div className="flex h-screen bg-neutral-100">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader user={user} />
        
        <main className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-neutral-800">Dashboard</h1>
            <p className="text-neutral-500">Panoramica delle statistiche e delle attività recenti</p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Veicoli in catalogo"
              value={stats?.totalVehicles}
              icon="car"
              trend="up"
              trendValue="12%"
              trendText="rispetto al mese scorso"
              color="blue"
            />
            
            <StatCard
              title="Richieste ricevute"
              value={stats?.totalRequests}
              icon="envelope"
              trend="up"
              trendValue="8%"
              trendText="rispetto al mese scorso"
              color="indigo"
            />
            
            <StatCard
              title="Visite sito"
              value="2,845"
              icon="users"
              trend="up"
              trendValue="24%"
              trendText="rispetto al mese scorso"
              color="green"
            />
            
            <StatCard
              title="Contratti finalizzati"
              value="18"
              icon="file-signature"
              trend="down"
              trendValue="5%"
              trendText="rispetto al mese scorso"
              color="yellow"
            />
          </div>
          
          {/* Recent Activity and Stats Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-4 lg:col-span-2">
              <h2 className="font-bold mb-4 flex items-center justify-between">
                <span>Statistiche di visita</span>
                <div className="text-sm font-normal text-neutral-500">
                  <select className="border-none text-sm text-neutral-500 focus:ring-0">
                    <option>Ultimi 30 giorni</option>
                    <option>Ultimi 90 giorni</option>
                    <option>Quest'anno</option>
                  </select>
                </div>
              </h2>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: '1 Giu', visits: 105, newUsers: 42 },
                      { name: '8 Giu', visits: 152, newUsers: 67 },
                      { name: '15 Giu', visits: 189, newUsers: 78 },
                      { name: '22 Giu', visits: 201, newUsers: 85 },
                      { name: '29 Giu', visits: 176, newUsers: 73 },
                      { name: '5 Lug', visits: 220, newUsers: 94 },
                      { name: '12 Lug', visits: 245, newUsers: 102 },
                    ]}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="visits" name="Visite totali" fill="#1a4f8c" />
                    <Bar dataKey="newUsers" name="Nuovi utenti" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-bold mb-4">Attività Recenti</h2>
              <div className="space-y-4">
                {stats?.recentRequests?.map((request: any, index: number) => (
                  <div key={index} className="border-l-2 border-blue-500 pl-3">
                    <div className="text-sm">
                      <span className="font-medium">Richiesta informazioni</span>
                      <span className="text-neutral-500 block">
                        {request.fullName} - ID Veicolo: {request.vehicleId}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      {new Date(request.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
                
                {(!stats?.recentRequests || stats.recentRequests.length === 0) && (
                  <p className="text-neutral-500 text-sm">Nessuna attività recente</p>
                )}
              </div>
              <a href="/admin/requests" className="text-primary hover:text-primary-dark text-sm font-medium mt-4 inline-block">
                Vedi tutte le attività
              </a>
            </div>
          </div>
          
          {/* Vehicle Types and Requests Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-bold mb-4">Tipologie Veicoli</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} veicoli`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-bold mb-4 flex items-center justify-between">
                <span>Ultime Richieste</span>
                <a href="/admin/requests" className="text-primary hover:text-primary-dark text-sm font-medium">
                  Vedi tutte
                </a>
              </h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Veicolo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Stato</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {stats?.recentRequests?.map((request: any, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium">{request.fullName}</div>
                          <div className="text-xs text-neutral-500">{request.email}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">ID: {request.vehicleId}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            request.status === 'new' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : request.status === 'in_progress'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {request.status === 'new' 
                              ? 'Nuova' 
                              : request.status === 'in_progress'
                              ? 'In gestione'
                              : 'Completata'
                            }
                          </span>
                        </td>
                      </tr>
                    ))}
                    
                    {(!stats?.recentRequests || stats.recentRequests.length === 0) && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-neutral-500">
                          Nessuna richiesta recente
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
