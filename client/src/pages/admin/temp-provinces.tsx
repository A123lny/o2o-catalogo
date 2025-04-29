// Componente temporaneo per la scheda delle province che sarà usato come sostituzione
            <TabsContent value="provinces">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Form Aggiungi Provincia */}
                <Card>
                  <CardHeader>
                    <CardTitle>Aggiungi Provincia</CardTitle>
                    <CardDescription>
                      Aggiungi una nuova provincia al sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={onProvinceSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <FormLabel>Nome Provincia</FormLabel>
                        <Input 
                          placeholder="Es. Milano" 
                          value={newProvince.name} 
                          onChange={(e) => setNewProvince({...newProvince, name: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <FormLabel>Codice Provincia</FormLabel>
                        <Input 
                          placeholder="Es. MI" 
                          maxLength={2}
                          value={newProvince.code} 
                          onChange={(e) => setNewProvince({...newProvince, code: e.target.value.toUpperCase()})}
                        />
                        <FormDescription>
                          Il codice deve essere di 2 caratteri (es. MI per Milano)
                        </FormDescription>
                      </div>
                      
                      <div className="flex items-center space-x-2 py-2">
                        <Checkbox 
                          id="province-active" 
                          checked={newProvince.isActive}
                          onCheckedChange={(checked) => setNewProvince({...newProvince, isActive: checked === true})}
                        />
                        <FormLabel htmlFor="province-active" className="cursor-pointer">
                          Provincia attiva
                        </FormLabel>
                      </div>
                      
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvataggio...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" /> Aggiungi
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                
                {/* Gestione Province */}
                <Card>
                  <CardHeader>
                    <CardTitle>Gestione Province</CardTitle>
                    <CardDescription>
                      Gestisci le province attualmente nel sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-2 mb-4">
                      <Button 
                        variant="default" 
                        onClick={handleActivateProvinces} 
                        size="sm" 
                        disabled={isSubmitting || selectedProvinces.length === 0}
                      >
                        Attiva selezionate
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleDeactivateProvinces} 
                        size="sm" 
                        disabled={isSubmitting || selectedProvinces.length === 0}
                      >
                        Disattiva selezionate
                      </Button>
                    </div>
                    
                    {isLoadingProvinces ? (
                      <div className="w-full py-10 flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : !provinces || provinces.length === 0 ? (
                      <div className="text-center py-8 border rounded-md">
                        Nessuna provincia trovata
                      </div>
                    ) : (
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">
                                <Checkbox 
                                  checked={provinces.length > 0 && selectedProvinces.length === provinces.length} 
                                  onCheckedChange={(checked) => handleSelectAllProvinces(checked === true)}
                                />
                              </TableHead>
                              <TableHead>Nome</TableHead>
                              <TableHead>Codice</TableHead>
                              <TableHead>Stato</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {provinces.map((province) => (
                              <TableRow key={province.id}>
                                <TableCell>
                                  <Checkbox 
                                    checked={selectedProvinces.includes(province.id || 0)} 
                                    onCheckedChange={(checked) => handleSelectProvince(province.id || 0, checked === true)}
                                  />
                                </TableCell>
                                <TableCell>{province.name}</TableCell>
                                <TableCell>{province.code}</TableCell>
                                <TableCell>
                                  {province.isActive ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Attiva
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      Disattiva
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>