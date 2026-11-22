
"use client";

import { useEffect, useState } from 'react';
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle } from "lucide-react";
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
  const [query, setQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
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
        <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3 sm:flex-row sm:items-center">
          <Input className="h-10 rounded-full" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar producto o SKU" aria-label="Buscar producto" />
          <div className="flex flex-wrap gap-2">
            {([['all', 'Todos'], ['low', 'Stock bajo'], ['out', 'Agotados']] as const).map(([value, label]) => (
              <Button key={value} type="button" variant={stockFilter === value ? 'default' : 'outline'} className="h-10 rounded-full px-4" onClick={() => setStockFilter(value)}>{label}</Button>
            ))}
          </div>
        </div>
        <div className="mx-auto w-full max-w-3xl space-y-3">
          {inventory.filter((item) => {
            const text = `${item.name} ${item.sku}`.toLowerCase();
            const matchesQuery = !query.trim() || text.includes(query.trim().toLowerCase());
            const stock = item.stock ?? 0;
            const matchesStock = stockFilter === 'all' || (stockFilter === 'out' ? stock === 0 : stock > 0 && stock < 20);
            return matchesQuery && matchesStock;
          }).map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <Image alt={item.name} className="h-14 w-14 rounded-lg object-cover" height="56" src={item.imageUrl} width="56" />
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{item.sku} · {formatCop(item.price)}</p>
                </div>
                <Badge variant={(item.stock ?? 0) < 20 ? "destructive" : "outline"}>{item.stock ?? 0} en stock</Badge>
              </CardHeader>
              <CardFooter className="bg-secondary/50 p-4">
                <div className="flex w-full gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setEditingProduct(item)}>Editar</Button>
                  <Button variant="outline" className="flex-1 text-destructive" onClick={() => setDeletingProduct(item)}>Eliminar</Button>
                </div>
              </CardFooter>
            </Card>
          ))}
          {inventory.length > 0 && inventory.every((item) => {
            const text = `${item.name} ${item.sku}`.toLowerCase();
            const matchesQuery = !query.trim() || text.includes(query.trim().toLowerCase());
            const stock = item.stock ?? 0;
            const matchesStock = stockFilter === 'all' || (stockFilter === 'out' ? stock === 0 : stock > 0 && stock < 20);
            return !(matchesQuery && matchesStock);
          }) && (
            <p className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">Ningún producto coincide con ese filtro.</p>
          )}
        </div>
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
