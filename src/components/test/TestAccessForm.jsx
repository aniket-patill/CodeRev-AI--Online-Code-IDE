"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Loader2, AlertCircle } from "lucide-react";
import { db, auth } from "@/config/firebase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TestAccessForm = ({ testId, testTitle, testDescription, onSuccess }) => {
    const router = useRouter();
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !password.trim()) {
            setError("Please fill in all fields");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const { joinTestSession } = await import("@/utils/testUtils");
            // Pass the current user's ID if logged in, for tracking attempted tests
            const userId = auth.currentUser?.uid || null;
            const participantId = await joinTestSession(db, testId, name, password, "", userId);

            // Store participant ID in session storage for this test
            sessionStorage.setItem(`test_participant_${testId}`, participantId);

            if (onSuccess) {
                onSuccess(participantId);
            } else {
                router.push(`/test/${testId}/workspace`);
            }
        } catch (err) {
            console.error("Error joining test:", err);
            setError(err.message || "Failed to join test. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">{testTitle || "Join Test"}</h1>
                    {testDescription && (
                        <p className="text-zinc-400 text-sm">{testDescription}</p>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name Input */}
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1 flex items-center gap-2">
                            <User size={12} /> Your Name
                        </label>
                        <Input
                            type="text"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-zinc-800 text-white border-white/10 focus:border-blue-500/50 h-12 rounded-xl"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1 flex items-center gap-2">
                            <Lock size={12} /> Access Password
                        </label>
                        <Input
                            type="password"
                            placeholder="Enter test password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-zinc-800 text-white border-white/10 focus:border-blue-500/50 h-12 rounded-xl"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={isLoading || !name.trim() || !password.trim()}
                        className="w-full bg-white text-black hover:bg-zinc-200 h-12 rounded-xl font-semibold disabled:opacity-50 transition-all"
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            "Enter Test"
                        )}
                    </Button>
                </form>

                {/* Footer */}
                <p className="text-center text-zinc-500 text-xs mt-6">
                    Your progress will be saved automatically
                </p>
            </div>
        </div>
    );
};

export default TestAccessForm;
