import { NextResponse } from "next/server";
import { getChatResponse } from "@/utils/gemini";

// Extend timeout for AI responses (Vercel default is 10s, Gemini needs more)
export const maxDuration = 30;

export async function POST(request) {
    try {
        const { message, codeContext } = await request.json();
        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const aiResponse = await getChatResponse(message, codeContext);

        if (!aiResponse) {
            console.error("API Error: Empty response from Gemini");
            return NextResponse.json(
                { error: "AI returned empty response. Please try again." },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { aiResponse },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'no-store, max-age=0',
                }
            }
        );
    } catch (error) {
        const errorMessage = error?.message || 'Unknown error';
        const isRateLimit = errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate');
        const isApiKeyError = errorMessage.includes('API key') || errorMessage.includes('configured');
        
        console.error("API Error:", {
            message: errorMessage,
            type: isRateLimit ? 'RATE_LIMIT' : isApiKeyError ? 'API_KEY' : 'GENERAL',
            timestamp: new Date().toISOString()
        });

        if (isRateLimit) {
            return NextResponse.json(
                { error: "AI service is busy. Please wait a moment and try again." },
                { status: 429 }
            );
        }

        if (isApiKeyError) {
            return NextResponse.json(
                { error: "AI service configuration error. Please contact support." },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: "Failed to generate response. Please try again." },
            { status: 500 }
        );
    }
}