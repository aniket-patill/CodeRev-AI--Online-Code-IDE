"use client";

import { useEffect, useState } from "react";
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
    const { submitTest, leaveTest, currentParticipant } = useTest();
    const { isProctorActive } = useProctor();

    const [activeFileIndex, setActiveFileIndex] = useState(0);
    const [currentCode, setCurrentCode] = useState("");
    const [hasStarted, setHasStarted] = useState(false);

    const files = test?.files || [];
    const activeFile = files[activeFileIndex];

    // Track current code for running
    useEffect(() => {
        if (currentParticipant?.files?.[activeFile?.name]) {
            setCurrentCode(currentParticipant.files[activeFile.name]);
        } else if (activeFile?.content) {
            setCurrentCode(activeFile.content);
        }
    }, [activeFile, currentParticipant]);

    const handleSubmit = async () => {
        await submitTest();
        // Exit fullscreen before redirect
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        }
        router.push(`/test/${testId}/submitted`);
    };

    const handleLeave = async () => {
        await leaveTest();
        // Exit fullscreen before redirect
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        }
        router.push("/");
    };

    const handleCodeChange = (code) => {
        setCurrentCode(code);
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

                {/* File Tabs */}
                <div className="flex items-center gap-1 px-4 py-2 bg-zinc-900/50 border-b border-white/5 shrink-0">
                    {files.map((file, index) => (
                        <button
                            key={file.name}
                            onClick={() => setActiveFileIndex(index)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${index === activeFileIndex
                                ? "bg-zinc-800 text-white"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                                }`}
                        >
                            {file.name}
                            {file.readOnly && (
                                <span className="ml-2 text-[10px] text-yellow-400 uppercase">
                                    (read-only)
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-hidden">
                    <PanelGroup direction="vertical">
                        {/* Editor Panel */}
                        <Panel defaultSize={70} minSize={30}>
                            <div className="h-full">
                                {activeFile && (
                                    <TestEditor
                                        file={activeFile}
                                        language={activeFile.language || "javascript"}
                                        readOnly={activeFile.readOnly}
                                        onChange={handleCodeChange}
                                    />
                                )}
                            </div>
                        </Panel>

                        <PanelResizeHandle className="h-1 bg-white/5 hover:bg-blue-500/50 transition-colors cursor-row-resize flex justify-center items-center group">
                            <div className="w-8 h-1 bg-zinc-600 rounded-full group-hover:bg-blue-400 transition-colors" />
                        </PanelResizeHandle>

                        {/* Output Panel */}
                        <Panel defaultSize={30} minSize={15}>
                            <TestOutput
                                code={currentCode}
                                language={activeFile?.language || "javascript"}
                            />
                        </Panel>
                    </PanelGroup>
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
    // We get participantId inside the wrapper now via sessionStorage check
    // but the provider needs it. We actally neeed to get it first.
    // However, TestContext handles fetching the test.
    // The previous logic had duplicated fetching. 
    // We should use TestProvider to fetch, but TestProvider needs props.
    // Let's keep it simple: Use TestProvider to fetch, and a child component to check loading/error.

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
