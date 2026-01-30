"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Flame,
    Target,
    TrendingUp,
    Upload,
    Link as LinkIcon,
    FileText,
    CheckCircle2,
    BrainCircuit,
    ChevronRight,
    Zap,
    Layout,
    BarChart3,
    Search,
    ArrowRight,
    Loader2,
    X,
    LayoutGrid
} from 'lucide-react'; // Added LayoutGrid here
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// --- Components ---

const IngestionWizard = ({ onComplete }) => {
    const [mode, setMode] = useState(null); // 'link' | 'pdf'
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [processingStep, setProcessingStep] = useState("");

    const simulateProcessing = () => {
        setIsProcessing(true);
        const steps = [
            "Parsing content structure...",
            "Identifying problem patterns...",
            "Mapping dependencies...",
            "Calculating complexity scores...",
            "Orchestrating learning path..."
        ];

        let currentStep = 0;

        const interval = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + 2; // Slow increment
                if (newProgress >= 100) {
                    clearInterval(interval);
                    setTimeout(onComplete, 500);
                    return 100;
                }

                // Update text based on progress chunks
                const stepIndex = Math.floor((newProgress / 100) * steps.length);
                if (stepIndex !== currentStep && stepIndex < steps.length) {
                    setProcessingStep(steps[stepIndex]);
                    currentStep = stepIndex;
                }

                return newProgress;
            });
        }, 50);
    };

    const handleLinkSubmit = (e) => {
        e.preventDefault();
        simulateProcessing();
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            simulateProcessing();
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
                {!isProcessing ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-8"
                    >
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                                Import Learning Targets
                            </h2>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                Transform static problem lists into an adaptive, intelligence-driven workflow.
                                Paste a URL or upload a PDF to begin.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Link Option */}
                            <div
                                onClick={() => setMode('link')}
                                className={`
                   cursor-pointer relative p-6 rounded-xl border transition-all duration-300 group
                   ${mode === 'link'
                                        ? 'bg-primary/10 border-primary shadow-[0_0_30px_-10px_rgba(59,130,246,0.5)]'
                                        : 'bg-zinc-900/50 border-white/10 hover:border-white/20 hover:bg-zinc-900'
                                    }
                 `}
                            >
                                <div className="mb-4 w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                    <LinkIcon size={24} />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Structure form URL</h3>
                                <p className="text-xs text-muted-foreground">LeetCode Lists, GFG Collections, or Public Sheets.</p>
                            </div>

                            {/* PDF Option */}
                            <div
                                onClick={() => setMode('pdf')}
                                className={`
                   cursor-pointer relative p-6 rounded-xl border transition-all duration-300 group
                   ${mode === 'pdf'
                                        ? 'bg-primary/10 border-primary shadow-[0_0_30px_-10px_rgba(59,130,246,0.5)]'
                                        : 'bg-zinc-900/50 border-white/10 hover:border-white/20 hover:bg-zinc-900'
                                    }
                 `}
                            >
                                <div className="mb-4 w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                    <FileText size={24} />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Parse Document</h3>
                                <p className="text-xs text-muted-foreground">PDF, Excel, or CSV files containing problem sets.</p>
                            </div>
                        </div>

                        {/* Interaction Area */}
                        <div className="min-h-[100px] flex items-center justify-center">
                            {mode === 'link' && (
                                <motion.form
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onSubmit={handleLinkSubmit}
                                    className="w-full flex gap-3"
                                >
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                        <Input
                                            placeholder="Paste list URL (e.g. leetcode.com/list/...)"
                                            className="pl-9 bg-zinc-900/50 border-white/10"
                                            autoFocus
                                        />
                                    </div>
                                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                        Analyze <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </motion.form>
                            )}

                            {mode === 'pdf' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full"
                                >
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                            <p className="text-sm text-muted-foreground"><span className="font-semibold text-white">Click to upload</span> or drag and drop</p>
                                        </div>
                                        <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.csv,.xlsx" />
                                    </label>
                                </motion.div>
                            )}
                        </div>

                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-12 space-y-8"
                    >
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                            <BrainCircuit className="w-12 h-12 text-white animate-pulse" />
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-medium animate-pulse">{processingStep}</h3>
                            <p className="text-muted-foreground font-mono text-sm">{progress}% Complete</p>
                        </div>

                        <div className="w-full max-w-sm bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <motion.div
                                className="bg-primary h-full rounded-full shadow-[0_0_20px_rgba(59,130,246,0.8)]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const DashboardView = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="space-y-8"
    >
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start z-10">
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Current Streak</span>
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                </div>
                <div className="text-2xl font-bold z-10 text-white">1 Days</div>
                <div className="text-xs text-orange-400 z-10 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Just started
                </div>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start z-10">
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Readiness</span>
                    <Target className="w-4 h-4 text-green-500" />
                </div>
                <div className="text-2xl font-bold z-10 text-white">42%</div>
                <div className="text-xs text-zinc-500 z-10">Based on topic coverage</div>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start z-10">
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Efficiency</span>
                    <Zap className="w-4 h-4 text-purple-500 fill-purple-500" />
                </div>
                <div className="text-2xl font-bold z-10 text-white">Top 5%</div>
                <div className="text-xs text-purple-400 z-10">Better than average</div>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start z-10">
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Focus Time</span>
                    <Layout className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold z-10 text-white">2.5h</div>
                <div className="text-xs text-blue-400 z-10">Today</div>
            </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left Col: Orchestration */}
            <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-primary" />
                        Recommended Path
                    </h3>
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">View Full Graph</Button>
                </div>

                <div className="space-y-4">
                    {[
                        {
                            title: "Binary Tree Traversal",
                            desc: "Master BFS and DFS core concepts",
                            tags: ["Trees", "Recursion"],
                            difficulty: "Medium",
                            eta: "20m"
                        },
                        {
                            title: "Matrix Manipulation",
                            desc: "Grid navigation and 2D arrays",
                            tags: ["Arrays", "Matrix"],
                            difficulty: "Hard",
                            eta: "45m"
                        },
                        {
                            title: "Dynamic Programming Base",
                            desc: "Memoization patterns introduction",
                            tags: ["DP", "Optimization"],
                            difficulty: "Hard",
                            eta: "30m"
                        }
                    ].map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group p-5 bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 rounded-xl cursor-pointer hover:border-primary/50 transition-all active:scale-[0.99]"
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-semibold text-white text-lg group-hover:text-primary transition-colors">{item.title}</h4>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.difficulty === 'Hard' ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'
                                            }`}>{item.difficulty}</span>
                                    </div>
                                    <p className="text-sm text-zinc-400">{item.desc}</p>
                                    <div className="flex gap-2 mt-2">
                                        {item.tags.map(t => (
                                            <span key={t} className="text-xs text-zinc-500">#{t}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <Button size="icon" className="w-8 h-8 rounded-full bg-white/5 hover:bg-primary hover:text-white transition-all">
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                    <span className="text-xs text-muted-foreground">{item.eta}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Right Col: Skill Topology */}
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-xl min-h-[400px] relative overflow-hidden">
                    <div className="absolute top-4 left-4 z-10">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <LayoutGrid className="w-4 h-4 text-blue-500" />
                            Knowledge Graph
                        </h3>
                    </div>

                    {/* Decorative Graph Nodes */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-full h-full">
                            <motion.div
                                animate={{
                                    y: [0, -10, 0],
                                    opacity: [0.5, 1, 0.5]
                                }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-primary/20 rounded-full blur-3xl"
                            />
                            {/* Mock Nodes */}
                            <div className="absolute top-[40%] left-[30%] w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white]"></div>
                            <div className="absolute top-[30%] left-[60%] w-2 h-2 bg-zinc-500 rounded-full"></div>
                            <div className="absolute top-[60%] left-[60%] w-2 h-2 bg-zinc-500 rounded-full"></div>
                            <div className="absolute top-[50%] left-[70%] w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_blue]"></div>

                            {/* Lines (SVG) */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                                <line x1="30%" y1="40%" x2="60%" y2="30%" stroke="white" strokeWidth="1" />
                                <line x1="30%" y1="40%" x2="60%" y2="60%" stroke="white" strokeWidth="1" />
                                <line x1="60%" y1="30%" x2="70%" y2="50%" stroke="white" strokeWidth="1" />
                                <line x1="60%" y1="60%" x2="70%" y2="50%" stroke="white" strokeWidth="1" />
                            </svg>
                        </div>
                    </div>

                    <div className="absolute bottom-4 left-0 w-full text-center text-xs text-muted-foreground/50">
                        Interactive Node Map
                    </div>
                </div>

                <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-xl">
                    <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Topics requiring attention</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white">Graphs (DFS)</span>
                            <span className="text-red-400 font-mono">32%</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 w-[32%]"></div>
                        </div>

                        <div className="flex justify-between items-center text-sm mt-4">
                            <span className="text-white">Heaps</span>
                            <span className="text-yellow-400 font-mono">58%</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500 w-[58%]"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </motion.div>
);

export default function DSADashboard() {
    const [hasData, setHasData] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[128px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">

                {/* Header - Always Visible */}
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2">
                            DSA Mastery
                        </h1>
                        <p className="text-muted-foreground">
                            {hasData ? "Your adaptive learning path is active." : "Initialize your intelligent learning engine."}
                        </p>
                    </div>
                    {hasData && (
                        <Button variant="outline" onClick={() => setHasData(false)} className="hidden sm:flex border-white/10 hover:bg-zinc-800">
                            <Upload className="w-4 h-4 mr-2" /> Import New Sheet
                        </Button>
                    )}
                </div>

                {/* Content Switcher */}
                <AnimatePresence mode="wait">
                    {!hasData ? (
                        <IngestionWizard key="wizard" onComplete={() => setHasData(true)} />
                    ) : (
                        <DashboardView key="dashboard" />
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}
