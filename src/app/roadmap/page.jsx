"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { roadmaps } from "./data";
import Link from "next/link";

const RoadmapPage = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white">
            <Header />

            {/* Background Grid */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-24">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-900 dark:text-zinc-400 mb-6 backdrop-blur-sm">
                        Learning Paths
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold text-zinc-900 dark:text-white mb-4 tracking-tight">
                        Developer Roadmaps
                    </h1>

                    <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                        Structured learning paths to help you master programming languages and technologies.
                    </p>
                </div>

                {/* Roadmaps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {roadmaps.map((roadmap) => (
                        <Link
                            key={roadmap.slug}
                            href={`/roadmap/${roadmap.slug}`}
                            className="group"
                        >
                            <div className="relative p-8 rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-white/20 hover:shadow-sm transition-all duration-200">

                                <div className="relative">
                                    {/* Content */}
                                    <div>
                                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
                                            {roadmap.title}
                                        </h3>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                            {roadmap.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default RoadmapPage;
