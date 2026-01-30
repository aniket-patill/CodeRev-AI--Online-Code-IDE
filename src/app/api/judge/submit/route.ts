import { NextResponse } from "next/server";
import { JudgeService } from "@/lib/judge/JudgeService";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { code, language, problemId, userId, sessionId } = body;

        if (!code || !language || !problemId) {
            return NextResponse.json({ error: "Missing fields: code, language, problemId" }, { status: 400 });
        }

        const uid = userId || "guest";
        const sid = sessionId || "default-session";

        // In a real app, fetch hidden test cases from DB using problemId
        // Mocking hidden test cases for demonstration
        const hiddenTestCases = [
            { id: "hidden-1", input: [1, 2], expectedOutput: 3 }, // Example for add(a,b)
            { id: "hidden-2", input: [10, 20], expectedOutput: 30 },
            { id: "hidden-edge", input: [0, 0], expectedOutput: 0 }
        ];

        // For demonstration, if the user sent testCases, we can ignore them or append them.
        // Usually submit runs ONLY against official hidden cases.

        // We assume the user code matches the problem signature.
        // If the problem is "Two Sum", input might be [[2,7,11,15], 9], expected [0,1]

        // Since we don't know the problem, we will just echo back a Mock execution
        // UNLESS the user provides the cases in the body for this "Refactor" context where we might not have a DB connected yet.
        // But strictly following "Submit Mode" requirements:

        const result = await JudgeService.execute(uid, sid, language, code, hiddenTestCases);

        // In submit mode, we might want to hide the "expectedOutput" and "actualOutput" for hidden cases if they fail
        // to prevent reverse engineering.
        if (result.verdict !== "Accepted") {
            result.testCaseResults = result.testCaseResults?.map(r => ({
                ...r,
                expectedOutput: "Hidden",
                actualOutput: "Hidden",
                stdout: "Hidden",
                stderr: "Hidden" // Maybe show stderr if RE
            }));
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[Judge Submit Error]", error);
        return NextResponse.json({
            verdict: "Internal Error",
            stderr: error.message
        }, { status: 500 });
    }
}
