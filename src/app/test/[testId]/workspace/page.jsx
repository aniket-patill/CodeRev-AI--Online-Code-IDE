"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Loader2 } from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { TestProvider, useTest } from "@/context/TestContext";
import { ProctorProvider, useProctor } from "@/context/ProctorContext";
import TestHeader from "@/components/test/TestHeader";
import TestEditor from "@/components/test/TestEditor";
import TestOutput from "@/components/test/TestOutput";
import ProctorWarningModal from "@/components/test/ProctorWarningModal";
import ProctorStartScreen from "@/components/test/ProctorStartScreen";

const TestWorkspaceContent = ({ test }) => {
    const router = useRouter();
    const { testId } = useParams();
    const { submitTest, leaveTest, updateCode, currentParticipant, getCurrentParticipantFiles, getCurrentParticipantQuestions } = useTest();
    const { isProctorActive, stopProctoring } = useProctor();

    const [activeFileIndex, setActiveFileIndex] = useState(0);
    const [currentCode, setCurrentCode] = useState("");
    const [hasStarted, setHasStarted] = useState(false);
    const [questionProgress, setQuestionProgress] = useState({}); // Track progress for each question
    const [isDirty, setIsDirty] = useState(false);
    const saveTimeoutRef = useRef(null);

    const files = getCurrentParticipantFiles();
    const questions = getCurrentParticipantQuestions();
    const activeFile = files[activeFileIndex];

    // Safe save function
    const saveCurrentCode = async (file, code) => {
        if (!file || !code) return;
        try {
            await updateCode(file.name, code);
        } catch (error) {
            console.error("Failed to save code:", error);
        }
    };

    // Debounced save
    const debouncedSave = (file, code) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            saveCurrentCode(file, code);
        }, 1000);
    };

    // Track current code for running
    useEffect(() => {
        // If user has unsaved changes (isDirty), do not overwrite with remote data
        // This prevents race conditions where typing is overwritten by slightly older server data
        if (isDirty) return;

        if (currentParticipant?.files?.[activeFile?.name]) {
            setCurrentCode(currentParticipant.files[activeFile.name]);
        } else if (activeFile?.content) {
            setCurrentCode(activeFile.content);
        }
    }, [activeFile, currentParticipant, isDirty]);

    const handleSwitchFile = async (index) => {
        if (index === activeFileIndex) return;

        // Force save current file before switching
        if (activeFile && currentCode && isDirty) {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            await saveCurrentCode(activeFile, currentCode);
        }

        setIsDirty(false); // Reset dirty state for the new file
        setActiveFileIndex(index);
    };

    const handleSubmit = async () => {
        // Stop proctoring first to avoid "fullscreen exit" violation
        stopProctoring();

        // Save final changes
        if (activeFile && currentCode && isDirty) {
            await saveCurrentCode(activeFile, currentCode);
        }
        await submitTest();
        // Exit fullscreen before redirect
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        }
        router.push(`/test/${testId}/submitted`);
    };

    const handleLeave = async () => {
        stopProctoring();

        // Save current changes
        if (activeFile && currentCode && isDirty) {
            await saveCurrentCode(activeFile, currentCode);
        }
        await leaveTest();
        // Exit fullscreen before redirect
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        }
        router.push("/");
    };

    const handleCodeChange = (code) => {
        setCurrentCode(code);
        setIsDirty(true);

        // Auto-save
        if (activeFile) {
            debouncedSave(activeFile, code);
        }

        // Update question progress when code changes
        if (activeFile) {
            const currentQuestion = questions[activeFileIndex];
            if (currentQuestion) {
                setQuestionProgress(prev => ({
                    ...prev,
                    [currentQuestion.id || activeFileIndex]: {
                        completed: (typeof code === 'string' ? code.trim() : "") !== '',
                        lastEdited: new Date().toISOString(),
                        codeLength: code ? code.length : 0
                    }
                }));
            }
        }
    };

    const handleAutoSubmit = async (reason) => {
        console.warn("[PROCTOR] Auto-submit triggered:", reason);
        await submitTest();
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        }
        router.push(`/test/${testId}/submitted?auto=true`);
    };

    // Watch for test ending or status changes
    useEffect(() => {
        if (test?.status === "ended") {
            handleAutoSubmit("Test ended by organizer");
        }
    }, [test?.status]);

    // Show proctor start screen if not started
    if (!hasStarted) {
        return (
            <ProctorStartScreen
                testTitle={test?.title}
                testStatus={test?.status}
                onStart={() => setHasStarted(true)}
            />
        );
    }

    return (
        <>
            {/* Proctor Warning Modal */}
            <ProctorWarningModal />

            <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
                {/* Header */}
                <TestHeader
                    testTitle={test?.title}
                    onSubmit={handleSubmit}
                    onLeave={handleLeave}
                />

                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Questions Horizontal Bar */}
                    <div className="h-16 bg-zinc-900 border-b border-white/5 flex items-center px-4 gap-2 shrink-0 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-2 pr-4 border-r border-white/5 mr-2 shrink-0">
                            <div className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-xs font-bold whitespace-nowrap">
                                Assigned Questions
                            </div>
                            <span className="text-xs text-zinc-500 whitespace-nowrap">
                                {questions.length} total
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {questions.map((question, index) => {
                                // Calculate status based on code submission for this question
                                const hasCode = Object.keys(currentParticipant?.files || {}).some(
                                    fileName => {
                                        const fileContent = currentParticipant.files[fileName];
                                        return typeof fileContent === 'string' && fileContent.trim() !== '';
                                    }
                                );

                                // Get progress status for this question
                                const questionId = question.id || index;
                                const progress = questionProgress[questionId];

                                let statusColor = "bg-zinc-800 text-zinc-400 border-zinc-700"; // Default
                                if (progress?.completed) {
                                    statusColor = "bg-green-500/10 text-green-400 border-green-500/20"; // Completed
                                } else if (activeFileIndex === index) {
                                    statusColor = "bg-blue-500 text-white border-blue-600"; // Active
                                }

                                return (
                                    <button
                                        key={question.id || index}
                                        onClick={() => handleSwitchFile(index)}
                                        className={`
                                            flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all
                                            whitespace-nowrap
                                            ${statusColor}
                                            ${activeFileIndex === index ? 'shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'hover:bg-zinc-800 hover:text-zinc-200'}
                                        `}
                                    >
                                        <span className="opacity-70 text-[10px] uppercase tracking-wider">Q{index + 1}</span>
                                        <span className="max-w-[150px] truncate">{question.title || `Question ${index + 1}`}</span>
                                        <span className="text-[10px] opacity-60 ml-1">({question.points}pts)</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 overflow-hidden relative">
                        <PanelGroup direction="horizontal">
                            {/* Question Description Panel (Left) */}
                            <Panel defaultSize={30} minSize={20} maxSize={50}>
                                <div className="h-full bg-zinc-900/50 flex flex-col border-r border-white/5">
                                    <div className="p-4 border-b border-white/5 bg-zinc-900/80">
                                        <h3 className="text-lg font-bold text-white mb-1">
                                            {questions[activeFileIndex]?.title || `Question ${activeFileIndex + 1}`}
                                        </h3>
                                        <div className="flex gap-2 text-xs text-zinc-500">
                                            <span className="px-2 py-0.5 rounded bg-zinc-800 border border-white/5">
                                                {questions[activeFileIndex]?.points || 0} Points
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4">
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                                {questions[activeFileIndex]?.description || "No description provided."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Panel>

                            <PanelResizeHandle className="w-1 bg-zinc-900 border-x border-white/5 hover:bg-blue-500/50 transition-colors cursor-col-resize flex flex-col justify-center items-center group z-10">
                                <div className="h-8 w-1 bg-zinc-700 rounded-full group-hover:bg-blue-400 transition-colors" />
                            </PanelResizeHandle>

                            {/* Editor & Output Side (Right) */}
                            <Panel defaultSize={70} minSize={30}>
                                <PanelGroup direction="vertical">
                                    {/* Editor Panel */}
                                    <Panel defaultSize={70} minSize={30}>
                                        <div className="h-full flex flex-col">
                                            {/* File Tabs - moved inside Right Panel */}
                                            <div className="flex items-center gap-1 px-4 py-2 bg-zinc-900/80 border-b border-white/5 shrink-0 overflow-x-auto no-scrollbar">
                                                {files.map((file, index) => (
                                                    <button
                                                        key={file.name}
                                                        onClick={() => handleSwitchFile(index)}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-2 ${index === activeFileIndex
                                                            ? "bg-zinc-800 text-white border border-white/10"
                                                            : "text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent"
                                                            }`}
                                                    >
                                                        <span>{file.name}</span>
                                                        {file.readOnly && (
                                                            <span className="text-[10px] text-yellow-500/80 uppercase tracking-wider font-bold">
                                                                RO
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex-1 relative">
                                                {activeFile && (
                                                    <TestEditor
                                                        file={activeFile}
                                                        language={activeFile.language || "javascript"}
                                                        readOnly={activeFile.readOnly}
                                                        onChange={handleCodeChange}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </Panel>

                                    <PanelResizeHandle className="h-1 bg-zinc-900 border-y border-white/5 hover:bg-blue-500/50 transition-colors cursor-row-resize flex justify-center items-center group z-10">
                                        <div className="w-8 h-1 bg-zinc-700 rounded-full group-hover:bg-blue-400 transition-colors" />
                                    </PanelResizeHandle>

                                    {/* Output Panel */}
                                    <Panel defaultSize={30} minSize={10}>
                                        <TestOutput
                                            code={currentCode}
                                            language={activeFile?.language || "javascript"}
                                        />
                                    </Panel>
                                </PanelGroup>
                            </Panel>
                        </PanelGroup>
                    </div>
                </div>
            </div>
        </>
    );
};

const ProctorWrapper = ({ test, participantId, testId }) => {
    const router = useRouter();
    const { submitTest } = useTest();

    const handleAutoSubmit = async (reason) => {
        console.warn("[PROCTOR] Auto-submit triggered:", reason);
        await submitTest();
        if (document.fullscreenElement) {
            try {
                await document.exitFullscreen();
            } catch (e) { }
        }
        router.push(`/test/${testId}/submitted?auto=true`);
    };

    return (
        <ProctorProvider onAutoSubmit={handleAutoSubmit} enabled={true}>
            <TestWorkspaceContent test={test} />
        </ProctorProvider>
    );
};

const TestWrapper = () => {
    const { testId } = useParams();
    const router = useRouter();
    const { test, isLoading, error } = useTest();
    const [participantId, setParticipantId] = useState(null);

    useEffect(() => {
        const storedParticipantId = sessionStorage.getItem(`test_participant_${testId}`);
        if (!storedParticipantId) {
            router.push(`/test/${testId}`);
            return;
        }
        setParticipantId(storedParticipantId);
    }, [testId, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex items-center gap-3 text-zinc-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading test workspace...</span>
                </div>
            </div>
        );
    }

    if (error || !test) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error || "Test not found"}</p>
                    <button
                        onClick={() => router.push("/")}
                        className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return <ProctorWrapper test={test} participantId={participantId} testId={testId} />;
};

export default function TestWorkspacePage() {
    const { testId } = useParams();

    const [participantId, setParticipantId] = useState(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const id = sessionStorage.getItem(`test_participant_${testId}`);
            if (id) setParticipantId(id);
        }
    }, [testId]);

    if (!participantId) return null; // Will redirect in inner component if missing

    return (
        <TestProvider testId={testId} participantId={participantId}>
            <TestWrapper />
        </TestProvider>
    );
}
