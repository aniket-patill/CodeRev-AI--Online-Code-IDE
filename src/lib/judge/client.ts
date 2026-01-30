import { ExecutionResult, TestCase } from "./types";

export async function judgeRun(
    code: string,
    language: string,
    testCases: TestCase[],
    userId: string,
    sessionId?: string
): Promise<ExecutionResult> {
    const res = await fetch("/api/judge/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            code,
            language,
            testCases,
            userId,
            sessionId
        }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.stderr || "Execution failed");
    }

    return await res.json();
}

export async function judgeSubmit(
    code: string,
    language: string,
    problemId: string, // In real app, this is used to fetch hidden cases
    userId: string,
    sessionId?: string
): Promise<ExecutionResult> {
    const res = await fetch("/api/judge/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            code,
            language,
            problemId,
            userId,
            sessionId
        }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.stderr || "Submission failed");
    }

    return await res.json();
}
