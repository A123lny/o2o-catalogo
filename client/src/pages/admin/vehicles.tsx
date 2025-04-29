import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Vehicle, Brand, Category } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";
import { useAuth } from "@/hooks/use-auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  PlusCircle,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  EyeIcon,
  Badge,
  TagIcon,
  Car,
} from "lucide-react";

export default function VehiclesPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<number | null>(null);

  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery<Vehicle[]>({
    queryKey: ['/api/admin/vehicles'],
  });

  const { data: brands } = useQuery<Brand[]>({
    queryKey: ['/api/brands'],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/vehicles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vehicles'] });
      toast({
        title: "Veicolo eliminato",
        description: "Il veicolo è stato eliminato con successo.",
      });
      setShowDeleteDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'eliminazione del veicolo.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (id: number) => {
    setVehicleToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (vehicleToDelete) {
      deleteMutation.mutate(vehicleToDelete);
    }
  };

  const getBrandName = (brandId: number) => {
    const brand = brands?.find(b => b.id === brandId);
    return brand ? brand.name : `Brand ID: ${brandId}`;
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories?.find(c => c.id === categoryId);
    return category ? category.name : `Category ID: ${categoryId}`;
  };

  // Filter and search vehicles
  const filteredVehicles = vehicles?.filter(vehicle => {
    const matchesSearch = searchTerm === "" || 
      vehicle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesBrand = filterBrand === "" || filterBrand === "all" || vehicle.brandId === parseInt(filterBrand);
    const matchesCategory = filterCategory === "" || filterCategory === "all" || vehicle.categoryId === parseInt(filterCategory);
    
    return matchesSearch && matchesBrand && matchesCategory;
  });

  return (
    <div className="flex h-screen bg-neutral-100">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader user={user} />
        
        <main className="flex-1 overflow-y-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-neutral-800">Veicoli</h1>
              <p className="text-neutral-500">Gestisci il catalogo dei veicoli</p>
            </div>
            
            <Button onClick={() => setLocation('/admin/vehicles/new')} className="bg-primary">
              <PlusCircle className="h-4 w-4 mr-2" /> Nuovo Veicolo
            </Button>
          </div>
          
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute top-3 left-3 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Cerca veicoli..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={filterBrand || "all"} onValueChange={setFilterBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtra per marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le marche</SelectItem>
                  {brands?.map(brand => (
                    <SelectItem key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterCategory || "all"} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtra per categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le categorie</SelectItem>
                  {categories?.map(category => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Vehicles Table */}
          <div className="bg-white rounded-lg shadow-sm">
            {isLoadingVehicles ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredVehicles && filteredVehicles.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead className="min-w-[250px]">Veicolo</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Anno</TableHead>
                      <TableHead>Condizione</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles.map(vehicle => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">{vehicle.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded bg-neutral-100 overflow-hidden">
                              {vehicle.mainImage ? (
                                <img 
                                  src={vehicle.mainImage} 
                                  alt={vehicle.title} 
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-neutral-400">
                                  <Car className="h-6 w-6" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{vehicle.title}</div>
                              <div className="text-sm text-neutral-500">{vehicle.model}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getBrandName(vehicle.brandId)}</TableCell>
                        <TableCell>{getCategoryName(vehicle.categoryId)}</TableCell>
                        <TableCell>{vehicle.year}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            vehicle.condition === "new" || vehicle.mileage < 1000 
                              ? "bg-red-100 text-red-800" 
                              : "bg-green-100 text-green-800"
                          }`}>
                            {vehicle.condition === "new" || vehicle.mileage < 1000 ? "Nuova" : "2Life"}
                          </span>
                          {vehicle.mileage > 0 && 
                            <span className="text-xs text-neutral-500 ml-2">
                              {vehicle.mileage.toLocaleString('it-IT')} km
                            </span>
                          }
                        </TableCell>
                        <TableCell>
                          {vehicle.badges && (vehicle.badges as string[]).map((badge, idx) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center px-2 py-1 text-xs rounded-full mr-1 font-medium ${
                                badge === 'promo' 
                                  ? 'bg-secondary/10 text-secondary' 
                                  : badge === 'new' 
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-neutral-100 text-neutral-800'
                              }`}
                            >
                              <Badge className="h-3 w-3 mr-1" />
                              {badge.toUpperCase()}
                            </span>
                          ))}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Azioni</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setLocation(`/vehicle/${vehicle.id}`)}>
                                <EyeIcon className="h-4 w-4 mr-2" /> Visualizza
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setLocation(`/admin/vehicles/${vehicle.id}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" /> Modifica
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteClick(vehicle.id)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Elimina
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <TagIcon className="h-12 w-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium text-neutral-800 mb-1">Nessun veicolo trovato</h3>
                <p className="text-neutral-500 mb-4">
                  {searchTerm || (filterBrand && filterBrand !== "all") || (filterCategory && filterCategory !== "all")
                    ? 'Nessun veicolo corrisponde ai criteri di ricerca' 
                    : 'Aggiungi il tuo primo veicolo per iniziare'}
                </p>
                <Button onClick={() => setLocation('/admin/vehicles/new')}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Nuovo Veicolo
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro di voler eliminare questo veicolo?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. Il veicolo verrà rimosso permanentemente dal catalogo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Eliminazione...
                </>
              ) : (
                'Elimina'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
