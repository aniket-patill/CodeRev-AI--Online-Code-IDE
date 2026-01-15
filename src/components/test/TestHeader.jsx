"use client";

import { useTest } from "@/context/TestContext";
import { Clock, Send, LogOut, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

const TestHeader = ({ testTitle, onSubmit, onLeave }) => {
    const { formattedTime, isTimeUp, currentParticipant } = useTest();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onSubmit?.();
            toast.success("Test submitted successfully!");
        } catch (error) {
            toast.error("Failed to submit test");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLeave = () => {
        setShowLeaveConfirm(true);
    };

    const confirmLeave = async () => {
        await onLeave?.();
        setShowLeaveConfirm(false);
    };

    const isSubmitted = currentParticipant?.status === "submitted";

    return (
        <>
            <header className="h-14 px-6 flex items-center justify-between bg-zinc-900/80 backdrop-blur-xl border-b border-white/5 shrink-0">
                {/* Left - Title */}
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-bold text-white truncate max-w-[300px]">
                        {testTitle || "Test"}
                    </h1>

                    {isSubmitted && (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
                            Submitted
                        </span>
                    )}
                </div>

                {/* Center - Timer */}
                {formattedTime && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold ${isTimeUp
                            ? "bg-red-500/20 text-red-400 animate-pulse"
                            : "bg-zinc-800 text-white"
                        }`}>
                        <Clock size={18} className={isTimeUp ? "text-red-400" : "text-zinc-400"} />
                        {isTimeUp ? "Time's Up!" : formattedTime}
                    </div>
                )}

                {/* Right - Actions */}
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleLeave}
                        variant="ghost"
                        className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-9 px-3"
                    >
                        <LogOut size={16} className="mr-2" />
                        Leave
                    </Button>

                    {!isSubmitted && (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-500 text-white h-9 px-4 font-semibold"
                        >
                            <Send size={16} className="mr-2" />
                            {isSubmitting ? "Submitting..." : "Submit Test"}
                        </Button>
                    )}
                </div>
            </header>

            {/* Leave Confirmation Modal */}
            {showLeaveConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-yellow-500/20 rounded-xl">
                                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Leave Test?</h3>
                        </div>

                        <p className="text-zinc-400 text-sm mb-6">
                            Are you sure you want to leave? Your progress has been saved, but you won't be able to rejoin.
                        </p>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => setShowLeaveConfirm(false)}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white h-10"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmLeave}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white h-10"
                            >
                                Leave Test
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TestHeader;
