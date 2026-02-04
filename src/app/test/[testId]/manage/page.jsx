"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "@/config/firebase";
import { Loader2, ArrowLeft, Copy, Play, Square, Link2, Users, Clock, Settings, Trash2, Trophy, Send } from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { toast } from "sonner";

import { TestProvider, useTest } from "@/context/TestContext";
import { Button } from "@/components/ui/button";
import ParticipantsList from "@/components/test/ParticipantsList";
import StudentCodeViewer from "@/components/test/StudentCodeViewer";

const ManageContent = ({ test, onUpdate }) => {
    const router = useRouter();
    const { participants, deleteTest } = useTest();
    const [isStarting, setIsStarting] = useState(false);
    const [isEnding, setIsEnding] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    // Use ID for state so we can derive the fresh object from context
    const [selectedParticipantId, setSelectedParticipantId] = useState(null);

    // Derived state - ensures deep updates (like code changes) are reflected immediately
    const selectedParticipant = participants.find(p => p.id === selectedParticipantId) || null;

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

    const publishResults = async () => {
        if (!window.confirm("Are you sure you want to publish results? Students will be notified and can view their scores.")) {
            return;
        }
        
        setIsPublishing(true);
        try {
            const testRef = doc(db, "tests", test.id);
            await updateDoc(testRef, {
                status: "results_published",
                resultsPublishedAt: Timestamp.now(),
            });
            onUpdate({ ...test, status: "results_published" });
            toast.success("Results published! Students will be notified.");
        } catch (err) {
            console.error("Failed to publish results:", err);
            toast.error("Failed to publish results");
        } finally {
            setIsPublishing(false);
        }
    };

    const deleteCurrentTest = async () => {
        if (!window.confirm("Are you sure you want to delete this test? This action cannot be undone and will remove all participant data.")) {
            return;
        }

        setIsDeleting(true);
        try {
            await deleteTest();
            toast.success("Test deleted successfully!");
            router.push("/dashboard");
        } catch (error) {
            console.error("Error deleting test:", error);
            toast.error("Failed to delete test");
        } finally {
            setIsDeleting(false);
        }
    };

    // Calculate leaderboard - include any participant with score or testcases data
    const leaderboard = participants
        .filter(p => p.score !== undefined || p.testcasesPassed !== undefined || p.grade)
        .sort((a, b) => {
            // Sort by testcases passed first (descending)
            const aTestcases = a.testcasesPassed || 0;
            const bTestcases = b.testcasesPassed || 0;
            if (bTestcases !== aTestcases) return bTestcases - aTestcases;
            
            // Then by score (descending)
            const aScore = a.score || 0;
            const bScore = b.score || 0;
            if (bScore !== aScore) return bScore - aScore;
            
            // Then by time taken (ascending)
            return (a.timeTaken || 0) - (b.timeTaken || 0);
        })
        .map((p, idx) => ({ ...p, rank: idx + 1 }));

    const getStatusColor = (status) => {
        switch (status) {
            case "active": return "bg-green-500/20 text-green-400 border-green-500/30";
            case "ended": return "bg-red-500/20 text-red-400 border-red-500/30";
            case "results_published": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
            default: return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
        }
    };

    const activeCount = participants.filter(p => p.status === "active").length;
    const submittedCount = participants.filter(p => p.status === "submitted").length;

    return (
        <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
            {/* Header */}
            <header className="h-16 px-6 flex items-center justify-between bg-zinc-900/80 backdrop-blur-xl border-b border-white/5 shrink-0">
                {/* ... header content ... */}
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
                    {/* ... header buttons ... */}
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

                    {test.status === "ended" && (
                        <>
                            <Button
                                onClick={publishResults}
                                disabled={isPublishing}
                                className="bg-purple-600 hover:bg-purple-500 text-white h-9 px-4"
                            >
                                {isPublishing ? (
                                    <Loader2 size={16} className="mr-2 animate-spin" />
                                ) : (
                                    <Send size={16} className="mr-2" />
                                )}
                                Publish Results
                            </Button>
                            <Button
                                onClick={() => setShowLeaderboard(!showLeaderboard)}
                                variant="outline"
                                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 h-9 px-4"
                            >
                                <Trophy size={16} className="mr-2" />
                                {showLeaderboard ? "Hide Leaderboard" : "View Leaderboard"}
                            </Button>
                        </>
                    )}

                    {test.status === "results_published" && (
                        <Button
                            onClick={() => setShowLeaderboard(!showLeaderboard)}
                            variant="outline"
                            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 h-9 px-4"
                        >
                            <Trophy size={16} className="mr-2" />
                            {showLeaderboard ? "Hide Leaderboard" : "View Leaderboard"}
                        </Button>
                    )}

                    {(test.status === "ended" || test.status === "draft" || test.status === "results_published") && (
                        <Button
                            onClick={deleteCurrentTest}
                            disabled={isDeleting}
                            variant="destructive"
                            className="bg-red-600/20 hover:bg-red-600/30 text-red-400 h-9 px-4 border border-red-600/30"
                        >
                            {isDeleting ? (
                                <Loader2 size={16} className="mr-2 animate-spin" />
                            ) : (
                                <Trash2 size={16} className="mr-2" />
                            )}
                            Delete Test
                        </Button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                <PanelGroup direction="horizontal">
                    {/* Left - Content (Test Info or Student Code) */}
                    <Panel defaultSize={75} minSize={40}>
                        {selectedParticipant ? (
                            <StudentCodeViewer
                                participant={selectedParticipant}
                                test={test}
                                onClose={() => setSelectedParticipantId(null)}
                            />
                        ) : showLeaderboard ? (
                            /* Leaderboard View */
                            <div className="h-full overflow-y-auto p-6 space-y-6">
                                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5">
                                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <Trophy size={20} className="text-yellow-400" />
                                        Leaderboard
                                    </h2>
                                    
                                    {leaderboard.length === 0 ? (
                                        <div className="text-center py-8 text-zinc-500">
                                            <Trophy size={40} className="mx-auto mb-3 opacity-30" />
                                            <p>No submissions yet</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="text-xs text-zinc-500 uppercase tracking-wider border-b border-white/10">
                                                        <th className="text-left px-3 py-3 w-16">Rank</th>
                                                        <th className="text-left px-3 py-3">Student</th>
                                                        <th className="text-center px-3 py-3 w-20">Tests</th>
                                                        <th className="text-center px-3 py-3 w-20">Score</th>
                                                        <th className="text-center px-3 py-3 w-20">AI</th>
                                                        <th className="text-right px-3 py-3 w-16">Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {leaderboard.map((entry) => (
                                                        <tr 
                                                            key={entry.id}
                                                            className={`cursor-pointer transition-colors hover:bg-zinc-800/50 ${
                                                                entry.rank === 1 ? 'bg-yellow-500/10' :
                                                                entry.rank === 2 ? 'bg-zinc-400/5' :
                                                                entry.rank === 3 ? 'bg-orange-500/10' :
                                                                ''
                                                            }`}
                                                            onClick={() => setSelectedParticipantId(entry.id)}
                                                        >
                                                            <td className={`px-3 py-3 text-lg font-bold ${
                                                                entry.rank === 1 ? 'text-yellow-400' :
                                                                entry.rank === 2 ? 'text-zinc-300' :
                                                                entry.rank === 3 ? 'text-orange-400' :
                                                                'text-zinc-500'
                                                            }`}>
                                                                #{entry.rank}
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-white font-medium">{entry.name}</span>
                                                                    {entry.grade && (
                                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                                                            entry.grade === 'passed' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                                        }`}>
                                                                            {entry.grade}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3 text-center text-blue-400 font-mono text-sm">
                                                                {entry.testcasesPassed ?? 0}/{entry.totalTestcases ?? '?'}
                                                            </td>
                                                            <td className="px-3 py-3 text-center text-green-400 font-mono font-bold">
                                                                {entry.score || 0}
                                                            </td>
                                                            <td className="px-3 py-3 text-center text-purple-400 font-mono text-sm">
                                                                {entry.aiScore || '-'}
                                                            </td>
                                                            <td className="px-3 py-3 text-right text-zinc-400 text-sm">
                                                                {entry.timeTaken ? `${Math.floor(entry.timeTaken / 60)}m` : '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Stats Summary */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 text-center">
                                        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total Submissions</div>
                                        <p className="text-2xl font-bold text-white">{leaderboard.length}</p>
                                    </div>
                                    <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 text-center">
                                        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Avg Score</div>
                                        <p className="text-2xl font-bold text-green-400">
                                            {leaderboard.length > 0 
                                                ? Math.round(leaderboard.reduce((sum, e) => sum + (e.score || 0), 0) / leaderboard.length)
                                                : 0}
                                        </p>
                                    </div>
                                    <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 text-center">
                                        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Highest Score</div>
                                        <p className="text-2xl font-bold text-yellow-400">
                                            {leaderboard.length > 0 ? leaderboard[0].score || 0 : 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
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
                                                Test Code
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    value={test.id}
                                                    readOnly
                                                    className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 font-mono"
                                                />
                                                <Button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(test.id);
                                                        toast.success("Test code copied!");
                                                    }}
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
                        )}
                    </Panel>

                    <PanelResizeHandle className="w-1 bg-white/5 hover:bg-blue-500/50 transition-colors cursor-col-resize" />

                    {/* Right - Participants List */}
                    <Panel defaultSize={25} minSize={20} maxSize={40}>
                        <ParticipantsList
                            onSelect={(p) => setSelectedParticipantId(p.id)}
                            selectedId={selectedParticipantId}
                        />
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
