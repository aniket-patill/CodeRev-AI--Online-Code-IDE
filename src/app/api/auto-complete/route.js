import { NextResponse } from "next/server";
import { autoComplete } from "@/utils/gemini";

export async function POST(request) {
    try {
        const { code, language } = await request.json();
        if (!code) {
            return NextResponse.json({ error: "Code is required" }, { status: 400 });
        }

        const documentation = await autoComplete(code, language);
        console.log(documentation);
        
        return NextResponse.json(
            { documentation }, 
            { 
                status: 200,
                headers: {
                    'Cache-Control': 'no-store, max-age=0',
                }
            }
        );
    } catch (error) {
        console.error("API Error:", error.message);
        return NextResponse.json({ error: "Failed to generate documentation" }, { status: 500 });
    }
}
