"use client";

import { useState } from "react";
import { Play, Loader2, Trash2, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";

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
            const response = await axios.post("/api/execute", {
                code,
                language,
            });

            if (response.data.error) {
                setError(response.data.error);
                setOutput(response.data.output || "");
            } else {
                setOutput(response.data.output || "No output");
            }
        } catch (err) {
            console.error("Execution error:", err);
            setError(err.response?.data?.error || "Failed to execute code");
        } finally {
            setIsRunning(false);
        }
    };

    const clearOutput = () => {
        setOutput("");
        setError(null);
    };

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2 text-zinc-400">
                    <Terminal size={16} />
                    <span className="text-sm font-medium">Output</span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={clearOutput}
                        variant="ghost"
                        size="sm"
                        className="text-zinc-500 hover:text-white hover:bg-zinc-800 h-7 px-2"
                        disabled={!output && !error}
                    >
                        <Trash2 size={14} />
                    </Button>

                    <Button
                        onClick={runCode}
                        disabled={isRunning || !code?.trim()}
                        className="bg-green-600 hover:bg-green-500 text-white h-7 px-3 text-sm font-semibold"
                    >
                        {isRunning ? (
                            <>
                                <Loader2 size={14} className="mr-1 animate-spin" />
                                Running...
                            </>
                        ) : (
                            <>
                                <Play size={14} className="mr-1" />
                                Run Code
                            </>
                        )}
                    </Button>
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
                    <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
                ) : (
                    <div className="text-zinc-500">
                        Click "Run Code" to execute your solution
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestOutput;
