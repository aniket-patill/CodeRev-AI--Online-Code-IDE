"use client";

import { useState } from "react";
import { Play, Loader2, Trash2, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeExecutionService } from "@/utils/execution/CodeExecutionService";

const TestOutput = ({ code, language = "javascript", testcases = [], driverCode = "" }) => {
    const [output, setOutput] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [executionResult, setExecutionResult] = useState(null);
    const [error, setError] = useState(null);

    const runCode = async () => {
        if (isRunning || !code?.trim()) return;

        setIsRunning(true);
        setOutput("");
        setError(null);
        setExecutionResult(null);

        try {
            // Combine user code with driver code if available
            const fullCode = driverCode ? `${code}\n\n${driverCode}` : code;

            // Use Backend Execution API
            const response = await fetch('/api/execute-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: fullCode, // Send the combined code
                    language,
                    testcases: testcases || [] 
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Execution failed');
            }

            const result = await response.json();
            setExecutionResult(result);

            if (result.runtimeError) {
                setError(result.runtimeError);
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
        setExecutionResult(null);
    };

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] relative">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2 text-zinc-400">
                    <Terminal size={14} />
                    <span className="text-xs font-medium uppercase tracking-wider">Output</span>
                </div>
            </div>

            {/* Output Area */}
            <div className="flex-1 overflow-auto p-4 font-mono text-sm">
                {isRunning ? (
                    <div className="flex items-center gap-2 text-zinc-400">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Executing against {testcases?.length || 0} testcases...</span>
                    </div>
                ) : error ? (
                    <div className="text-red-400 whitespace-pre-wrap bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        <div className="font-bold mb-1">Runtime Error:</div>
                        {error}
                    </div>
                ) : executionResult ? (
                    <div className="space-y-4">
                        {/* Summary */}
                        <div className="flex gap-4 p-3 bg-zinc-800/50 rounded-lg border border-white/5">
                            <div className="text-center">
                                <div className="text-xs text-zinc-500 uppercase">Status</div>
                                <div className={`font-bold ${executionResult.summary.passed === executionResult.summary.total ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {executionResult.summary.passed}/{executionResult.summary.total} Passed
                                </div>
                            </div>
                            <div className="border-l border-white/10" />
                            <div className="text-center">
                                <div className="text-xs text-zinc-500 uppercase">Time</div>
                                <div className="text-zinc-300">{executionResult.summary.avgExecutionTime}ms</div>
                            </div>
                        </div>

                        {/* Test Cases */}
                        <div className="space-y-2">
                            {executionResult.results.map((res, idx) => (
                                <div key={idx} className={`p-3 rounded-lg border ${res.passed ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-xs font-bold ${res.passed ? 'text-green-400' : 'text-red-400'}`}>
                                            {res.passed ? '✓' : '✗'} Test Case #{idx + 1}
                                        </span>
                                        <span className="text-[10px] text-zinc-500">{res.executionTime}ms</span>
                                    </div>
                                    <div className="space-y-1 text-xs">
                                        {res.input && (
                                            <div className="grid grid-cols-[60px_1fr] gap-2">
                                                <span className="text-zinc-500">Input:</span>
                                                <pre className="text-blue-300 font-mono bg-zinc-900 px-1 rounded overflow-auto max-h-16">{res.input}</pre>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-[60px_1fr] gap-2">
                                            <span className="text-zinc-500">Expected:</span>
                                            <span className="text-zinc-300 font-mono bg-zinc-900 px-1 rounded">{res.expectedOutput}</span>
                                        </div>
                                        <div className="grid grid-cols-[60px_1fr] gap-2">
                                            <span className="text-zinc-500">Actual:</span>
                                            <span className={`font-mono bg-zinc-900 px-1 rounded ${res.passed ? 'text-green-300' : 'text-red-300'}`}>{res.actualOutput}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-zinc-600 italic text-xs">
                        Click "Run Code" to execute your solution against testcases...
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-2 border-t border-white/5 bg-zinc-900/50 flex items-center justify-between shrink-0">
                <Button
                    onClick={clearOutput}
                    variant="ghost"
                    size="sm"
                    className="text-zinc-500 hover:text-white hover:bg-zinc-800 h-8 px-3 text-xs"
                    disabled={!executionResult && !error}
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
