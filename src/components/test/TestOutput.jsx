"use client";

import { useState } from "react";
import { Play, Loader2, Trash2, Terminal, Check, X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { judgeRun } from "@/lib/judge/client";
import { useTest } from "@/context/TestContext";

const TestOutput = ({ code, language = "javascript", question }) => {
    const { currentParticipant, testId } = useTest();
    const [output, setOutput] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState(null);
    const [runResult, setRunResult] = useState(null);
    const [expandedCase, setExpandedCase] = useState(null);

    // Filter for visible sample cases
    const visibleTestCases = (question?.testCases || []).filter((tc) => !tc.hidden);
    const hasSampleCases = visibleTestCases.length > 0;

    const runCode = async () => {
        if (isRunning || !code?.trim()) return;

        setIsRunning(true);
        setOutput("");
        setError(null);
        setRunResult(null);
        setExpandedCase(null);

        try {
            // Prepare test cases
            // We need to map the existing DB format to the new array-based input format
            const casesToRun = hasSampleCases ? visibleTestCases : [];
            const formattedCases = casesToRun.map(tc => ({
                id: tc.id || String(Math.random()),
                // Try to parse input if it's a string that looks like JSON, otherwise wrap as single arg
                input: Array.isArray(tc.input) ? tc.input : [tc.input],
                expectedOutput: tc.expectedOutput
            }));

            // Use the participant ID as userId for session isolation
            const userId = currentParticipant?.id || "guest";
            const sessionId = testId || "default";

            const result = await judgeRun(code, language, formattedCases, userId, sessionId);

            if (result.verdict === "Internal Error") {
                setError(result.stderr || "Internal Error occurred");
            } else if (result.testCaseResults && result.testCaseResults.length > 0) {
                // Structured results from test cases
                const passedCount = result.testCaseResults.filter(r => r.verdict === "Accepted").length;
                setRunResult({
                    results: result.testCaseResults.map(r => ({
                        passed: r.verdict === "Accepted",
                        input: r.actualOutput, // We might not get input back in result, handled below
                        expected: r.expectedOutput,
                        actual: r.actualOutput,
                        error: r.stderr,
                        verdict: r.verdict
                    })),
                    passed: passedCount,
                    total: result.testCaseResults.length
                });
                // Also show global stdout if meaningful
                if (result.stdout) setOutput(result.stdout);
            } else {
                // No test cases (direct run) OR compile error
                if (result.verdict !== "Accepted" && result.stderr) {
                    setError(result.stderr);
                } else {
                    setOutput(result.stdout || "No output");
                }
            }
        } catch (err) {
            console.error("Execution error:", err);
            setError(err.message || "Failed to execute code");
        } finally {
            setIsRunning(false);
        }
    };

    const clearOutput = () => {
        setOutput("");
        setError(null);
        setRunResult(null);
        setExpandedCase(null);
    };

    const hasContent = output || error || (runResult && runResult.results?.length > 0);

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] relative">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2 text-zinc-400">
                    <Terminal size={14} />
                    <span className="text-xs font-medium uppercase tracking-wider">Output</span>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 font-mono text-sm space-y-3">
                {isRunning ? (
                    <div className="flex items-center gap-2 text-zinc-400">
                        <Loader2 size={16} className="animate-spin" />
                        <span>{hasSampleCases ? "Running sample test cases..." : "Executing..."}</span>
                    </div>
                ) : runResult && runResult.results?.length > 0 ? (
                    <>
                        <div className="text-xs font-semibold text-zinc-300">
                            {runResult.passed}/{runResult.total} sample test cases passed
                        </div>
                        {runResult.results.map((r, i) => (
                            <div
                                key={i}
                                className="rounded-lg border border-white/10 overflow-hidden bg-zinc-900/50"
                            >
                                <button
                                    type="button"
                                    onClick={() => setExpandedCase(expandedCase === i ? null : i)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-800/50"
                                >
                                    {expandedCase === i ? (
                                        <ChevronDown size={14} className="text-zinc-400 shrink-0" />
                                    ) : (
                                        <ChevronRight size={14} className="text-zinc-400 shrink-0" />
                                    )}
                                    <span className="text-xs font-medium text-zinc-400">Test case {i + 1}</span>
                                    {r.passed ? (
                                        <Check size={14} className="text-green-400 shrink-0" />
                                    ) : (
                                        <X size={14} className="text-red-400 shrink-0" />
                                    )}
                                    <span className={`text-xs font-medium ${r.passed ? "text-green-400" : "text-red-400"}`}>
                                        {r.verdict}
                                    </span>
                                </button>
                                {expandedCase === i && (
                                    <div className="px-3 pb-3 pt-0 space-y-2 text-xs border-t border-white/5 bg-black/20">
                                        <div className="mt-2">
                                            <span className="text-zinc-500 block mb-0.5">Expected</span>
                                            <pre className="bg-zinc-950 p-2 rounded text-green-400/90 whitespace-pre-wrap break-all border border-white/5">
                                                {r.expected || "(empty)"}
                                            </pre>
                                        </div>
                                        <div>
                                            <span className="text-zinc-500 block mb-0.5">Actual Output</span>
                                            <pre className="bg-zinc-950 p-2 rounded text-zinc-300 whitespace-pre-wrap break-all border border-white/5">
                                                {r.actual || "(empty)"}
                                            </pre>
                                        </div>
                                        {r.error && (
                                            <div>
                                                <span className="text-red-400 block mb-0.5">Error</span>
                                                <pre className="bg-red-950/20 text-red-400 p-2 rounded border border-red-900/20 whitespace-pre-wrap break-all">
                                                    {r.error}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </>
                ) : error ? (
                    <div className="text-red-400 whitespace-pre-wrap">{error}</div>
                ) : output ? (
                    <pre className="text-green-400 whitespace-pre-wrap font-mono text-xs">{output}</pre>
                ) : (
                    <div className="text-zinc-600 italic text-xs">
                        {hasSampleCases
                            ? "Click \"Run Code\" to run sample test cases..."
                            : "Click \"Run Code\" to execute your solution..."}
                    </div>
                )}
            </div>

            <div className="p-2 border-t border-white/5 bg-zinc-900/50 flex items-center justify-between shrink-0">
                <Button
                    onClick={clearOutput}
                    variant="ghost"
                    size="sm"
                    className="text-zinc-500 hover:text-white hover:bg-zinc-800 h-8 px-3 text-xs"
                    disabled={!hasContent}
                >
                    <Trash2 size={14} className="mr-2" />
                    Clear
                </Button>
                <Button
                    onClick={runCode}
                    disabled={isRunning || !code?.trim()}
                    className="bg-green-600 hover:bg-green-500 text-white h-8 px-4 text-xs font-semibold rounded-md shadow-lg shadow-green-900/20"
                >
                    {isRunning ? (
                        <>
                            <Loader2 size={14} className="mr-2 animate-spin" />
                            Running...
                        </>
                    ) : (
                        <>
                            <Play size={14} className="mr-2 fill-current" />
                            Run Code
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default TestOutput;
