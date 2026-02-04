"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    Trophy, 
    Users, 
    Clock, 
    CheckCircle2, 
    Loader2, 
    ChevronLeft, 
    Search,
    Medal
} from "lucide-react";
import { db } from "@/config/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

const ResultsPage = () => {
    const { testId } = useParams();
    const router = useRouter();
    const [test, setTest] = useState(null);
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [stats, setStats] = useState({ totalParticipants: 0, averageScore: 0, passRate: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch test details
                const testRef = doc(db, "tests", testId);
                const testSnap = await getDoc(testRef);
                if (testSnap.exists()) {
                    setTest({ id: testSnap.id, ...testSnap.data() });
                }

                // Fetch participants directly (Client Side) instead of API
                const participantsRef = collection(db, `tests/${testId}/participants`);
                const participantsSnap = await getDocs(participantsRef);
                
                const participants = [];
                participantsSnap.forEach(doc => {
                    const data = doc.data();
                    if (data.score !== undefined || data.testcasesPassed !== undefined || data.grade) {
                         participants.push({
                            userId: doc.id,
                            userName: data.name || 'Anonymous',
                            score: data.score || 0,
                            testcasesPassed: data.testcasesPassed || 0,
                            totalTestcases: data.totalTestcases || 0,
                            timeTaken: data.timeTaken || 0,
                            grade: data.grade,
                            status: data.status
                        });
                    }
                });

                // Calculate leaderboard
                const leaderboard = participants
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

                setLeaderboardData(leaderboard);

                // Calculate stats
                const total = leaderboard.length;
                const avg = total > 0 ? leaderboard.reduce((sum, p) => sum + p.score, 0) / total : 0;
                const passed = leaderboard.filter(p => p.testcasesPassed === p.totalTestcases).length; // Or use grade === 'passed'

                setStats({
                    totalParticipants: total,
                    averageScore: Math.round(avg),
                    passRate: total > 0 ? Math.round((passed / total) * 100) : 0
                });

            } catch (err) {
                console.error("Error fetching results:", err);
                setError("Failed to load results");
            } finally {
                setIsLoading(false);
            }
        };

        if (testId) fetchData();
    }, [testId]);

    const filteredLeaderboard = leaderboardData.filter(entry => 
        entry.userName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatTime = (seconds) => {
        if (!seconds) return "-";
        const mins = Math.floor(seconds / 60);
        // const secs = Math.round(seconds % 60); // Optional: show seconds
        return `${mins}m`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <p className="text-zinc-400">Loading results...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="text-center space-y-4">
                    <p className="text-red-400">{error}</p>
                    <button 
                        onClick={() => router.push("/dashboard")}
                        className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <button 
                            onClick={() => router.push("/dashboard")}
                            className="flex items-center text-zinc-400 hover:text-white mb-2 transition-colors"
                        >
                            <ChevronLeft size={16} className="mr-1" /> Back to Dashboard
                        </button>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                            {test?.title || "Test Results"}
                        </h1>
                        <p className="text-zinc-500 mt-1">Leaderboard & Performance Stats</p>
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="flex gap-4">
                        <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Users className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 uppercase font-medium">Participants</p>
                                <p className="text-xl font-bold">{stats.totalParticipants}</p>
                            </div>
                        </div>
                        <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl flex items-center gap-3">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <Trophy className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 uppercase font-medium">Avg Score</p>
                                <p className="text-xl font-bold">{stats.averageScore}</p>
                            </div>
                        </div>
                        <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <CheckCircle2 className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 uppercase font-medium">Pass Rate</p>
                                <p className="text-xl font-bold">{stats.passRate}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Leaderboard Section */}
                <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                    {/* Table Header */}
                    <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between gap-4 items-center">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Trophy className="text-yellow-500" /> Leaderboard
                        </h2>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input 
                                type="text"
                                placeholder="Search student..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500/50 placeholder:text-zinc-600"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-zinc-900/50 text-xs uppercase tracking-wider text-zinc-500">
                                <tr>
                                    <th className="px-6 py-4 font-semibold w-24 text-center">Rank</th>
                                    <th className="px-6 py-4 font-semibold">Student</th>
                                    <th className="px-6 py-4 font-semibold text-center">Score</th>
                                    <th className="px-6 py-4 font-semibold text-center">Test Cases</th>
                                    <th className="px-6 py-4 font-semibold text-right">Time Taken</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredLeaderboard.length > 0 ? (
                                    filteredLeaderboard.map((entry) => (
                                        <tr key={entry.userId} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4 text-center">
                                                {entry.rank === 1 && <Medal className="w-5 h-5 text-yellow-400 mx-auto" />}
                                                {entry.rank === 2 && <Medal className="w-5 h-5 text-gray-400 mx-auto" />}
                                                {entry.rank === 3 && <Medal className="w-5 h-5 text-amber-600 mx-auto" />}
                                                {entry.rank > 3 && <span className="font-mono text-zinc-400">#{entry.rank}</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                                                        {entry.userName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-zinc-200">{entry.userName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-indigo-400">
                                                {entry.score}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                                    entry.testcasesPassed === entry.totalTestcases 
                                                        ? "bg-green-500/10 text-green-400" 
                                                        : "bg-zinc-800 text-zinc-400"
                                                }`}>
                                                    {entry.testcasesPassed} / {entry.totalTestcases}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-sm text-zinc-400">
                                                {formatTime(entry.timeTaken)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                            No results found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultsPage;
