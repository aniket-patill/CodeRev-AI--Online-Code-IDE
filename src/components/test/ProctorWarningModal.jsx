"use client";

import { useProctor, VIOLATIONS } from "@/context/ProctorContext";
import { AlertTriangle, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const getViolationMessage = (type) => {
    switch (type) {
        case VIOLATIONS.FULLSCREEN_EXIT:
            return {
                title: "Fullscreen Required",
                message: "You must remain in fullscreen mode during the test. Exiting fullscreen again will automatically submit your test.",
                icon: "🖥️",
            };
        case VIOLATIONS.TAB_SWITCH:
            return {
                title: "Tab Switch Detected",
                message: "Switching tabs or windows is not allowed. Another attempt will automatically submit your test.",
                icon: "🔀",
            };
        case VIOLATIONS.WINDOW_BLUR:
            return {
                title: "Window Focus Lost",
                message: "You clicked outside the test window. This is not allowed. Another attempt will automatically submit your test.",
                icon: "👁️",
            };
        case VIOLATIONS.DEVTOOLS_OPEN:
            return {
                title: "Developer Tools Detected",
                message: "Opening developer tools is prohibited during the test. This action has been logged.",
                icon: "🔧",
            };
        case VIOLATIONS.PASTE_ATTEMPT:
            return {
                title: "Paste Blocked",
                message: "Pasting content is not allowed during the test. You must type all answers manually.",
                icon: "📋",
            };
        case VIOLATIONS.RIGHT_CLICK:
            return {
                title: "Right-Click Disabled",
                message: "Right-clicking is disabled during the test.",
                icon: "🖱️",
            };
        case VIOLATIONS.KEYBOARD_SHORTCUT:
            return {
                title: "Keyboard Shortcut Blocked",
                message: "Certain keyboard shortcuts are disabled during the test to maintain integrity.",
                icon: "⌨️",
            };
        default:
            return {
                title: "Warning",
                message: "A suspicious activity was detected. Please focus on your test.",
                icon: "⚠️",
            };
    }
};

const ProctorWarningModal = () => {
    const { showWarningModal, currentWarning, dismissWarning, warningCount } = useProctor();

    if (!showWarningModal || !currentWarning) return null;

    const { title, message, icon } = getViolationMessage(currentWarning);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-red-500/20 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-red-500/20 rounded-2xl text-4xl">
                        {icon}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <ShieldAlert className="w-5 h-5 text-red-400" />
                            <span className="text-red-400 text-xs font-bold uppercase tracking-wider">
                                Warning {warningCount}/2
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                    </div>
                </div>

                {/* Message */}
                <p className="text-zinc-300 mb-6 leading-relaxed">
                    {message}
                </p>

                {/* Warning indicator */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="text-red-400 font-semibold mb-1">
                                {warningCount === 1 ? "First Warning" : "Final Warning"}
                            </p>
                            <p className="text-red-300/70">
                                {warningCount === 1
                                    ? "This is your first warning. One more violation will automatically submit your test."
                                    : "This is your final warning. Any further violations will result in automatic submission."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Progress bar showing warnings */}
                <div className="mb-6">
                    <div className="flex gap-2">
                        {[1, 2].map((num) => (
                            <div
                                key={num}
                                className={`flex-1 h-2 rounded-full transition-colors ${num <= warningCount ? "bg-red-500" : "bg-zinc-700"
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-center text-xs text-zinc-500 mt-2">
                        {2 - warningCount} warning{2 - warningCount !== 1 ? "s" : ""} remaining
                    </p>
                </div>

                {/* Action */}
                <Button
                    onClick={dismissWarning}
                    className="w-full bg-white text-black hover:bg-zinc-200 h-12 rounded-xl font-bold text-base"
                >
                    I Understand - Return to Fullscreen
                </Button>
            </div>
        </div>
    );
};

export default ProctorWarningModal;
