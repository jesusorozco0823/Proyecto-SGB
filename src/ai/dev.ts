import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-feedback-sentiment.ts';
import '@/ai/flows/recommend-services.ts';
import '@/ai/flows/suggest-cancellation-reasons.ts';
import '@/ai/flows/suggest-feedback.ts';
