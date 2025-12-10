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
        console.error("API Error:", error.message);
        return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
    }
}