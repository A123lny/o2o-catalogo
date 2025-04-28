import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { insertBrandSchema, insertCategorySchema, Brand, Category } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  Tag,
  Car,
  FileImage,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Brand form schema
const brandFormSchema = insertBrandSchema.extend({
  logoFile: z.instanceof(FileList).optional(),
});

// Category form schema
const categoryFormSchema = insertCategorySchema.extend({
  imageFile: z.instanceof(FileList).optional(),
});

type BrandFormValues = z.infer<typeof brandFormSchema>;
type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export default function BrandsCategoriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("brands");
  
  // State for dialog management
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [isEditBrandOpen, setIsEditBrandOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState<Brand | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  
  // State for delete confirmation
  const [showDeleteBrandDialog, setShowDeleteBrandDialog] = useState(false);
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<number | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);

  // Fetch brands and categories
  const { data: brands, isLoading: isLoadingBrands } = useQuery<Brand[]>({
    queryKey: ['/api/brands'],
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Brand form
  const brandForm = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: "",
      logo: "",
    },
  });

  // Category form
  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      image: "",
    },
  });

  // Brand mutations
  const addBrandMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/admin/brands", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/brands'] });
      toast({
        title: "Marca aggiunta",
        description: "La nuova marca è stata aggiunta con successo.",
      });
      setIsAddBrandOpen(false);
      brandForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'aggiunta della marca.",
        variant: "destructive",
      });
    },
  });

  const updateBrandMutation = useMutation({
    mutationFn: async (data: { id: number, formData: FormData }) => {
      return await apiRequest("PUT", `/api/admin/brands/${data.id}`, data.formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/brands'] });
      toast({
        title: "Marca aggiornata",
        description: "La marca è stata aggiornata con successo.",
      });
      setIsEditBrandOpen(false);
      setBrandToEdit(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'aggiornamento della marca.",
        variant: "destructive",
      });
    },
  });

  const deleteBrandMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/admin/brands/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/brands'] });
      toast({
        title: "Marca eliminata",
        description: "La marca è stata eliminata con successo.",
      });
      setShowDeleteBrandDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'eliminazione della marca.",
        variant: "destructive",
      });
    },
  });

  // Category mutations
  const addCategoryMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/admin/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: "Categoria aggiunta",
        description: "La nuova categoria è stata aggiunta con successo.",
      });
      setIsAddCategoryOpen(false);
      categoryForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'aggiunta della categoria.",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: { id: number, formData: FormData }) => {
      return await apiRequest("PUT", `/api/admin/categories/${data.id}`, data.formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: "Categoria aggiornata",
        description: "La categoria è stata aggiornata con successo.",
      });
      setIsEditCategoryOpen(false);
      setCategoryToEdit(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'aggiornamento della categoria.",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/admin/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: "Categoria eliminata",
        description: "La categoria è stata eliminata con successo.",
      });
      setShowDeleteCategoryDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'eliminazione della categoria.",
        variant: "destructive",
      });
    },
  });

  // Form submission handlers
  const onAddBrandSubmit = (values: BrandFormValues) => {
    const formData = new FormData();
    formData.append('data', JSON.stringify({ name: values.name }));
    
    if (values.logoFile && values.logoFile.length > 0) {
      formData.append('logo', values.logoFile[0]);
    }
    
    addBrandMutation.mutate(formData);
  };

  const onEditBrandSubmit = (values: BrandFormValues) => {
    if (!brandToEdit) return;
    
    const formData = new FormData();
    formData.append('data', JSON.stringify({ name: values.name, logo: brandToEdit.logo }));
    
    if (values.logoFile && values.logoFile.length > 0) {
      formData.append('logo', values.logoFile[0]);
    }
    
    updateBrandMutation.mutate({ id: brandToEdit.id, formData });
  };

  const onAddCategorySubmit = (values: CategoryFormValues) => {
    const formData = new FormData();
    formData.append('data', JSON.stringify({ name: values.name }));
    
    if (values.imageFile && values.imageFile.length > 0) {
      formData.append('image', values.imageFile[0]);
    }
    
    addCategoryMutation.mutate(formData);
  };

  const onEditCategorySubmit = (values: CategoryFormValues) => {
    if (!categoryToEdit) return;
    
    const formData = new FormData();
    formData.append('data', JSON.stringify({ name: values.name, image: categoryToEdit.image }));
    
    if (values.imageFile && values.imageFile.length > 0) {
      formData.append('image', values.imageFile[0]);
    }
    
    updateCategoryMutation.mutate({ id: categoryToEdit.id, formData });
  };

  // Handlers for edit/delete buttons
  const handleEditBrand = (brand: Brand) => {
    setBrandToEdit(brand);
    brandForm.reset({
      name: brand.name,
      logo: brand.logo || "",
    });
    setIsEditBrandOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setCategoryToEdit(category);
    categoryForm.reset({
      name: category.name,
      image: category.image || "",
    });
    setIsEditCategoryOpen(true);
  };

  const handleDeleteBrand = (id: number) => {
    setBrandToDelete(id);
    setShowDeleteBrandDialog(true);
  };

  const handleDeleteCategory = (id: number) => {
    setCategoryToDelete(id);
    setShowDeleteCategoryDialog(true);
  };

  const confirmDeleteBrand = () => {
    if (brandToDelete) {
      deleteBrandMutation.mutate(brandToDelete);
    }
  };

  const confirmDeleteCategory = () => {
    if (categoryToDelete) {
      deleteCategoryMutation.mutate(categoryToDelete);
    }
  };

  return (
    <div className="flex h-screen bg-neutral-100">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader user={user} />
        
        <main className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-neutral-800">Marche & Categorie</h1>
            <p className="text-neutral-500">Gestisci le marche e le categorie di veicoli</p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="brands">Marche</TabsTrigger>
                <TabsTrigger value="categories">Categorie</TabsTrigger>
              </TabsList>
              
              {activeTab === "brands" ? (
                <Button onClick={() => {
                  brandForm.reset();
                  setIsAddBrandOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" /> Nuova Marca
                </Button>
              ) : (
                <Button onClick={() => {
                  categoryForm.reset();
                  setIsAddCategoryOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" /> Nuova Categoria
                </Button>
              )}
            </div>
            
            {/* Brands Tab */}
            <TabsContent value="brands">
              <Card>
                <CardHeader>
                  <CardTitle>Marche</CardTitle>
                  <CardDescription>
                    Gestisci le marche automobilistiche disponibili nel catalogo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingBrands ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : brands && brands.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">ID</TableHead>
                            <TableHead>Logo</TableHead>
                            <TableHead className="w-full">Nome</TableHead>
                            <TableHead className="text-right">Azioni</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {brands.map((brand) => (
                            <TableRow key={brand.id}>
                              <TableCell className="font-medium">{brand.id}</TableCell>
                              <TableCell>
                                <div className="h-10 w-10 rounded bg-neutral-100 flex items-center justify-center overflow-hidden">
                                  {brand.logo ? (
                                    <img 
                                      src={brand.logo} 
                                      alt={brand.name} 
                                      className="h-full w-full object-contain"
                                    />
                                  ) : (
                                    <Car className="h-6 w-6 text-neutral-400" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{brand.name}</TableCell>
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
                                    <DropdownMenuItem onClick={() => handleEditBrand(brand)}>
                                      <Edit className="h-4 w-4 mr-2" /> Modifica
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteBrand(brand.id)}
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
                      <Tag className="h-12 w-12 text-neutral-300 mb-4" />
                      <h3 className="text-lg font-medium text-neutral-800 mb-1">Nessuna marca trovata</h3>
                      <p className="text-neutral-500 mb-4">
                        Aggiungi la prima marca per iniziare
                      </p>
                      <Button onClick={() => {
                        brandForm.reset();
                        setIsAddBrandOpen(true);
                      }}>
                        <Plus className="h-4 w-4 mr-2" /> Nuova Marca
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Categories Tab */}
            <TabsContent value="categories">
              <Card>
                <CardHeader>
                  <CardTitle>Categorie</CardTitle>
                  <CardDescription>
                    Gestisci le categorie dei veicoli nel catalogo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingCategories ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : categories && categories.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">ID</TableHead>
                            <TableHead>Immagine</TableHead>
                            <TableHead className="w-full">Nome</TableHead>
                            <TableHead className="text-right">Azioni</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categories.map((category) => (
                            <TableRow key={category.id}>
                              <TableCell className="font-medium">{category.id}</TableCell>
                              <TableCell>
                                <div className="h-10 w-10 rounded bg-neutral-100 flex items-center justify-center overflow-hidden">
                                  {category.image ? (
                                    <img 
                                      src={category.image} 
                                      alt={category.name} 
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <Car className="h-6 w-6 text-neutral-400" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{category.name}</TableCell>
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
                                    <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                                      <Edit className="h-4 w-4 mr-2" /> Modifica
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteCategory(category.id)}
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
                      <Tag className="h-12 w-12 text-neutral-300 mb-4" />
                      <h3 className="text-lg font-medium text-neutral-800 mb-1">Nessuna categoria trovata</h3>
                      <p className="text-neutral-500 mb-4">
                        Aggiungi la prima categoria per iniziare
                      </p>
                      <Button onClick={() => {
                        categoryForm.reset();
                        setIsAddCategoryOpen(true);
                      }}>
                        <Plus className="h-4 w-4 mr-2" /> Nuova Categoria
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      
      {/* Add Brand Dialog */}
      <Dialog open={isAddBrandOpen} onOpenChange={setIsAddBrandOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Marca</DialogTitle>
            <DialogDescription>
              Inserisci i dettagli della nuova marca automobilistica.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...brandForm}>
            <form onSubmit={brandForm.handleSubmit(onAddBrandSubmit)} className="space-y-4">
              <FormField
                control={brandForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome*</FormLabel>
                    <FormControl>
                      <Input placeholder="Es. Audi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={brandForm.control}
                name="logoFile"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Logo</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        {...fieldProps}
                        onChange={(e) => {
                          onChange(e.target.files);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Carica il logo della marca (opzionale).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddBrandOpen(false)}
                >
                  Annulla
                </Button>
                <Button 
                  type="submit"
                  disabled={addBrandMutation.isPending}
                >
                  {addBrandMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvataggio...
                    </>
                  ) : (
                    'Salva'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Brand Dialog */}
      <Dialog open={isEditBrandOpen} onOpenChange={setIsEditBrandOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Marca</DialogTitle>
            <DialogDescription>
              Modifica i dettagli della marca selezionata.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...brandForm}>
            <form onSubmit={brandForm.handleSubmit(onEditBrandSubmit)} className="space-y-4">
              <FormField
                control={brandForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome*</FormLabel>
                    <FormControl>
                      <Input placeholder="Es. Audi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {brandToEdit?.logo && (
                <div className="flex items-center space-x-2 py-2">
                  <div className="h-10 w-10 rounded bg-neutral-100 flex items-center justify-center overflow-hidden">
                    <img 
                      src={brandToEdit.logo} 
                      alt="Logo corrente" 
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <p className="text-sm text-neutral-500">Logo attuale</p>
                </div>
              )}
              
              <FormField
                control={brandForm.control}
                name="logoFile"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Nuovo Logo</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        {...fieldProps}
                        onChange={(e) => {
                          onChange(e.target.files);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Carica un nuovo logo (lascia vuoto per mantenere quello attuale).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditBrandOpen(false)}
                >
                  Annulla
                </Button>
                <Button 
                  type="submit"
                  disabled={updateBrandMutation.isPending}
                >
                  {updateBrandMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Aggiornamento...
                    </>
                  ) : (
                    'Aggiorna'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Categoria</DialogTitle>
            <DialogDescription>
              Inserisci i dettagli della nuova categoria di veicoli.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onAddCategorySubmit)} className="space-y-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome*</FormLabel>
                    <FormControl>
                      <Input placeholder="Es. SUV" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={categoryForm.control}
                name="imageFile"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Immagine</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        {...fieldProps}
                        onChange={(e) => {
                          onChange(e.target.files);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Carica un'immagine rappresentativa per questa categoria (opzionale).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddCategoryOpen(false)}
                >
                  Annulla
                </Button>
                <Button 
                  type="submit"
                  disabled={addCategoryMutation.isPending}
                >
                  {addCategoryMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvataggio...
                    </>
                  ) : (
                    'Salva'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Categoria</DialogTitle>
            <DialogDescription>
              Modifica i dettagli della categoria selezionata.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onEditCategorySubmit)} className="space-y-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome*</FormLabel>
                    <FormControl>
                      <Input placeholder="Es. SUV" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {categoryToEdit?.image && (
                <div className="flex items-center space-x-2 py-2">
                  <div className="h-10 w-10 rounded bg-neutral-100 flex items-center justify-center overflow-hidden">
                    <img 
                      src={categoryToEdit.image} 
                      alt="Immagine corrente" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="text-sm text-neutral-500">Immagine attuale</p>
                </div>
              )}
              
              <FormField
                control={categoryForm.control}
                name="imageFile"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Nuova Immagine</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        {...fieldProps}
                        onChange={(e) => {
                          onChange(e.target.files);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Carica una nuova immagine (lascia vuoto per mantenere quella attuale).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditCategoryOpen(false)}
                >
                  Annulla
                </Button>
                <Button 
                  type="submit"
                  disabled={updateCategoryMutation.isPending}
                >
                  {updateCategoryMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Aggiornamento...
                    </>
                  ) : (
                    'Aggiorna'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Brand Confirmation */}
      <AlertDialog open={showDeleteBrandDialog} onOpenChange={setShowDeleteBrandDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro di voler eliminare questa marca?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. L'eliminazione di una marca potrebbe influire sui veicoli associati ad essa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteBrand}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteBrandMutation.isPending}
            >
              {deleteBrandMutation.isPending ? (
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
      
      {/* Delete Category Confirmation */}
      <AlertDialog open={showDeleteCategoryDialog} onOpenChange={setShowDeleteCategoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro di voler eliminare questa categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. L'eliminazione di una categoria potrebbe influire sui veicoli associati ad essa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteCategory}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? (
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
