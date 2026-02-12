'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Square, Terminal as TerminalIcon, Loader2, Trash2, Keyboard } from 'lucide-react';
import { useTerminal } from '@/hooks/useTerminal';
import { createRuntime, supportsWasmRuntime } from '@/lib/runtime/RuntimeManager';
import { executeCode as executeCodeAPI } from '@/api';

const UNIFIED_RUNTIME_LANGUAGES = ['python', 'cpp', 'java'];
const supportsUnifiedRuntime = (lang) =>
  UNIFIED_RUNTIME_LANGUAGES.includes((lang || '').toLowerCase());

/**
 * Terminal Component - VS Code-like interactive terminal for code execution.
 * 
 * Features:
 * - Real-time output streaming
 * - Interactive stdin support
 * - WASM runtimes (Python, JavaScript) with Piston API fallback
 * 
 * @param {Object} props
 * @param {React.RefObject} props.editorRef - Reference to Monaco editor
 * @param {string} props.language - Current programming language
 */
const TerminalPanel = ({ editorRef, language }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [runtimeStatus, setRuntimeStatus] = useState('idle'); // idle, loading, ready, running
    const [isWaitingInput, setIsWaitingInput] = useState(false);
    const runtimeRef = useRef(null);

    // Handle input from terminal
    const handleInput = useCallback((input) => {
        if (runtimeRef.current) {
            runtimeRef.current.writeInput(input + '\n');
            setIsWaitingInput(false);
        }
    }, []);

    const {
        containerRef,
        isReady: terminalReady,
        write,
        writeError,
        writePrompt,
        reset,
        enableInput,
        disableInput,
        focus,
        fit,
    } = useTerminal({ onInput: handleInput });

    // Cleanup runtime on unmount or language change
    useEffect(() => {
        return () => {
            if (runtimeRef.current) {
                runtimeRef.current.terminate();
                runtimeRef.current = null;
            }
        };
    }, [language]);

    // Refit terminal when container resizes
    useEffect(() => {
        if (terminalReady) {
            const timeout = setTimeout(fit, 100);
            return () => clearTimeout(timeout);
        }
    }, [terminalReady, fit]);

    /**
     * Run code using WASM runtime or Piston API fallback.
     */
    const runCode = async () => {
        const sourceCode = editorRef?.current?.getValue();
        if (!sourceCode || isRunning) return;

        setIsRunning(true);
        setIsWaitingInput(false);
        reset();

        write(`\x1b[36m$ Running ${language}...\x1b[0m\r\n`);
        write(`\x1b[90m${'─'.repeat(40)}\x1b[0m\r\n\r\n`);

        if (supportsUnifiedRuntime(language)) {
            await runWithUnifiedRuntime(sourceCode);
        } else if (supportsWasmRuntime(language)) {
            await runWithWasm(sourceCode);
        } else {
            await runWithPiston(sourceCode);
        }
    };

    /**
     * Run code using local WASM runtime.
     * @param {string} code
     */
    const runWithWasm = async (code) => {
        setRuntimeStatus('loading');
        write('\x1b[33m⏳ Initializing runtime...\x1b[0m\r\n');

        // Create runtime with callbacks
        const runtime = createRuntime(language, {
            onStdout: (data) => write(data),
            onStderr: (data) => writeError(data),
            onInputRequest: () => {
                setIsWaitingInput(true);
                enableInput();
            },
            onExit: (exitCode) => {
                disableInput();
                setIsRunning(false);
                setRuntimeStatus('idle');
                setIsWaitingInput(false);
                write(`\r\n\x1b[90m${'─'.repeat(40)}\x1b[0m\r\n`);
                write(`\x1b[${exitCode === 0 ? '32' : '31'}m✓ Process exited with code ${exitCode}\x1b[0m\r\n`);
            },
        });

        if (!runtime) {
            // Fallback to Piston
            await runWithPiston(code);
            return;
        }

        runtimeRef.current = runtime;

        // Wait for runtime to be ready (with timeout)
        const waitForReady = () => new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 100; // 10 seconds max

            const check = () => {
                if (runtime.isReady) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Runtime initialization timeout'));
                } else {
                    attempts++;
                    setTimeout(check, 100);
                }
            };
            check();
        });

        try {
            await waitForReady();
            setRuntimeStatus('running');
            write('\x1b[32m✓ Runtime ready\x1b[0m\r\n\r\n');
            await runtime.run(code);
        } catch (error) {
            writeError(`\r\n✗ Runtime error: ${error.message}\r\n`);
            setIsRunning(false);
            setRuntimeStatus('idle');
        }
    };

    /**
     * Run code using unified runtime (Python/C++/Java): 2s timeout, structured result.
     * @param {string} code
     */
    const runWithUnifiedRuntime = async (code) => {
        setIsLoading(true);
        try {
            const { executeCode: run } = await import('@/runtime/executeCode');
            const result = await run(language, code, undefined);
            if (result.output) write(result.output);
            if (result.error) writeError(result.error);
            write(`\r\n\x1b[90m${'─'.repeat(40)}\x1b[0m\r\n`);
            write(`\x1b[${result.success ? '32' : '31'}m✓ ${result.success ? 'Completed' : 'Failed'} (${result.executionTime}ms)\x1b[0m\r\n`);
        } catch (err) {
            writeError(`\r\n✗ Execution error: ${err?.message || err}\r\n`);
        } finally {
            setIsLoading(false);
            setIsRunning(false);
        }
    };

    /**
     * Run code using Piston API (fallback).
     * @param {string} code
     */
    const runWithPiston = async (code) => {
        setIsLoading(true);
        write('\x1b[33m☁ Using cloud runtime...\x1b[0m\r\n\r\n');

        try {
            const { run: result } = await executeCodeAPI(language, code);

            if (result.output) {
                write(result.output);
            }

            if (result.stderr) {
                writeError(result.stderr);
            }

            write(`\r\n\x1b[90m${'─'.repeat(40)}\x1b[0m\r\n`);
            write(`\x1b[32m✓ Process completed\x1b[0m\r\n`);
        } catch (error) {
            writeError(`\r\n✗ Execution error: ${error.message}\r\n`);
        } finally {
            setIsLoading(false);
            setIsRunning(false);
        }
    };

    /**
     * Stop the running code.
     */
    const stopCode = () => {
        if (runtimeRef.current) {
            runtimeRef.current.terminate();
            runtimeRef.current = null;
        }
        disableInput();
        setIsRunning(false);
        setRuntimeStatus('idle');
        setIsWaitingInput(false);
        write(`\r\n\x1b[90m${'─'.repeat(40)}\x1b[0m\r\n`);
        writeError('✗ Execution terminated by user\r\n');
    };

    /**
     * Clear the terminal.
     */
    const clearTerminal = () => {
        reset();
        write('\x1b[90m$ Terminal cleared\x1b[0m\r\n\r\n');
    };

    return (
        <div className="w-full h-full flex flex-col bg-zinc-950 rounded-lg overflow-hidden border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-zinc-900/50">
                <div className="flex items-center gap-2">
                    <TerminalIcon size={14} className="text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-300">Terminal</span>
                    {supportsUnifiedRuntime(language) ? (
                        <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
                            Runtime
                        </span>
                    ) : supportsWasmRuntime(language) ? (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded border border-green-500/20">
                            WASM
                        </span>
                    ) : (
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                            Cloud
                        </span>
                    )}
                    {isWaitingInput && (
                        <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20 animate-pulse">
                            <Keyboard size={10} />
                            Waiting for input...
                        </span>
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={clearTerminal}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Clear Terminal"
                    >
                        <Trash2 size={14} />
                    </button>

                    {isRunning ? (
                        <button
                            onClick={stopCode}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 transition-all"
                        >
                            <Square size={12} />
                            Stop
                        </button>
                    ) : (
                        <button
                            onClick={runCode}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-zinc-200 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                            {isLoading ? 'Running...' : 'Run'}
                        </button>
                    )}
                </div>
            </div>

            {/* Terminal Container */}
            <div
                ref={containerRef}
                className="flex-1 p-2 cursor-text"
                onClick={focus}
            />
        </div>
    );
};

export default TerminalPanel;
