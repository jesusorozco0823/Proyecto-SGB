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
                console.error("Sentiment analysis failed:", error);
            } finally {
                setLoading(false);
            }
        };
        getSentiment();
    }, [feedbackText]);

    if (loading) {
        return <Badge variant="outline">Analyzing...</Badge>;
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
                     <Badge
                        className={cn({
                            'bg-green-100 text-green-800 border-green-200': sentiment === 'positive',
                            'bg-red-100 text-red-800 border-red-200': sentiment === 'negative',
                            'bg-gray-100 text-gray-800 border-gray-200': sentiment === 'neutral',
                        })}
                    >
                        {sentiment}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p>AI analysis confidence: {confidencePercent}%</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
