"use client";

import { useState } from "react";
import { Play, Loader2, Trash2, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runTestCase } from "@/utils/execution/runTestCase";

const TestOutput = ({ code, language = "javascript" }) => {
    const [output, setOutput] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState(null);

    const runCode = async () => {
        if (isRunning || !code?.trim()) return;

        setIsRunning(true);
        setOutput("");
        setError(null);

        try {
            const result = await runTestCase(code, language, "");

            if (result.error) {
                setError(result.error);
                setOutput(result.output || "");
            } else {
                setOutput(result.output || "No output returned");
            }
        } catch (err) {
            console.error("Execution error:", err);
            setError("Failed to execute code");
        } finally {
            setIsRunning(false);
        }
    };

    const clearOutput = () => {
        setOutput("");
        setError(null);
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
                        <span>Executing...</span>
                    </div>
                ) : error ? (
                    <div className="text-red-400 whitespace-pre-wrap">{error}</div>
                ) : output ? (
                    <pre className="text-green-400 whitespace-pre-wrap font-mono text-xs">{output}</pre>
                ) : (
                    <div className="text-zinc-600 italic text-xs">
                        Click "Run Code" to execute your solution...
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
                    disabled={!output && !error}
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
