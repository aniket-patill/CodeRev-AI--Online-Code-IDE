"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "@/config/firebase";
import { Loader2, ArrowLeft, Copy, Play, Square, Link2, Users, Clock, Settings, Trash2 } from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { toast } from "sonner";

import { TestProvider, useTest } from "@/context/TestContext";
import { Button } from "@/components/ui/button";
import ParticipantsList from "@/components/test/ParticipantsList";

const ManageContent = ({ test, onUpdate }) => {
    const router = useRouter();
    const { participants } = useTest();
    const [isStarting, setIsStarting] = useState(false);
    const [isEnding, setIsEnding] = useState(false);

    const testUrl = typeof window !== "undefined"
        ? `${window.location.origin}/test/${test.id}`
        : "";

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(testUrl);
            toast.success("Test link copied!");
        } catch {
            toast.error("Failed to copy");
        }
    };

    const copyPassword = async () => {
        try {
            await navigator.clipboard.writeText(test.password);
            toast.success("Password copied!");
        } catch {
            toast.error("Failed to copy");
        }
    };

    const startTest = async () => {
        setIsStarting(true);
        try {
            const testRef = doc(db, "tests", test.id);
            await updateDoc(testRef, {
                status: "active",
                startTime: Timestamp.now(),
            });
            onUpdate({ ...test, status: "active" });
            toast.success("Test started!");
        } catch (err) {
            toast.error("Failed to start test");
        } finally {
            setIsStarting(false);
        }
    };

    const endTest = async () => {
        setIsEnding(true);
        try {
            const testRef = doc(db, "tests", test.id);
            await updateDoc(testRef, {
                status: "ended",
                endTime: Timestamp.now(),
            });
            onUpdate({ ...test, status: "ended" });
            toast.success("Test ended!");
        } catch (err) {
            toast.error("Failed to end test");
        } finally {
            setIsEnding(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "active": return "bg-green-500/20 text-green-400 border-green-500/30";
            case "ended": return "bg-red-500/20 text-red-400 border-red-500/30";
            default: return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
        }
    };

    const activeCount = participants.filter(p => p.status === "active").length;
    const submittedCount = participants.filter(p => p.status === "submitted").length;

    return (
        <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
            {/* Header */}
            <header className="h-16 px-6 flex items-center justify-between bg-zinc-900/80 backdrop-blur-xl border-b border-white/5 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div>
                        <h1 className="text-lg font-bold text-white">{test.title}</h1>
                        <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${getStatusColor(test.status)}`}>
                                {test.status}
                            </span>
                            <span className="text-xs text-zinc-500">
                                {participants.length} participants
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {test.status === "draft" && (
                        <Button
                            onClick={startTest}
                            disabled={isStarting}
                            className="bg-green-600 hover:bg-green-500 text-white h-9 px-4"
                        >
                            {isStarting ? (
                                <Loader2 size={16} className="mr-2 animate-spin" />
                            ) : (
                                <Play size={16} className="mr-2" />
                            )}
                            Start Test
                        </Button>
                    )}

                    {test.status === "active" && (
                        <Button
                            onClick={endTest}
                            disabled={isEnding}
                            className="bg-red-600 hover:bg-red-500 text-white h-9 px-4"
                        >
                            {isEnding ? (
                                <Loader2 size={16} className="mr-2 animate-spin" />
                            ) : (
                                <Square size={16} className="mr-2" />
                            )}
                            End Test
                        </Button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                <PanelGroup direction="horizontal">
                    {/* Left - Test Info */}
                    <Panel defaultSize={35} minSize={25}>
                        <div className="h-full overflow-y-auto p-6 space-y-6">
                            {/* Share Section */}
                            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5">
                                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <Link2 size={16} className="text-blue-400" />
                                    Share Test
                                </h2>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
                                            Test Link
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                value={testUrl}
                                                readOnly
                                                className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 truncate"
                                            />
                                            <Button
                                                onClick={copyLink}
                                                variant="ghost"
                                                className="px-3 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                                            >
                                                <Copy size={16} />
                                            </Button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
                                            Password
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                value={test.password}
                                                readOnly
                                                type="password"
                                                className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300"
                                            />
                                            <Button
                                                onClick={copyPassword}
                                                variant="ghost"
                                                className="px-3 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                                            >
                                                <Copy size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-zinc-400 mb-1">
                                        <Users size={14} />
                                        <span className="text-xs uppercase tracking-wider">Active</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{activeCount}</p>
                                </div>

                                <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-zinc-400 mb-1">
                                        <Clock size={14} />
                                        <span className="text-xs uppercase tracking-wider">Submitted</span>
                                    </div>
                                    <p className="text-2xl font-bold text-green-400">{submittedCount}</p>
                                </div>
                            </div>

                            {/* Test Details */}
                            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5">
                                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <Settings size={16} className="text-zinc-400" />
                                    Test Details
                                </h2>

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Duration</span>
                                        <span className="text-white">{test.duration ? `${test.duration} minutes` : "No limit"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Files</span>
                                        <span className="text-white">{test.files?.length || 0} files</span>
                                    </div>
                                    {test.description && (
                                        <div className="pt-3 border-t border-white/5">
                                            <span className="text-zinc-400 block mb-1">Description</span>
                                            <p className="text-zinc-300 text-xs">{test.description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Panel>

                    <PanelResizeHandle className="w-1 bg-white/5 hover:bg-blue-500/50 transition-colors cursor-col-resize" />

                    {/* Right - Participants */}
                    <Panel defaultSize={65} minSize={40}>
                        <ParticipantsList />
                    </Panel>
                </PanelGroup>
            </div>
        </div>
    );
};

export default function ManageTestPage() {
    const { testId } = useParams();
    const router = useRouter();
    const [test, setTest] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTest = async () => {
            try {
                // Verify user is logged in
                if (!auth.currentUser) {
                    router.push("/login");
                    return;
                }

                const testRef = doc(db, "tests", testId);
                const testSnap = await getDoc(testRef);

                if (testSnap.exists()) {
                    const testData = { id: testSnap.id, ...testSnap.data() };

                    // Verify ownership
                    if (testData.createdBy !== auth.currentUser.uid) {
                        setError("You don't have permission to manage this test");
                        return;
                    }

                    setTest(testData);
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
    }, [testId, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <TestProvider testId={testId}>
            <ManageContent test={test} onUpdate={setTest} />
        </TestProvider>
    );
}
