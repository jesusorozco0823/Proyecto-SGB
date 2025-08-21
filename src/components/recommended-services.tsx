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
                // In a real app, this data would be fetched from Firestore
                const mockInput = {
                    userId: 'user-1',
                    userHistory: 'Classic Haircut, Beard Trim, Skin Fade',
                    userPreferences: 'Likes modern styles and sharp fades. Prefers quick services.',
                };
                const result = await recommendPersonalizedServices(mockInput);
                setRecommendations(result.recommendations);
            } catch (error) {
                console.error("Failed to fetch recommendations:", error);
                // Handle error state if needed
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
                    <span>Recommended For You</span>
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
