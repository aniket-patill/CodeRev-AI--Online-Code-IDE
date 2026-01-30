import { NextResponse } from "next/server";
import { JudgeService } from "@/lib/judge/JudgeService";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { code, language, testCases, userId, sessionId } = body;

        if (!code || !language || !Array.isArray(testCases)) {
            return NextResponse.json({ error: "Missing required fields: code, language, testCases" }, { status: 400 });
        }

        const uid = userId || "guest";
        const sid = sessionId || "default-session";

        const result = await JudgeService.execute(uid, sid, language, code, testCases);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[Judge Run Error]", error);
        return NextResponse.json({
            verdict: "Internal Error",
            stderr: error.message,
            stdout: "",
            timeMs: 0
        }, { status: 500 });
    }
}
