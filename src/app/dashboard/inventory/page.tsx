import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockInventory } from "@/lib/mock-data";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Image from "next/image";

export default function InventoryPage() {
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold font-headline">Gestión de Inventario</h1>
            <p className="text-muted-foreground">Controla y gestiona el stock de tus productos.</p>
        </div>
        <Button>
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
              {mockInventory.map((item) => (
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
                  <TableCell className="hidden md:table-cell">${item.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={item.stock < 20 ? "destructive" : "outline"}>
                        {item.stock}
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
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Eliminar</DropdownMenuItem>
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
  );
}
