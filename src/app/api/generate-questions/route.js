import { NextResponse } from "next/server";
import { generateQuestions } from "@/utils/gemini";

export const maxDuration = 60;

export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}));
        const topic = body.topic?.trim();
        const count = Math.min(10, Math.max(1, Number(body.count) || 3));

        if (!topic) {
            return NextResponse.json({ error: "Topic is required" }, { status: 400 });
        }

        const questions = await generateQuestions(topic, count);

        return NextResponse.json(
            { questions },
            {
                headers: { "Cache-Control": "no-store, max-age=0" },
            }
        );
    } catch (error) {
        const msg = error?.message || "Unknown error";
        const isRateLimit = /429|quota|rate/i.test(msg);
        const isApiKey = /API key|configured/i.test(msg);

        console.error("[generate-questions]", msg);

        if (isRateLimit) {
            return NextResponse.json(
                { error: "AI service is busy. Please try again in a moment." },
                { status: 429 }
            );
        }
        if (isApiKey) {
            return NextResponse.json(
                { error: "AI service not configured. Set GEMINI_API_KEY or GEMINI_API_KEY_QUESTIONS." },
                { status: 503 }
            );
        }
        return NextResponse.json(
            { error: msg || "Failed to generate questions." },
            { status: 500 }
        );
    }
}
