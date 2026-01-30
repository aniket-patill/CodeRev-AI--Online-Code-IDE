export type Verdict =
    | "Accepted"
    | "Wrong Answer"
    | "Time Limit Exceeded"
    | "Runtime Error"
    | "Compilation Error"
    | "Memory Limit Exceeded"
    | "Internal Error";

export interface TestCase {
    id: string;
    input: any[]; // Arguments for the function
    expectedOutput: any;
}

export interface ExecutionResult {
    verdict: Verdict;
    stdout: string;
    stderr: string;
    timeMs: number;
    memoryMb: number;
    testCaseResults?: TestCaseResult[];
}

export interface TestCaseResult {
    testCaseId: string;
    verdict: Verdict;
    actualOutput: string;
    expectedOutput: string;
    timeMs: number;
    stdout: string;
    stderr: string;
}

export interface SessionConfig {
    language: string;
    sessionId: string;
    userId: string;
}
