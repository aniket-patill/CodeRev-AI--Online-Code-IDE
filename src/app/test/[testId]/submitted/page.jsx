"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, Home, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";

export default function TestSubmittedPage() {
    const { testId } = useParams();
    const router = useRouter();
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const isAutoSubmit = searchParams?.get('auto') === 'true';

    const [participant, setParticipant] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const participantId = sessionStorage.getItem(`test_participant_${testId}`);
        if (!participantId) {
            setLoading(false);
            return;
        }

        const unsub = onSnapshot(doc(db, `tests/${testId}/participants`, participantId), (doc) => {
            if (doc.exists()) {
                setParticipant({ id: doc.id, ...doc.data() });
            }
            setLoading(false);
        });

        return () => unsub();
    }, [testId]);

    const getGradeInfo = () => {
        if (!participant?.grade) return {
            title: isAutoSubmit ? "Test Ended" : "Test Submitted",
            message: isAutoSubmit
                ? "Your test was automatically submitted due to a violation or time limit."
                : "Your answers have been submitted successfully. Waiting for grading...",
            color: isAutoSubmit ? "text-yellow-500" : "text-blue-500",
            bgColor: isAutoSubmit ? "bg-yellow-500/10" : "bg-blue-500/10",
            icon: isAutoSubmit ? AlertTriangle : CheckCircle
        };

        if (participant.grade === "passed") return {
            title: "Result: Passed",
            message: "Congratulations! You have passed the test.",
            color: "text-green-500",
            bgColor: "bg-green-500/10",
            icon: CheckCircle
        };

        if (participant.grade === "failed") return {
            title: "Result: Failed",
            message: "Unfortunately, you did not pass this test.",
            color: "text-red-500",
            bgColor: "bg-red-500/10",
            icon: XCircle
        };

        return { title: "Unknown", message: "", color: "text-gray-500", bgColor: "bg-gray-500/10", icon: AlertTriangle };
    };

    const info = getGradeInfo();
    const Icon = info.icon;

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[150px] rounded-full pointer-events-none ${info.bgColor.replace('/10', '/5')}`} />

            {/* Content */}
            <div className="relative z-10 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-10 text-center max-w-md w-full shadow-2xl">
                {/* Status Icon */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500 ${info.bgColor}`}>
                    <Icon className={`w-8 h-8 ${info.color}`} />
                </div>

                <h1 className="text-2xl font-bold text-white mb-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                    {info.title}
                </h1>

                <p className="text-zinc-400 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
                    {info.message}
                </p>

                {/* Feedback Section */}
                {participant?.gradingFeedback && (
                    <div className="mb-8 p-4 bg-zinc-800/50 rounded-xl border border-white/5 text-left animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Instructor Feedback</h3>
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap">{participant.gradingFeedback}</p>
                    </div>
                )}

                <Button
                    onClick={() => router.push("/")}
                    className="w-full bg-white text-black hover:bg-zinc-200 h-12 rounded-xl font-semibold animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300"
                >
                    <Home size={18} className="mr-2" />
                    Go to Homepage
                </Button>
            </div>
        </div>
    );
}
