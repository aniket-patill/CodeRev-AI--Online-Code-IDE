"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Loader2 } from "lucide-react";
import TestAccessForm from "@/components/test/TestAccessForm";

export default function TestAccessPage() {
    const { testId } = useParams();
    const router = useRouter();
    const [test, setTest] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTest = async () => {
            try {
                const testRef = doc(db, "tests", testId);
                const testSnap = await getDoc(testRef);

                if (testSnap.exists()) {
                    const testData = { id: testSnap.id, ...testSnap.data() };

                    // Check if test has ended
                    if (testData.status === "ended") {
                        setError("This test has ended");
                    } else {
                        setTest(testData);
                    }
                } else {
                    setError("Test not found");
                }
            } catch (err) {
                console.error("Error fetching test:", err);
                setError("Failed to load test");
            } finally {
                setIsLoading(false);
            }
        };

        if (testId) {
            fetchTest();
        }
    }, [testId]);

    const handleSuccess = (participantId) => {
        router.push(`/test/${testId}/workspace`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex items-center gap-3 text-zinc-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading test...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center max-w-md">
                    <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">❌</span>
                    </div>
                    <h1 className="text-xl font-bold text-white mb-2">{error}</h1>
                    <p className="text-zinc-400 text-sm mb-6">
                        Please contact your instructor for assistance.
                    </p>
                    <button
                        onClick={() => router.push("/")}
                        className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />

            {/* Content */}
            <div className="relative z-10">
                <TestAccessForm
                    testId={testId}
                    testTitle={test?.title}
                    testDescription={test?.description}
                    onSuccess={handleSuccess}
                />
            </div>
        </div>
    );
}
