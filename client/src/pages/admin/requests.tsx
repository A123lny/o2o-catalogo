import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";
import { useAuth } from "@/hooks/use-auth";
import { Request, Vehicle } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  Calendar,
  Mail,
  Phone,
  CarFront,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
} from "lucide-react";

export default function RequestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Fetch requests
  const { data: requests, isLoading: isLoadingRequests } = useQuery<Request[]>({
    queryKey: ['/api/admin/requests'],
  });

  // Fetch vehicles for mapping vehicle IDs to names
  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ['/api/admin/vehicles'],
  });

  // Update request status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest("PUT", `/api/admin/requests/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/requests'] });
      toast({
        title: "Stato aggiornato",
        description: "Lo stato della richiesta è stato aggiornato con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'aggiornamento dello stato.",
        variant: "destructive",
      });
    },
  });

  // Delete request mutation
  const deleteRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/admin/requests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/requests'] });
      toast({
        title: "Richiesta eliminata",
        description: "La richiesta è stata eliminata con successo.",
      });
      setShowDeleteDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'eliminazione della richiesta.",
        variant: "destructive",
      });
    },
  });

  // Filter and search requests
  const filteredRequests = requests?.filter(request => {
    const matchesSearch = searchTerm === "" ||
      request.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.phone.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === "" || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get vehicle details
  const getVehicleDetails = (vehicleId: number) => {
    const vehicle = vehicles?.find(v => v.id === vehicleId);
    return vehicle ? vehicle.title : `Veicolo #${vehicleId}`;
  };

  // Format date
  const formatDate = (dateInput: Date | string) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return new Intl.DateTimeFormat('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  // Handle status change
  const handleStatusChange = (requestId: number, newStatus: string) => {
    updateStatusMutation.mutate({ id: requestId, status: newStatus });
  };

  // Handle view details
  const handleViewDetails = (request: Request) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  };

  // Handle delete
  const handleDelete = (id: number) => {
    setRequestToDelete(id);
    setShowDeleteDialog(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (requestToDelete) {
      deleteRequestMutation.mutate(requestToDelete);
    }
  };

  return (
    <div className="flex h-screen bg-neutral-100">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader user={user} />
        
        <main className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-neutral-800">Richieste Informazioni</h1>
            <p className="text-neutral-500">Gestisci le richieste informazioni ricevute dai clienti</p>
          </div>
          
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute top-3 left-3 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Cerca richieste..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter || "all"} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtra per stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  <SelectItem value="new">Nuove</SelectItem>
                  <SelectItem value="in_progress">In gestione</SelectItem>
                  <SelectItem value="completed">Completate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle>Richieste</CardTitle>
              <CardDescription>
                Elenco delle richieste di informazioni ricevute dai clienti
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRequests ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredRequests && filteredRequests.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Veicolo</TableHead>
                        <TableHead>Interesse</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{request.fullName}</div>
                              <div className="text-sm text-neutral-500">{request.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getVehicleDetails(request.vehicleId)}</TableCell>
                          <TableCell>{request.interestType}</TableCell>
                          <TableCell className="text-neutral-500 text-sm">
                            {formatDate(request.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={request.status || "new"}
                              onValueChange={(value) => handleStatusChange(request.id, value)}
                            >
                              <SelectTrigger className="h-8 w-[120px]">
                                <SelectValue>
                                  {request.status === "new" && (
                                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                      Nuova
                                    </Badge>
                                  )}
                                  {request.status === "in_progress" && (
                                    <Badge variant="outline" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                                      In gestione
                                    </Badge>
                                  )}
                                  {request.status === "completed" && (
                                    <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                                      Completata
                                    </Badge>
                                  )}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">
                                  <span className="flex items-center">
                                    <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                                    Nuova
                                  </span>
                                </SelectItem>
                                <SelectItem value="in_progress">
                                  <span className="flex items-center">
                                    <MessageCircle className="mr-2 h-4 w-4 text-blue-500" />
                                    In gestione
                                  </span>
                                </SelectItem>
                                <SelectItem value="completed">
                                  <span className="flex items-center">
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                    Completata
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
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
                                <DropdownMenuItem onClick={() => handleViewDetails(request)}>
                                  <Eye className="h-4 w-4 mr-2" /> Visualizza Dettagli
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(request.id)}
                                  className="text-destructive focus:text-destructive"
                                >
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
                <div className="flex flex-col items-center justify-center py-8">
                  <MessageCircle className="h-12 w-12 text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium text-neutral-800 mb-1">Nessuna richiesta trovata</h3>
                  <p className="text-neutral-500">
                    {searchTerm || statusFilter 
                      ? 'Nessuna richiesta corrisponde ai criteri di ricerca' 
                      : 'Non ci sono richieste di informazioni al momento'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
      
      {/* Request Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dettagli Richiesta</DialogTitle>
            <DialogDescription>
              Informazioni complete sulla richiesta
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">{selectedRequest.fullName}</h3>
                  <p className="text-neutral-500 text-sm">
                    {formatDate(selectedRequest.createdAt)}
                  </p>
                </div>
                <Badge variant="outline" className={
                  selectedRequest.status === "new" 
                    ? "bg-yellow-100 text-yellow-800" 
                    : selectedRequest.status === "in_progress" 
                    ? "bg-blue-100 text-blue-700" 
                    : "bg-green-100 text-green-800"
                }>
                  {selectedRequest.status === "new" 
                    ? "Nuova" 
                    : selectedRequest.status === "in_progress" 
                    ? "In gestione" 
                    : "Completata"}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-neutral-500" />
                  <a href={`mailto:${selectedRequest.email}`} className="text-primary hover:underline">
                    {selectedRequest.email}
                  </a>
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-neutral-500" />
                  <a href={`tel:${selectedRequest.phone}`} className="text-primary hover:underline">
                    {selectedRequest.phone}
                  </a>
                </div>
                <div className="flex items-center text-sm">
                  <CarFront className="h-4 w-4 mr-2 text-neutral-500" />
                  <span>{getVehicleDetails(selectedRequest.vehicleId)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-neutral-500" />
                  <span>Interesse: {selectedRequest.interestType}</span>
                </div>
              </div>
              
              {selectedRequest.message && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-1">Messaggio</h4>
                  <div className="bg-neutral-50 p-3 rounded-md text-sm">
                    {selectedRequest.message}
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-neutral-200">
                <h4 className="text-sm font-medium mb-2">Cambia stato</h4>
                <Select
                  value={selectedRequest.status || "new"}
                  onValueChange={(value) => {
                    handleStatusChange(selectedRequest.id, value);
                    setSelectedRequest({
                      ...selectedRequest,
                      status: value
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {selectedRequest.status === "new" && "Nuova"}
                      {selectedRequest.status === "in_progress" && "In gestione"}
                      {selectedRequest.status === "completed" && "Completata"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">
                      <span className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                        Nuova
                      </span>
                    </SelectItem>
                    <SelectItem value="in_progress">
                      <span className="flex items-center">
                        <MessageCircle className="mr-2 h-4 w-4 text-blue-500" />
                        In gestione
                      </span>
                    </SelectItem>
                    <SelectItem value="completed">
                      <span className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        Completata
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline" 
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                if (selectedRequest) {
                  handleDelete(selectedRequest.id);
                  setShowDetailsDialog(false);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Elimina
            </Button>
            <Button onClick={() => setShowDetailsDialog(false)}>
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro di voler eliminare questa richiesta?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. La richiesta verrà rimossa permanentemente dal sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteRequestMutation.isPending}
            >
              {deleteRequestMutation.isPending ? (
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
