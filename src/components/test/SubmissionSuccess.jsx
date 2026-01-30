"use client";

import { X, CheckCircle, Clock, Zap, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const SubmissionSuccess = ({ isOpen, onClose, stats }) => {
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen || !stats) return null;

    // Mock percentile logic based on runtime (MVP)
    // Faster runtime = higher percentile
    const runtimePercentile = Math.min(99, Math.max(50, Math.round(100 - (stats.runtime / 2))));
    const memoryPercentile = Math.min(99, Math.max(40, Math.round(100 - (stats.memory / 1000))));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl p-8 overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Header */}
                <div className="flex flex-col items-center mb-8 space-y-2">
                    <div className="text-green-500 mb-2">
                        <CheckCircle size={64} className="fill-green-500/10" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Accepted</h2>
                    <p className="text-zinc-400">
                        You have successfully passed {stats.passed}/{stats.total} test cases!
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Runtime Card */}
                    <div className="bg-zinc-900/50 rounded-xl p-5 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500/50" />
                        <div className="flex items-center gap-3 mb-3">
                            <Clock className="text-zinc-400" size={20} />
                            <span className="text-sm font-medium text-zinc-300">Runtime</span>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">
                            {stats.runtime} <span className="text-lg text-zinc-500 font-normal">ms</span>
                        </div>
                        <div className="text-xs text-green-400 font-medium">
                            Beats {runtimePercentile}% of users
                        </div>
                        {/* Mock Graph Bar */}
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-4 overflow-hidden">
                            <div
                                className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${runtimePercentile}%` }}
                            />
                        </div>
                    </div>

                    {/* Memory Card */}
                    <div className="bg-zinc-900/50 rounded-xl p-5 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50" />
                        <div className="flex items-center gap-3 mb-3">
                            <Zap className="text-zinc-400" size={20} />
                            <span className="text-sm font-medium text-zinc-300">Memory</span>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">
                            {stats.memory.toFixed(1)} <span className="text-lg text-zinc-500 font-normal">KB</span>
                        </div>
                        <div className="text-xs text-purple-400 font-medium">
                            Beats {memoryPercentile}% of users
                        </div>
                        {/* Mock Graph Bar */}
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-4 overflow-hidden">
                            <div
                                className="h-full bg-purple-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${memoryPercentile}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Action Footer */}
                <div className="flex items-center justify-center gap-4">
                    <Button
                        onClick={onClose}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white min-w-[120px]"
                    >
                        Close
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-500 text-white min-w-[140px] gap-2">
                        <Share2 size={16} /> Share Result
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SubmissionSuccess;
