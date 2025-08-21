"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { recommendPersonalizedServices } from '@/ai/flows/recommend-services';
import { Wand2 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

export default function RecommendedServices() {
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            setLoading(true);
            try {
                // En una aplicación real, estos datos se obtendrían de Firestore
                const mockInput = {
                    userId: 'user-1',
                    userHistory: 'Corte de pelo clásico, Arreglo de barba, Corte degradado (fade)',
                    userPreferences: 'Le gustan los estilos modernos y los degradados marcados. Prefiere servicios rápidos.',
                };
                const result = await recommendPersonalizedServices(mockInput);
                setRecommendations(result.recommendations);
            } catch (error) {
                console.error("No se pudieron obtener las recomendaciones:", error);
                // Manejar el estado de error si es necesario
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wand2 className="text-primary" />
                    <span>Recomendado para Ti</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                ) : (
                    <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                        {recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
