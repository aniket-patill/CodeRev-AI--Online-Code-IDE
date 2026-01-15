"use client";

import { useState, useEffect } from "react";
import { FileCode, Play, X, Save } from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import TestEditor from "./TestEditor";
import TestOutput from "./TestOutput";
import { Button } from "@/components/ui/button";

const StudentCodeViewer = ({ participant, test, onClose }) => {
    const [activeFileIndex, setActiveFileIndex] = useState(0);
    const [currentCode, setCurrentCode] = useState("");

    // Determine which files to show (assigned or test default)
    const files = participant?.assignedFiles || test?.files || [];
    const activeFile = files[activeFileIndex];

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
        // But we don't save back to student's database unless we add a "Grader correction" feature
        setCurrentCode(newCode);
    };

    if (!participant) return null;

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] text-white">
            {/* Header */}
            <div className="h-14 px-4 bg-zinc-900 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                        {participant.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-white">{participant.name}</h3>
                        <p className="text-xs text-zinc-500">{participant.email || "No email"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full 
                        ${participant.status === 'submitted' ? 'bg-green-500/10 text-green-400' :
                            participant.status === 'cheated' ? 'bg-red-500/10 text-red-500' :
                                'bg-blue-500/10 text-blue-400'}`}>
                        {participant.status}
                    </span>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-zinc-400 hover:text-white">
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
                                language={activeFile.language || "javascript"}
                                readOnly={true} // Read only for teacher initially? Or allow edit? 
                                // Let's allow edit but visual indication it's temporary?
                                // Actually, TestEditor uses internal state initialized from file.content.
                                // We are passing `currentCode` as `content`. 
                                // To make it update when we switch files, TestEditor needs to reset key or listen to file change.
                                // TestEditor implementation listens to [file, currentParticipant].
                                // Since we aren't "currentParticipant" in context, we rely on file prop change.
                                // We might need to key the editor to force re-mount if state issues occur, 
                                // but TestEditor has useEffect on [file].
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
                            language={activeFile?.language || "javascript"}
                        />
                    </Panel>
                </PanelGroup>
            </div>
        </div>
    );
};

export default StudentCodeViewer;
