"use client";

import { useState } from "react";
import { useProctor } from "@/context/ProctorContext";
import { Shield, Maximize, Lock, Eye, Keyboard, Clipboard, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ProctorStartScreen = ({ testTitle, testStatus, onStart }) => {
    const { startProctoring } = useProctor();
    const [isStarting, setIsStarting] = useState(false);
    const [error, setError] = useState(null);

    const handleStart = async () => {
        setIsStarting(true);
        setError(null);

        try {
            const success = await startProctoring();
            if (success) {
                onStart?.();
            } else {
                setError("Failed to enter fullscreen. Please allow fullscreen access and try again.");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setIsStarting(false);
        }
    };

    const rules = [
        {
            icon: Maximize,
            title: "Fullscreen Required",
            description: "Test must be taken in fullscreen mode. Exiting will result in a warning.",
        },
        {
            icon: Eye,
            title: "Tab Switching Monitored",
            description: "Switching tabs, windows, or applications will be detected and logged.",
        },
        {
            icon: Keyboard,
            title: "Shortcuts Blocked",
            description: "Developer tools, refresh, and certain keyboard shortcuts are disabled.",
        },
        {
            icon: Clipboard,
            title: "No Copy/Paste",
            description: "Clipboard actions are blocked. You must type all answers manually.",
        },
        {
            icon: RefreshCw,
            title: "No Refresh",
            description: "Refreshing the page will automatically submit your test.",
        },
        {
            icon: Lock,
            title: "Two Warning Policy",
            description: "First violation = warning. Second violation = automatic submission.",
        },
    ];

    if (testStatus === "draft") {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

                <div className="relative z-10 text-center space-y-6 max-w-md w-full p-8 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl">
                    <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
                        <div className="relative w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center border border-white/10">
                            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                        </div>
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">Waiting for Host</h1>
                        <p className="text-zinc-400">
                            Please wait while the organizer starts the test session.
                            <br />
                            Do not refresh the page.
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-800/50 rounded-full border border-white/5 text-xs text-zinc-500">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                        Status: waiting for start
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 max-w-2xl w-full">
                <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="p-10 pb-0 text-center">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Shield className="w-8 h-8 text-blue-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">{testTitle || "Proctored Test"}</h1>
                        <p className="text-zinc-400 text-sm max-w-sm mx-auto">This exam is monitored. Please review the rules below before starting.</p>
                    </div>

                    {/* Rules */}
                    <div className="p-8">
                        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">
                            Test Rules & Monitoring
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {rules.map((rule, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <rule.icon className="w-5 h-5 text-zinc-500 mt-0.5" />
                                    <div>
                                        <h3 className="text-sm font-medium text-white">{rule.title}</h3>
                                        <p className="text-xs text-zinc-500 mt-0.5">{rule.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Start Button */}
                        <div className="mt-8">
                            <Button
                                onClick={handleStart}
                                disabled={isStarting}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white h-14 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:shadow-blue-500/30"
                            >
                                {isStarting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Entering Fullscreen...
                                    </>
                                ) : (
                                    <>
                                        <Maximize className="w-5 h-5 mr-2" />
                                        Enter Fullscreen & Start Test
                                    </>
                                )}
                            </Button>

                            <p className="text-center text-zinc-500 text-xs mt-4">
                                By starting, you agree to the proctoring rules above
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProctorStartScreen;
