"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import axios from "axios";

// Components
import Editor from "@/components/Editor";
import SearchBar from "@/components/Searchbar";
import Header from "@/components/Header";
import ShowMembers from "@/components/Members";
import LiveCursor from "@/components/LiveCursor";
import NavPanel from "@/components/Navpanel";
import BottomPanel from "@/components/BottomPanel";
import { useWorkspaceSettings, MODES } from "@/context/WorkspaceSettingsContext";
import { getLanguageFromFilename } from "@/utils/fileExtensionUtils";
import { PanelLeftOpen } from "lucide-react";

const FocusMode = () => {
    const { workspaceId } = useParams();
    const { setMode, updateActiveFile, activeFiles } = useWorkspaceSettings();

    // Initialize Mode
    useEffect(() => {
        setMode(MODES.FOCUS);
    }, [setMode]);

    // State
    const [selectedFile, setSelectedFile] = useState(null);
    const [workspaceName, setWorkspaceName] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editorInstance, setEditorInstance] = useState(null);
    const [language, setLanguage] = useState("javascript");
    const [documentation, setDocumentation] = useState("");
    const [isNavOpen, setIsNavOpen] = useState(true);
    const [hasFiles, setHasFiles] = useState(false);
    const [showCreateFilePrompt, setShowCreateFilePrompt] = useState(false);

    // Restore active file for Focus Mode
    useEffect(() => {
        if (activeFiles && activeFiles[MODES.FOCUS]) {
            setSelectedFile(activeFiles[MODES.FOCUS]);
        }
    }, [activeFiles]);

    const handleFileSelect = (file) => {
        setSelectedFile(file);
        updateActiveFile(MODES.FOCUS, file);
    };

    // Fetch workspace data
    useEffect(() => {
        const fetchWorkspace = async () => {
            if (!workspaceId) return;
            try {
                const workspaceRef = doc(db, "workspaces", workspaceId);
                const workspaceSnap = await getDoc(workspaceRef);
                if (workspaceSnap.exists()) {
                    setWorkspaceName(workspaceSnap.data().name || "Untitled Workspace");

                    const filesRef = collection(db, `workspaces/${workspaceId}/files`);
                    const filesSnap = await getDocs(filesRef);
                    const filesExist = filesSnap.size > 0;
                    setHasFiles(filesExist);
                    if (!filesExist) {
                        setShowCreateFilePrompt(true);
                    }
                } else {
                    setError("Space not found");
                }
            } catch (err) {
                console.error("Error fetching workspace:", err);
                setError("Failed to load workspace.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchWorkspace();
    }, [workspaceId]);

    // Listen for file changes
    useEffect(() => {
        if (!workspaceId || isLoading) return;
        const filesRef = collection(db, `workspaces/${workspaceId}/files`);
        const unsubscribe = onSnapshot(filesRef, (snapshot) => {
            const filesExist = snapshot.size > 0;
            setHasFiles(filesExist);
            if (filesExist) {
                setShowCreateFilePrompt(false);
            } else {
                if (!isLoading) {
                    setSelectedFile(null);
                    setShowCreateFilePrompt(true);
                }
            }
        });
        return () => unsubscribe();
    }, [workspaceId, isLoading]);

    // Auto-detect language
    useEffect(() => {
        if (selectedFile?.name) {
            setLanguage(getLanguageFromFilename(selectedFile.name));
        }
    }, [selectedFile]);

    // Docs Generation
    const handleGenerateDocs = async (code, lang) => {
        try {
            setDocumentation("");
            const res = await axios.post("/api/generate-documentation", {
                code,
                language: lang,
            });
            setDocumentation(res.data.documentation);
        } catch (error) {
            console.error("Failed to generate documentation:", error);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white min-w-[1024px] relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

            {/* Header */}
            <div className="relative z-40">
                <Header workspaceId={workspaceId} />
            </div>

            <div className="relative z-10 flex flex-1 overflow-hidden">
                <PanelGroup direction="horizontal">
                    {/* Left Side - File Explorer */}
                    {isNavOpen && (
                        <>
                            <Panel defaultSize={20} minSize={15} maxSize={30} collapsible onCollapse={() => setIsNavOpen(false)} order={1} className="bg-zinc-900/40 backdrop-blur-md border-r border-white/5">
                                <NavPanel
                                    workspaceId={workspaceId}
                                    openFile={handleFileSelect}
                                    onFileCreated={(file) => {
                                        if (!hasFiles && file) {
                                            handleFileSelect(file);
                                            setHasFiles(true);
                                            setShowCreateFilePrompt(false);
                                        }
                                    }}
                                    hasFiles={hasFiles}
                                />
                            </Panel>
                            <PanelResizeHandle className="w-1 bg-white/5 hover:bg-blue-500/50 transition-colors cursor-col-resize z-50 relative flex items-center justify-center group">
                                <div className="h-8 w-1 bg-zinc-600 rounded-full group-hover:bg-blue-400 transition-colors" />
                            </PanelResizeHandle>
                        </>
                    )}

                    {/* Center - Editor & Output */}
                    <Panel order={2} minSize={50}>
                        <PanelGroup direction="vertical">
                            <Panel order={1} minSize={50}>
                                <main className="flex flex-col h-full min-w-0 relative">
                                    {/* Focus Header */}
                                    <div className="relative z-40 flex items-center justify-between px-6 py-3 border-b border-white/5 bg-zinc-900/30 backdrop-blur-sm shrink-0">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {!isNavOpen && (
                                                <button onClick={() => setIsNavOpen(true)} className="p-1.5 hover:bg-zinc-800/50 rounded-lg transition-colors text-zinc-400 hover:text-white">
                                                    <PanelLeftOpen size={20} />
                                                </button>
                                            )}
                                            {isNavOpen && (
                                                <button onClick={() => setIsNavOpen(false)} className="p-1.5 hover:bg-zinc-800/50 rounded-lg transition-colors text-zinc-400 hover:text-white">
                                                    <PanelLeftOpen size={20} className="rotate-180" />
                                                </button>
                                            )}
                                            <h1 className="text-sm font-medium text-zinc-400 truncate">
                                                <span className="text-zinc-500">Focus Mode:</span>{" "}
                                                <span className="text-white">
                                                    {error ? "Error" : isLoading ? "Loading..." : workspaceName}
                                                </span>
                                            </h1>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="bg-zinc-900/40 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-lg hover:border-white/20 transition-colors">
                                                <SearchBar workspaceId={workspaceId} />
                                            </div>
                                            <div className="bg-zinc-900/40 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-lg">
                                                <ShowMembers workspaceId={workspaceId} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    {error ? (
                                        <div className="flex items-center justify-center p-8 flex-1">
                                            <span className="text-red-400">{error}</span>
                                        </div>
                                    ) : showCreateFilePrompt ? (
                                        <div className="flex items-center justify-center p-8 flex-1">
                                            <div className="bg-zinc-900/90 border border-white/10 rounded-lg p-6 text-center max-w-md backdrop-blur-md">
                                                <h3 className="text-lg font-semibold text-white mb-2">No files in workspace</h3>
                                                <p className="text-sm text-zinc-400 mb-4">Create a file to get started.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col flex-1 overflow-hidden relative">
                                            <Editor
                                                file={selectedFile}
                                                onEditorMounted={setEditorInstance}
                                                language={language}
                                                setLanguage={setLanguage}
                                                onGenerateDocs={handleGenerateDocs}
                                                isFocusMode={true}
                                            />
                                        </div>
                                    )}
                                </main>
                            </Panel>

                            <PanelResizeHandle className="h-1 bg-white/5 hover:bg-blue-500/50 transition-colors cursor-row-resize z-50 relative flex justify-center items-center group">
                                <div className="w-8 h-1 bg-zinc-600 rounded-full group-hover:bg-blue-400 transition-colors" />
                            </PanelResizeHandle>

                            <Panel order={2} defaultSize={30} minSize={10} collapsible>
                                <div className="h-full flex flex-col overflow-hidden bg-[#1e1e1e]">
                                    <BottomPanel
                                        editorRef={{ current: editorInstance }}
                                        language={language}
                                        documentation={documentation}
                                        workspaceId={workspaceId}
                                    />
                                </div>
                            </Panel>
                        </PanelGroup>
                    </Panel>
                </PanelGroup>
            </div>

            {/* Live Cursor */}
            <div className="pointer-events-none fixed inset-0 z-50">
                <LiveCursor workspaceId={workspaceId} />
            </div>
        </div>
    );
};

export default FocusMode;
