"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import SentimentBadge from "@/components/sentiment-badge";
import type { Feedback } from '@/lib/types';
import { apiClient } from '@/lib/api-client';

export default function FeedbackPage() {
    const [feedbackItems, setFeedbackItems] = useState<Feedback[]>([]);
    const [query, setQuery] = useState('');
    const [stars, setStars] = useState<number | 'all'>('all');

    useEffect(() => {
        apiClient.get<Feedback[]>('/api/v1/feedback').then(setFeedbackItems).catch(() => setFeedbackItems([]));
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Opiniones de Clientes</h1>
                <p className="text-muted-foreground">Revisa y analiza las opiniones para mejorar tu servicio.</p>
            </div>
            {feedbackItems.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">Todavía no hay opiniones de clientes para mostrar.</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3">
                    <Input className="h-10 rounded-full" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente" aria-label="Buscar opinión" />
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant={stars === 'all' ? 'default' : 'outline'} className="h-10 rounded-full px-4" onClick={() => setStars('all')}>Todas</Button>
                        {[5, 4, 3, 2, 1].map((value) => (
                            <Button key={value} type="button" variant={stars === value ? 'default' : 'outline'} className="h-10 rounded-full px-4" onClick={() => setStars(value)}>{value} estrellas</Button>
                        ))}
                    </div>
                </div>
                <div className="mx-auto w-full max-w-3xl space-y-3">
                    {feedbackItems.filter((feedback) => {
                        const name = feedback.user?.displayName ?? '';
                        const matchesQuery = !query.trim() || name.toLowerCase().includes(query.trim().toLowerCase());
                        return matchesQuery && (stars === 'all' || feedback.rating === stars);
                    }).map(feedback => {
                        const user = feedback.user;
                        const userInitials = user?.displayName?.split(' ').map(n => n[0]).join('') || 'U';

                        return (
                            <Card key={feedback.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={user?.avatarUrl} />
                                                <AvatarFallback>{userInitials}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-base">{user?.displayName}</CardTitle>
                                                <div className="flex items-center gap-0.5">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-4 h-4 ${i < feedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <SentimentBadge feedbackText={feedback.comment} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground italic">"{feedback.comment}"</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
                </>
            )}
        </div>
    );
}
