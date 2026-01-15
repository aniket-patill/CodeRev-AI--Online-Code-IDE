"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Users, Clock, Copy, ExternalLink, Loader2, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const TestCard = ({ test, onDelete }) => {
    const router = useRouter();
    const [isCopying, setIsCopying] = useState(false);

    const copyTestLink = async () => {
        setIsCopying(true);
        try {
            const testUrl = `${window.location.origin}/test/${test.id}`;
            await navigator.clipboard.writeText(testUrl);
            toast.success("Test link copied!");
        } catch (err) {
            toast.error("Failed to copy link");
        } finally {
            setIsCopying(false);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case "active":
                return "bg-green-500/20 text-green-400 border-green-500/30";
            case "ended":
                return "bg-red-500/20 text-red-400 border-red-500/30";
            case "draft":
            default:
                return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
        }
    };

    const formatDuration = (minutes) => {
        if (!minutes) return "No limit";
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins ? `${hours}h ${mins}m` : `${hours}h`;
    };

    return (
        <div className="group relative border border-white/10 bg-zinc-900 rounded-2xl transition-all duration-300 hover:scale-[1.01] hover:border-white/20 hover:shadow-2xl overflow-hidden">
            <div className="p-6 flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <FileText size={20} className="text-blue-400" />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full border ${getStatusStyles(test.status)}`}>
                            {test.status}
                        </span>
                    </div>
                </div>

                {/* Title & Description */}
                <div>
                    <h3 className="text-lg font-bold text-white mb-1 truncate group-hover:text-zinc-200 transition-colors">
                        {test.title}
                    </h3>
                    {test.description && (
                        <p className="text-sm text-zinc-500 line-clamp-2">
                            {test.description}
                        </p>
                    )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                    <div className="flex items-center gap-1.5">
                        <Clock size={12} />
                        <span>{formatDuration(test.duration)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Lock size={12} />
                        <span>Password protected</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-white/5">
                    <Button
                        onClick={copyTestLink}
                        disabled={isCopying}
                        variant="ghost"
                        className="flex-1 h-9 text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                        {isCopying ? (
                            <Loader2 size={14} className="mr-2 animate-spin" />
                        ) : (
                            <Copy size={14} className="mr-2" />
                        )}
                        Copy Link
                    </Button>

                    <Link href={`/test/${test.id}/manage`} className="flex-1">
                        <Button className="w-full h-9 bg-zinc-800 hover:bg-zinc-700 text-white">
                            <ExternalLink size={14} className="mr-2" />
                            Manage
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default TestCard;
