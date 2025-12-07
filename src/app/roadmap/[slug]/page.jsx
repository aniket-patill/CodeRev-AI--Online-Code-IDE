"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { roadmaps } from "../data";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const RoadmapDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const [roadmap, setRoadmap] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pdfError, setPdfError] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(true);

    useEffect(() => {
        if (params.slug) {
            const found = roadmaps.find((r) => r.slug === params.slug);
            if (found) {
                setRoadmap(found);
            } else {
                router.push("/roadmap");
                toast.error("Roadmap not found");
            }
            setLoading(false);
        }
    }, [params.slug, router]);

    useEffect(() => {
        // Reset PDF state when roadmap changes
        setPdfError(false);
        setPdfLoading(true);

        // Set a timeout to detect if PDF doesn't load
        const timer = setTimeout(() => {
            setPdfLoading(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, [roadmap]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

    if (!roadmap) return null;

    return (
        <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white flex flex-col h-screen overflow-hidden">
            <Header />

            <main className="flex-1 flex flex-col relative z-10 w-full h-full">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-6 py-5 bg-white/50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-white/5 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/roadmap"
                            className="px-3 py-2 -ml-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all duration-300 text-sm font-medium"
                        >
                            ← Back
                        </Link>

                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-bold text-zinc-900 dark:text-white">{roadmap.title}</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <a
                            href={roadmap.pdf}
                            download
                            className="px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 shadow-lg shadow-zinc-900/10 dark:shadow-white/10"
                        >
                            Download PDF
                        </a>
                    </div>
                </div>

                {/* PDF Viewer */}
                <div className="flex-1 relative bg-zinc-50 dark:bg-zinc-900/40 w-full h-full overflow-hidden"
                >
                    {/* Mobile Overlay Hint */}
                    <div className="md:hidden absolute inset-x-0 top-0 bg-yellow-50 dark:bg-yellow-500/10 border-b border-yellow-200 dark:border-yellow-500/20 p-2 text-center z-10">
                        <p className="text-xs text-yellow-800 dark:text-yellow-200 flex items-center justify-center gap-2">
                            <AlertCircle size={12} />
                            Best viewed on desktop
                        </p>
                    </div>

                    {/* Loading State */}
                    {pdfLoading && !pdfError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm z-20">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                                <p className="text-white text-sm">Loading PDF...</p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {pdfError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/90 backdrop-blur-sm z-20 p-8">
                            <div className="text-center max-w-md">
                                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">Unable to Display PDF</h3>
                                <p className="text-zinc-400 mb-6 text-sm">
                                    The PDF viewer couldn't load this file. This may be due to browser restrictions or file corruption.
                                </p>
                                <a
                                    href={roadmap.pdf}
                                    download
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black hover:bg-zinc-200 rounded-lg font-semibold transition-colors"
                                >
                                    <Download size={18} />
                                    Download PDF Instead
                                </a>
                            </div>
                        </div>
                    )}

                    <object
                        data={roadmap.pdf}
                        type="application/pdf"
                        className="w-full h-full"
                        title={`${roadmap.title} Roadmap`}
                        onLoad={() => {
                            setPdfLoading(false);
                            setPdfError(false);
                        }}
                        onError={() => {
                            setPdfLoading(false);
                            setPdfError(true);
                        }}
                    >
                        <div className="flex items-center justify-center h-full bg-zinc-900/90 p-8">
                            <div className="text-center max-w-md">
                                <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">PDF Viewer Not Available</h3>
                                <p className="text-zinc-400 mb-6 text-sm">
                                    Your browser doesn't support embedded PDFs. Please download the file to view it.
                                </p>
                                <a
                                    href={roadmap.pdf}
                                    download
                                    className="px-6 py-3 bg-white text-black hover:bg-zinc-200 rounded-lg font-semibold transition-colors inline-block"
                                >
                                    Download PDF
                                </a>
                            </div>
                        </div>
                    </object>
                </div>
            </main>
        </div>
    );
};

export default RoadmapDetailPage;
