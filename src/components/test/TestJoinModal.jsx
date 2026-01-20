"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

const TestJoinModal = ({ isOpen, onClose }) => {
    const router = useRouter();
    const [testId, setTestId] = useState("");
    const [isJoining, setIsJoining] = useState(false);

    const handleJoinTest = async () => {
        if (!testId.trim() || isJoining) return;

        setIsJoining(true);

        try {
            // Check if test exists
            const testRef = doc(db, "tests", testId.trim());
            const testSnap = await getDoc(testRef);

            if (!testSnap.exists()) {
                toast.error("Test not found. Please check the test ID.");
                return;
            }

            const testData = testSnap.data();

            // Redirect to the test access page
            router.push(`/test/${testId.trim()}`);
            onClose();
            toast.success("Redirecting to test...");
        } catch (error) {
            console.error("Error joining test:", error);
            toast.error("Failed to join test. Please try again.");
        } finally {
            setIsJoining(false);
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            // Extract test ID from a potential URL
            const urlRegex = /\/test\/([a-zA-Z0-9_-]+)/;
            const match = text.match(urlRegex);
            if (match && match[1]) {
                setTestId(match[1]);
            } else {
                setTestId(text.trim());
            }
        } catch (err) {
            toast.error("Failed to paste from clipboard");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-950/95 backdrop-blur-2xl border border-white/10 p-0 overflow-hidden rounded-2xl max-w-md shadow-2xl">
                <div className="p-6 border-b border-white/5 bg-zinc-900/30">
                    <DialogTitle className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-xl">
                            <ExternalLink className="w-5 h-5 text-blue-400" />
                        </div>
                        Join Test
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Enter the test ID or paste the invitation link to join a test.
                    </DialogDescription>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">
                            Test ID or Link
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                                placeholder="Enter test ID or full link"
                                value={testId}
                                onChange={(e) => setTestId(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleJoinTest();
                                    }
                                }}
                                className="bg-zinc-900 text-white border-white/10 focus:border-blue-500/50 h-12 rounded-xl flex-1"
                            />
                            <Button
                                onClick={handlePaste}
                                variant="outline"
                                className="h-12 px-4 text-zinc-400 hover:text-white border-white/10"
                            >
                                Paste
                            </Button>
                        </div>
                        <p className="text-xs text-zinc-500">
                            Enter the test ID or full invitation link provided by the instructor.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-white/5">
                        <Button
                            onClick={onClose}
                            className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 h-12 rounded-xl font-medium"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleJoinTest}
                            disabled={isJoining || !testId.trim()}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white h-12 rounded-xl font-semibold disabled:opacity-50"
                        >
                            {isJoining ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                "Join Test"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TestJoinModal;