"use client";

import { useTest } from "@/context/TestContext";
import { Trophy, Medal, Clock, CheckCircle, User } from "lucide-react";
import { useMemo } from "react";

const LeaderboardPanel = () => {
    const { participants, currentParticipant, test } = useTest();

    // Compute sorted leaderboard data
    const sortedParticipants = useMemo(() => {
        if (!participants) return [];

        return [...participants]
            .filter(p => p.email !== "admin@coderev.com") // Optional: Filter out admins if needed
            .sort((a, b) => {
                // 1. Score (Higher is better)
                const scoreA = a.score || 0;
                const scoreB = b.score || 0;
                if (scoreB !== scoreA) return scoreB - scoreA;

                // 2. Runtime (Lower is better, only if score > 0)
                const runtimeA = a.runtime || Number.MAX_SAFE_INTEGER;
                const runtimeB = b.runtime || Number.MAX_SAFE_INTEGER;
                if (scoreA > 0 && runtimeA !== runtimeB) return runtimeA - runtimeB;

                // 3. Submission Time (Earlier is better)
                const timeA = a.submittedAt?.toMillis() || Number.MAX_SAFE_INTEGER;
                const timeB = b.submittedAt?.toMillis() || Number.MAX_SAFE_INTEGER;
                return timeA - timeB;
            });
    }, [participants]);

    const getRankIcon = (rank) => {
        if (rank === 0) return <Trophy className="text-yellow-400" size={20} />;
        if (rank === 1) return <Medal className="text-zinc-300" size={20} />;
        if (rank === 2) return <Medal className="text-amber-600" size={20} />;
        return <span className="text-zinc-500 font-mono font-bold w-5 text-center">{rank + 1}</span>;
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e]">
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-zinc-900/80">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Trophy className="text-yellow-500" size={18} />
                    Live Leaderboard
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                    Real-time rankings based on score and runtime.
                </p>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                <div className="space-y-1">
                    {sortedParticipants.length === 0 ? (
                        <div className="text-center py-10 text-zinc-500 text-sm">
                            No participants yet.
                        </div>
                    ) : (
                        sortedParticipants.map((p, index) => {
                            const isMe = p.id === currentParticipant?.id;
                            const status = p.status === "submitted" ? "Submitted" : "Active";
                            const statusColor = p.status === "submitted" ? "text-green-400" : "text-blue-400";

                            return (
                                <div
                                    key={p.id}
                                    className={`
                                        flex items-center gap-3 p-3 rounded-lg border transition-all
                                        ${isMe
                                            ? "bg-zinc-800/80 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                                            : "bg-zinc-900/30 border-white/5 hover:bg-zinc-800/50"
                                        }
                                    `}
                                >
                                    {/* Rank */}
                                    <div className="flex-shrink-0 w-8 flex justify-center">
                                        {getRankIcon(index)}
                                    </div>

                                    {/* User Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-medium truncate ${isMe ? "text-blue-400" : "text-zinc-300"}`}>
                                                {p.name || p.email || "Anonymous"}
                                            </span>
                                            {isMe && <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 rounded">You</span>}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                                            <span className={statusColor}>{status}</span>
                                            {p.runtime && (
                                                <span className="flex items-center gap-1">
                                                    <Clock size={10} />
                                                    {p.runtime}ms
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-white">
                                            {typeof p.score === 'number' ? Math.round(p.score) : 0}
                                        </div>
                                        <div className="text-[10px] text-zinc-500 uppercase">Points</div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* User Stats Footer */}
            {currentParticipant && (
                <div className="p-3 bg-zinc-900 border-t border-white/5">
                    <div className="flex justify-between items-center text-xs text-zinc-400">
                        <span>Your Rank: <span className="text-white font-bold">#{sortedParticipants.findIndex(p => p.id === currentParticipant.id) + 1}</span></span>
                        <span>Total Participants: <span className="text-white">{sortedParticipants.length}</span></span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaderboardPanel;
