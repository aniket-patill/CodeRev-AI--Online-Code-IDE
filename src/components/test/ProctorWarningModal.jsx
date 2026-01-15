"use client";

import { useProctor, VIOLATIONS } from "@/context/ProctorContext";
import { AlertTriangle, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const getViolationMessage = (type) => {
    switch (type) {
        case VIOLATIONS.FULLSCREEN_EXIT: return { title: "Fullscreen Required", message: "Please stay in fullscreen to continue." };
        case VIOLATIONS.TAB_SWITCH: return { title: "Focus Lost", message: "Switching tabs is not allowed." };
        case VIOLATIONS.WINDOW_BLUR: return { title: "Window Blurred", message: "Please keep the test window in focus." };
        case VIOLATIONS.DEVTOOLS_OPEN: return { title: "System Alert", message: "Developer tools are not permitted." };
        case VIOLATIONS.PASTE_ATTEMPT: return { title: "Action Blocked", message: "Copy/Paste is disabled." };
        default: return { title: "Security Alert", message: "Suspicious activity detected." };
    }
};

const ProctorWarningModal = () => {
    const { showWarningModal, currentWarning, dismissWarning, warningCount } = useProctor();

    if (!showWarningModal || !currentWarning) return null;

    const { title, message } = getViolationMessage(currentWarning);
    const remaining = 2 - warningCount;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full mx-6 shadow-2xl animate-in zoom-in-95 duration-200">

                {/* Minimal Icon */}
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>

                {/* Text */}
                <div className="text-center mb-8">
                    <h2 className="text-xl font-bold text-white mb-2 tracking-tight">{title}</h2>
                    <p className="text-zinc-400 text-sm">{message}</p>
                </div>

                {/* Status */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className={`h-1.5 w-8 rounded-full ${warningCount >= 1 ? 'bg-red-500' : 'bg-zinc-800'}`} />
                    <div className={`h-1.5 w-8 rounded-full ${warningCount >= 2 ? 'bg-red-500' : 'bg-zinc-800'}`} />
                    <span className="text-[10px] text-zinc-500 font-medium ml-2 uppercase tracking-wider">
                        {remaining} {remaining === 1 ? 'Attempt' : 'Attempts'} Left
                    </span>
                </div>

                {/* Action */}
                <Button
                    onClick={dismissWarning}
                    className="w-full bg-white text-black hover:bg-zinc-200 h-11 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
                >
                    Return to Test
                </Button>
            </div>
        </div>
    );
};

export default ProctorWarningModal;
