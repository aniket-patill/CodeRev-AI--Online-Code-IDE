"use client";

import { useState, useEffect } from "react";
import { FileCode, Play, X, Save, CheckCircle, XCircle } from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import TestEditor from "./TestEditor";
import TestOutput from "./TestOutput";
import { Button } from "@/components/ui/button";
import { useTest } from "@/context/TestContext";
import { toast } from "sonner";

const StudentCodeViewer = ({ participant, test, onClose }) => {
    const { gradeParticipant } = useTest();
    const [activeFileIndex, setActiveFileIndex] = useState(0);
    const [currentCode, setCurrentCode] = useState("");
    const [gradingLoading, setGradingLoading] = useState(false);

    // Determine which files to show (assigned or test default)
    const files = participant?.assignedFiles || test?.files || [];
    const questions = participant?.assignedQuestions || test?.questions || [];
    const activeFile = files[activeFileIndex];
    const activeQuestion = questions[activeFileIndex]; // Assuming 1:1 mapping of files to questions

    // Load initial code
    useEffect(() => {
        if (!participant || !activeFile) return;

        // Check if student has modified this file
        const studentCode = participant.files?.[activeFile.name];

        if (typeof studentCode === 'string') {
            setCurrentCode(studentCode);
        } else {
            // Fallback to original content
            setCurrentCode(activeFile.content || "");
        }
    }, [activeFile, participant]);

    const handleCodeChange = (newCode) => {
        // Teacher might want to edit to fix/test, so we allow local state update
        setCurrentCode(newCode);
    };

    const handleGrade = async (grade) => {
        setGradingLoading(true);
        try {
            await gradeParticipant(participant.id, grade);
            toast.success(`Student marked as ${grade}`);
        } catch (error) {
            toast.error("Failed to grade");
        } finally {
            setGradingLoading(false);
        }
    };

    if (!participant) return null;

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] text-white">
            {/* Header */}
            <div className="h-16 px-4 bg-zinc-900 border-b border-white/5 flex items-center justify-between shrink-0 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {participant.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-white truncate">{participant.name}</h3>
                        <p className="text-xs text-zinc-500 truncate">{participant.email || "No email"}</p>
                    </div>
                    {/* Show score if available */}
                    {participant.score !== undefined && (
                        <div className="ml-3 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-bold">
                            Score: {participant.score}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Grading Controls */}
                    <div className="flex bg-zinc-800 rounded-lg p-1 border border-white/5">
                        <Button
                            onClick={() => handleGrade("passed")}
                            size="sm"
                            variant="ghost"
                            disabled={gradingLoading}
                            className={`h-7 px-3 text-xs font-medium gap-1.5 ${participant.grade === "passed"
                                    ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300"
                                    : "text-zinc-400 hover:text-green-400 hover:bg-green-500/10"
                                }`}
                        >
                            <CheckCircle size={14} />
                            Pass
                        </Button>
                        <div className="w-px bg-white/5 mx-1" />
                        <Button
                            onClick={() => handleGrade("failed")}
                            size="sm"
                            variant="ghost"
                            disabled={gradingLoading}
                            className={`h-7 px-3 text-xs font-medium gap-1.5 ${participant.grade === "failed"
                                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300"
                                    : "text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                                }`}
                        >
                            <XCircle size={14} />
                            Fail
                        </Button>
                    </div>

                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-zinc-400 hover:text-white shrink-0">
                        <X size={18} />
                    </Button>
                </div>
            </div>

            {/* File Tabs */}
            <div className="flex items-center gap-1 px-4 py-2 bg-zinc-900/50 border-b border-white/5 shrink-0 overflow-x-auto">
                {files.map((file, index) => (
                    <button
                        key={file.name}
                        onClick={() => setActiveFileIndex(index)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${index === activeFileIndex
                            ? "bg-zinc-800 text-white border border-white/10"
                            : "text-zinc-500 hover:text-white hover:bg-zinc-800/50"
                            }`}
                    >
                        <FileCode size={14} />
                        {file.name}
                    </button>
                ))}
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-hidden relative">
                <PanelGroup direction="vertical">
                    <Panel defaultSize={60} minSize={30}>
                        {activeFile && (
                            <TestEditor
                                file={{ ...activeFile, content: currentCode }} // Pass currentCode as content
                                language={activeFile.language || "python"}
                                readOnly={false} // Allow teacher to edit and test
                                onChange={handleCodeChange}
                            />
                        )}
                    </Panel>

                    <PanelResizeHandle className="h-1 bg-zinc-900 border-y border-white/5 hover:bg-blue-500/50 transition-colors cursor-row-resize flex justify-center items-center group">
                        <div className="w-8 h-1 bg-zinc-700 rounded-full group-hover:bg-blue-400 transition-colors" />
                    </PanelResizeHandle>

                    <Panel defaultSize={40} minSize={20}>
                        <TestOutput
                            code={currentCode}
                            language={activeFile?.language || "python"}
                            testcases={activeQuestion?.testcases || []}
                            driverCode={activeQuestion?.codeSnippets?.[activeFile?.language]?.driver_code || activeQuestion?.codeSnippets?.python?.driver_code || ""}
                        />
                    </Panel>
                </PanelGroup>
            </div>
        </div>
    );
};

export default StudentCodeViewer;
