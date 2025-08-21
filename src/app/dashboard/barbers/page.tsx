import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockBarbers } from "@/lib/mock-data";
import { Star, PlusCircle } from "lucide-react";
import Image from "next/image";

export default function BarbersPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Manage Barbers</h1>
                    <p className="text-muted-foreground">Add, edit, and manage barber profiles and schedules.</p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Barber
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {mockBarbers.map((barber) => (
                    <Card key={barber.id} className="overflow-hidden">
                        <div className="relative h-48 w-full">
                            <Image
                                src={barber.imageUrl}
                                alt={barber.name}
                                fill
                                className="object-cover"
                                data-ai-hint="barber portrait"
                            />
                        </div>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>{barber.name}</CardTitle>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                        <span>{barber.rating}</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm font-semibold mb-2">Skills:</p>
                            <div className="flex flex-wrap gap-2">
                                {barber.skills.map((skill) => (
                                    <Badge key={skill} variant="secondary">{skill}</Badge>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="bg-secondary/50 p-4">
                             <Button variant="outline" className="w-full">Edit Schedule & Profile</Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
