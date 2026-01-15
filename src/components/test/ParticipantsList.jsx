"use client";

import { useState } from "react";
import { useTest } from "@/context/TestContext";
import { Users, Clock, CheckCircle, XCircle, Circle, RefreshCw, MoreVertical, ShieldAlert, ShieldCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ParticipantsList = ({ onSelect, selectedId }) => {
    const { participants, isLoading, changeParticipantStatus } = useTest();
    const [filter, setFilter] = useState("all");

    const handleStatusChange = async (participantId, newStatus) => {
        try {
            await changeParticipantStatus(participantId, newStatus);
            toast.success(`Participant marked as ${newStatus}`);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "submitted": return <CheckCircle size={14} className="text-green-400" />;
            case "cheated": return <ShieldAlert size={14} className="text-red-500" />;
            case "left": return <XCircle size={14} className="text-red-400" />;
            case "active":
            default: return <Circle size={14} className="text-blue-400 animate-pulse" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "submitted": return "bg-green-500/10 text-green-400 border border-green-500/20";
            case "cheated": return "bg-red-500/10 text-red-500 border border-red-500/20";
            case "left": return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
            case "active":
            default: return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return "N/A";
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return formatDistanceToNow(date, { addSuffix: true });
        } catch {
            return "N/A";
        }
    };

    const filteredParticipants = participants.filter(p => {
        if (filter === "all") return true;
        if (filter === "active") return p.status === "active";
        if (filter === "submitted") return p.status === "submitted";
        return true;
    });

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-zinc-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-zinc-900/40 backdrop-blur-md">
            {/* Header */}
            <div className="p-4 border-b border-white/5">
                <div className="flex items-center gap-2 mb-4">
                    <Users size={18} className="text-zinc-400" />
                    <h2 className="text-lg font-bold text-white">Participants</h2>
                    <span className="ml-auto px-2 py-0.5 bg-zinc-800 text-zinc-300 text-sm rounded-full">
                        {participants.length}
                    </span>
                </div>

                {/* Filter Tabs */}
                <div className="flex p-1 bg-zinc-900/50 rounded-lg border border-white/5">
                    {["all", "active", "submitted"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${filter === f
                                    ? "bg-zinc-800 text-white shadow-sm"
                                    : "text-zinc-500 hover:text-zinc-300"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Participants List */}
            <div className="flex-1 overflow-y-auto p-2">
                {filteredParticipants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <Users className="w-12 h-12 text-zinc-600 mb-3" />
                        <p className="text-zinc-400 text-sm">No participants yet</p>
                        <p className="text-zinc-500 text-xs mt-1">
                            Share the test link to invite participants
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredParticipants.map((participant) => (
                            <div
                                key={participant.id}
                                onClick={() => onSelect?.(participant)}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group border ${selectedId === participant.id
                                        ? "bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                                        : "border-transparent hover:bg-white/5"
                                    }`}
                            >
                                {/* Avatar */}
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                    {participant.name?.charAt(0).toUpperCase() || "?"}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-white truncate">
                                            {participant.name}
                                        </span>
                                        {getStatusIcon(participant.status)}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                        <Clock size={10} />
                                        <span>Joined {formatTime(participant.joinedAt)}</span>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full ${getStatusColor(participant.status)}`}>
                                    {participant.status}
                                </span>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-white/10 ml-1"
                                            onClick={(e) => e.stopPropagation()} // Prevent selecting row when opening menu
                                        >
                                            <MoreVertical size={16} />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                                        {participant.status !== "cheated" ? (
                                            <DropdownMenuItem onClick={() => handleStatusChange(participant.id, "cheated")} className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer">
                                                <ShieldAlert className="mr-2 h-4 w-4" />
                                                Mark as Cheated
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem onClick={() => handleStatusChange(participant.id, "active")} className="text-zinc-400 focus:text-white focus:bg-zinc-800 cursor-pointer">
                                                <ShieldCheck className="mr-2 h-4 w-4" />
                                                Mark as Safe
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParticipantsList;
