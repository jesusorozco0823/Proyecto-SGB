import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockInventory } from "@/lib/mock-data";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";

export default function ProductsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Nuestros Productos</h1>
                <p className="text-muted-foreground">Encuentra los mejores productos para tu cuidado personal.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {mockInventory.map((item) => (
                    <Card key={item.id} className="overflow-hidden flex flex-col">
                        <div className="relative h-56 w-full">
                            <Image
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                className="object-cover"
                                data-ai-hint="product photo"
                            />
                        </div>
                        <CardHeader>
                            <CardTitle>{item.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                             <p className="text-2xl font-semibold">${item.price.toFixed(2)}</p>
                        </CardContent>
                        <CardFooter>
                             <Button className="w-full">
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Añadir al Carrito
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
