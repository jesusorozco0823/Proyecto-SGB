
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Image from "next/image";
import type { InventoryItem } from '@/lib/types';
import { formatCop } from '@/lib/money';
import AddProductDialog from '@/components/add-product-dialog';
import EditProductDialog from '@/components/edit-product-dialog';
import DeleteProductDialog from '@/components/delete-product-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryItem | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<InventoryItem | null>(null);
  const { toast } = useToast();

  const loadInventory = async () => {
    setInventory(await apiClient.get<InventoryItem[]>('/api/v1/inventory'));
  };

  useEffect(() => {
    void loadInventory();
  }, []);

  const handleAddProduct = async (newProductData: Omit<InventoryItem, 'id'>) => {
    await apiClient.post('/api/v1/inventory', newProductData);
    await loadInventory();
    toast({
      title: "Producto Añadido",
      description: `${newProductData.name} ha sido añadido al inventario.`,
    });
    setIsAddDialogOpen(false);
  };

  const handleUpdateProduct = async (updatedProduct: InventoryItem) => {
    await apiClient.patch(`/api/v1/inventory/${updatedProduct.id}`, {
      name: updatedProduct.name,
      sku: updatedProduct.sku,
      price: updatedProduct.price,
      stock: updatedProduct.stock,
      imageUrl: updatedProduct.imageUrl,
    });
    await loadInventory();
    toast({
      title: "Producto Actualizado",
      description: `Los datos de ${updatedProduct.name} han sido actualizados.`,
    });
    setEditingProduct(null);
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      await apiClient.delete(`/api/v1/inventory/${deletingProduct.id}`);
      await loadInventory();
      toast({
        title: "Producto Eliminado",
        description: `${deletingProduct.name} ha sido eliminado del inventario.`,
        variant: "destructive",
      });
      setDeletingProduct(null);
    } catch (error) {
      toast({
        title: "No se pudo eliminar",
        description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
              <h1 className="text-3xl font-bold font-headline">Gestión de Inventario</h1>
              <p className="text-muted-foreground">Controla y gestiona el stock de tus productos.</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Producto
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[100px] sm:table-cell">
                    <span className="sr-only">Imagen</span>
                  </TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="hidden md:table-cell">Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Image
                        alt={item.name}
                        className="aspect-square rounded-md object-cover"
                        height="64"
                        src={item.imageUrl}
                        width="64"
                        data-ai-hint="product photo"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatCop(item.price)}</TableCell>
                    <TableCell>
                      <Badge variant={(item.stock ?? 0) < 20 ? "destructive" : "outline"}>
                          {item.stock ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Alternar menú</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setEditingProduct(item)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeletingProduct(item)}>Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AddProductDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddProduct={handleAddProduct}
      />

      {editingProduct && (
        <EditProductDialog
          isOpen={!!editingProduct}
          onOpenChange={() => setEditingProduct(null)}
          onUpdateProduct={handleUpdateProduct}
          product={editingProduct}
        />
      )}

      {deletingProduct && (
        <DeleteProductDialog
          isOpen={!!deletingProduct}
          onOpenChange={() => setDeletingProduct(null)}
          onConfirmDelete={handleDeleteProduct}
          itemName={deletingProduct.name}
        />
      )}
    </>
  );
}
