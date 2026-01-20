"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { MessageCircle, PanelLeftOpen, PanelRightOpen, PanelRightClose } from "lucide-react";
import axios from "axios";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

// Components
import Chat from "@/components/Chat";
import Editor from "@/components/Editor";
import SearchBar from "@/components/Searchbar";
import Header from "@/components/Header";
import ShowMembers from "@/components/Members";
import LiveCursor from "@/components/LiveCursor";
import NavPanel from "@/components/Navpanel";
import BottomPanel from "@/components/BottomPanel";
import TextSelectionMenu from "@/components/TextSelectionMenu";
import { WorkspaceStateProvider } from "@/context/WorkspaceStateContext";
import { useWorkspaceSettings, MODES } from "@/context/WorkspaceSettingsContext";
import { useWorkspaceLogic } from "@/hooks/useWorkspaceLogic";
import { getLanguageFromFilename } from "@/utils/fileExtensionUtils";

/**
 * LearningWorkspace - Full AI assistance with chat panel.
 * Has its own separate file system from Focus mode.
 */
const LearningWorkspace = () => {
    const { workspaceId } = useParams();
    const { mode } = useWorkspaceSettings();

    // Use the shared workspace logic hook
    const {
        workspaceName,
        isLoading,
        error,
        hasFiles,
        showCreateFilePrompt,
        selectedFile,
        handleFileSelect,
        handleFileCreated,
    } = useWorkspaceLogic(workspaceId, mode);

    // UI State
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [isNavOpen, setIsNavOpen] = useState(true);

    // Auto-collapse sidebar and chat on mobile/tablet
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsNavOpen(false);
                setIsChatOpen(false);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Lifted Editor State
    const [editorInstance, setEditorInstance] = useState(null);

    // Chat integration state
    const [chatPendingMessage, setChatPendingMessage] = useState("");
    const [editorSelection, setEditorSelection] = useState(null);

    const handleAskAI = (selectedContent) => {
        let message = "";

        if (typeof selectedContent === 'object' && selectedContent.text) {
            const { startLine, endLine } = selectedContent;
            const fileName = selectedFile?.name || "current file";
            message = `Explain the code in \`${fileName}\` from line ${startLine} to ${endLine}`;
        } else {
            message = `Explain this code:\n\`\`\`\n${selectedContent}\n\`\`\``;
        }

        setChatPendingMessage(message);
        setIsChatOpen(true);
        setEditorSelection(null);
    };

    // Monitor Editor Selection
    useEffect(() => {
        if (!editorInstance) return;

        const disposable = editorInstance.onDidChangeCursorSelection((e) => {
            const selection = editorInstance.getSelection();
            const model = editorInstance.getModel();

            if (selection && !selection.isEmpty()) {
                const text = model.getValueInRange(selection);

                const position = editorInstance.getScrolledVisiblePosition(selection.getEndPosition());
                const domNode = editorInstance.getDomNode();

                if (position && domNode) {
                    const rect = domNode.getBoundingClientRect();
                    const top = rect.top + position.top - 40;
                    const left = rect.left + position.left;

                    setEditorSelection({
                        top,
                        left,
                        text,
                        startLine: selection.startLineNumber,
                        endLine: selection.endLineNumber
                    });
                }
            } else {
                setEditorSelection(null);
            }
        });

        return () => disposable.dispose();
    }, [editorInstance]);

    const [language, setLanguage] = useState("javascript");
    const [documentation, setDocumentation] = useState("");

    // Auto-detect language when a file is selected based on its extension
    useEffect(() => {
        if (selectedFile?.name) {
            const detectedLanguage = getLanguageFromFilename(selectedFile.name);
            setLanguage(detectedLanguage);
        }
    }, [selectedFile]);

    const handleGenerateDocs = async (code, lang) => {
        try {
            setDocumentation("");
            const res = await axios.post("/api/generate-documentation", {
                code: code,
                language: lang,
            });
            const docs = res.data.documentation;
            setDocumentation(docs);
        } catch (error) {
            console.error("Failed to generate documentation:", error);
            throw error;
        }
    };

    return (
        <WorkspaceStateProvider>
            <div className="flex flex-col h-screen bg-black text-white w-full relative overflow-hidden">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

                {/* Header */}
                <div className="relative z-40">
                    <Header workspaceId={workspaceId} />
                </div>

                <div className="relative z-10 flex flex-1 overflow-hidden">
                    <PanelGroup direction="horizontal">
                        {/* Left Side - File & Folder Panel */}
                        {isNavOpen ? (
                            <>
                                <Panel
                                    defaultSize={20}
                                    minSize={15}
                                    maxSize={30}
                                    collapsible
                                    onCollapse={() => setIsNavOpen(false)}
                                    order={1}
                                    id="left-panel"
                                    className="bg-zinc-900/40 backdrop-blur-md border-r border-white/5"
                                >
                                    <NavPanel
                                        workspaceId={workspaceId}
                                        mode={mode}
                                        openFile={handleFileSelect}
                                        onFileCreated={handleFileCreated}
                                        hasFiles={hasFiles}
                                    />
                                </Panel>
                                <PanelResizeHandle className="w-1 bg-white/5 hover:bg-blue-500/50 transition-colors cursor-col-resize z-50 relative flex items-center justify-center group">
                                    <div className="h-8 w-1 bg-zinc-600 rounded-full group-hover:bg-blue-400 transition-colors" />
                                </PanelResizeHandle>
                            </>
                        ) : null}

                        {/* Center - Editor & Output */}
                        <Panel order={2} minSize={30}>
                            <PanelGroup direction="vertical">
                                <Panel order={1} minSize={30}>
                                    <main id="code-editor-wrapper" className="flex flex-col h-full min-w-0 relative">
                                        {/* Workspace Header */}
                                        <div className="relative z-40 flex items-center justify-between px-6 py-3 border-b border-white/5 bg-zinc-900/30 backdrop-blur-sm shrink-0">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                {/* Toggle Button for Left Panel */}
                                                {!isNavOpen && (
                                                    <button
                                                        onClick={() => setIsNavOpen(true)}
                                                        className="p-1.5 hover:bg-zinc-800/50 rounded-lg transition-colors text-zinc-400 hover:text-white"
                                                        title="Open Sidebar"
                                                    >
                                                        <PanelLeftOpen size={20} />
                                                    </button>
                                                )}
                                                {isNavOpen && (
                                                    <button
                                                        onClick={() => setIsNavOpen(false)}
                                                        className="p-1.5 hover:bg-zinc-800/50 rounded-lg transition-colors text-zinc-400 hover:text-white"
                                                        title="Close Sidebar"
                                                    >
                                                        <PanelLeftOpen size={20} className="rotate-180" />
                                                    </button>
                                                )}

                                                <h1 className="text-sm font-medium text-zinc-400 truncate flex items-center gap-1">
                                                    <span className="text-zinc-500 hidden sm:inline">Space:</span>
                                                    <span className="text-white truncate max-w-[100px] sm:max-w-none">
                                                        {error ? "Error" : isLoading ? "Loading..." : workspaceName}
                                                    </span>
                                                </h1>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="bg-zinc-900/40 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-lg hover:border-white/20 transition-colors">
                                                    <SearchBar workspaceId={workspaceId} />
                                                </div>

                                                <div id="invite-members-btn" className="bg-zinc-900/40 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-lg">
                                                    <ShowMembers workspaceId={workspaceId} />
                                                </div>

                                                {!isChatOpen && (
                                                    <button
                                                        id="ai-chat-trigger"
                                                        onClick={() => setIsChatOpen(true)}
                                                        className="p-1.5 bg-zinc-900/40 backdrop-blur-sm border border-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                                        title="Open Chat"
                                                    >
                                                        <PanelRightOpen size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Content Area */}
                                        {error ? (
                                            <div className="flex items-center justify-center p-8 flex-1">
                                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm max-w-md">
                                                    {error}
                                                </div>
                                            </div>
                                        ) : showCreateFilePrompt ? (
                                            <div className="flex items-center justify-center p-8 flex-1">
                                                <div className="bg-zinc-900/90 border border-white/10 rounded-lg p-6 text-center max-w-md backdrop-blur-md">
                                                    <h3 className="text-lg font-semibold text-white mb-2">
                                                        No files in Learning workspace
                                                    </h3>
                                                    <p className="text-sm text-zinc-400 mb-4">
                                                        Create a file to get started. Click the "File" button in the sidebar to create your first file.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div id="code-editor" className="flex flex-col flex-1 overflow-hidden relative">
                                                <Editor
                                                    file={selectedFile}
                                                    onEditorMounted={setEditorInstance}
                                                    language={language}
                                                    setLanguage={setLanguage}
                                                    onGenerateDocs={handleGenerateDocs}
                                                    isFocusMode={false}
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
                                            isLearningMode={true}
                                        />
                                    </div>
                                </Panel>
                            </PanelGroup>
                        </Panel>

                        {/* Right Side - Chat Panel (Learning Mode Only) */}
                        {isChatOpen ? (
                            <>
                                <PanelResizeHandle className="w-1 bg-white/5 hover:bg-blue-500/50 transition-colors cursor-col-resize z-50 relative flex items-center justify-center group">
                                    <div className="h-8 w-1 bg-zinc-600 rounded-full group-hover:bg-blue-400 transition-colors" />
                                </PanelResizeHandle>
                                <Panel
                                    defaultSize={25}
                                    minSize={20}
                                    maxSize={40}
                                    collapsible
                                    onCollapse={() => setIsChatOpen(false)}
                                    order={3}
                                    id="chat-panel"
                                    className="bg-zinc-900/40 backdrop-blur-md border-l border-white/5"
                                >
                                    <Chat
                                        workspaceId={workspaceId}
                                        setIsChatOpen={setIsChatOpen}
                                        editorInstance={editorInstance}
                                        pendingMessage={chatPendingMessage}
                                        onMessageConsumed={() => setChatPendingMessage("")}
                                    />
                                </Panel>
                            </>
                        ) : null}
                    </PanelGroup>
                </div>

                {/* Live Cursor (Overlay) */}
                <div className="pointer-events-none fixed inset-0 z-50">
                    <LiveCursor workspaceId={workspaceId} />
                </div>

                {/* Text Selection Menu - Learning Mode */}
                <TextSelectionMenu onAskAI={handleAskAI} externalSelection={editorSelection} />
            </div>
        </WorkspaceStateProvider>
    );
};

export default LearningWorkspace;
