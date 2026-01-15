import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { code, language } = await req.json();

        // MOCK EXECUTION FOR NOW
        // In a real app, you would send this to Piston API or similar

        let output = "";

        if (language === "javascript") {
            try {
                // Warning: This is extremely unsafe for production but fine for a demo/mock
                // In production, use an isolated sandbox environment
                // output = eval(code); 
                // Since this is server-side, we can't just eval. 

                output = "Code execution simulated.\n\nOutput:\nHello World!";
            } catch (e) {
                output = e.message;
            }
        } else {
            output = `Execution for ${language} is simulating...\nNo output returned.`;
        }

        return NextResponse.json({ output });

    } catch (error) {
        return NextResponse.json({ error: "Failed to execute code" }, { status: 500 });
    }
}
