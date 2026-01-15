"use client";

import { useParams, useRouter } from "next/navigation";
import { CheckCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TestSubmittedPage() {
    const { testId } = useParams();
    const router = useRouter();

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 blur-[150px] rounded-full pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-10 text-center max-w-md shadow-2xl">
                {/* Success Icon */}
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                    Test Submitted!
                </h1>

                <p className="text-zinc-400 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
                    Your answers have been submitted successfully. Your instructor will review your submission.
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
