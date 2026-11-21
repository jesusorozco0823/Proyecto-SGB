"use client";

import { useEffect, useState } from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import { analyzeFeedbackSentiment, AnalyzeFeedbackSentimentOutput } from '@/ai/flows/analyze-feedback-sentiment';
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
        return <StatusBadge tone="neutral" label="Analizando..." />;
    }

    if (!analysis) {
        return null;
    }

    const { sentiment, confidence } = analysis;
    const confidencePercent = (confidence * 100).toFixed(0);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <span><StatusBadge tone={sentiment} /></span>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Confianza del análisis AI: {confidencePercent}%</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
