"use client";

import { useParams, useRouter } from "next/navigation";
import { CheckCircle, Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TestSubmittedPage() {
    const { testId } = useParams();
    const router = useRouter();
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const isAutoSubmit = searchParams?.get('auto') === 'true';

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 blur-[150px] rounded-full pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-10 text-center max-w-md shadow-2xl">
                {/* Status Icon */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500 ${isAutoSubmit ? 'bg-yellow-500/10' : 'bg-green-500/10'}`}>
                    {isAutoSubmit ? <AlertTriangle className="w-8 h-8 text-yellow-500" /> : <CheckCircle className="w-8 h-8 text-green-500" />}
                </div>

                <h1 className="text-2xl font-bold text-white mb-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                    {isAutoSubmit ? "Test Ended" : "Test Submitted"}
                </h1>

                <p className="text-zinc-400 mb-8 max-w-[280px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
                    {isAutoSubmit
                        ? "Your test was automatically submitted due to a violation or time limit."
                        : "Your answers have been submitted successfully."}
                </p>

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
