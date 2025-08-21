"use client";

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { analyzeFeedbackSentiment, AnalyzeFeedbackSentimentOutput } from '@/ai/flows/analyze-feedback-sentiment';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface SentimentBadgeProps {
    feedbackText: string;
}

export default function SentimentBadge({ feedbackText }: SentimentBadgeProps) {
    const [analysis, setAnalysis] = useState<AnalyzeFeedbackSentimentOutput | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getSentiment = async () => {
            setLoading(true);
            try {
                const result = await analyzeFeedbackSentiment({ feedbackText });
                setAnalysis(result);
            } catch (error) {
                console.error("El análisis de sentimiento falló:", error);
            } finally {
                setLoading(false);
            }
        };
        getSentiment();
    }, [feedbackText]);

    if (loading) {
        return <Badge variant="outline">Analizando...</Badge>;
    }

    if (!analysis) {
        return null;
    }

    const { sentiment, confidence } = analysis;
    const confidencePercent = (confidence * 100).toFixed(0);
    
    const sentimentText = {
        positive: 'Positivo',
        negative: 'Negativo',
        neutral: 'Neutral'
    }[sentiment];

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                     <Badge
                        className={cn({
                            'bg-green-100 text-green-800 border-green-200': sentiment === 'positive',
                            'bg-red-100 text-red-800 border-red-200': sentiment === 'negative',
                            'bg-gray-100 text-gray-800 border-gray-200': sentiment === 'neutral',
                        })}
                    >
                        {sentimentText}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Confianza del análisis AI: {confidencePercent}%</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
