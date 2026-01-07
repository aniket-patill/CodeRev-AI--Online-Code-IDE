"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";
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
import VoiceChat from "@/components/VoiceChat";
import { WorkspaceStateProvider } from "@/context/WorkspaceStateContext";
import { getLanguageFromFilename } from "@/utils/fileExtensionUtils";

const Workspace = () => {
  const { workspaceId } = useParams();

  // State management
  const [selectedFile, setSelectedFile] = useState(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [membersCount, setMembersCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasFiles, setHasFiles] = useState(false);
  const [showCreateFilePrompt, setShowCreateFilePrompt] = useState(false);

  // Lifted Editor State
  const [editorInstance, setEditorInstance] = useState(null);
  const [language, setLanguage] = useState("javascript");
  const [documentation, setDocumentation] = useState("");

  // Fetch workspace data
  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!workspaceId) {
        setError("No workspace ID provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const workspaceRef = doc(db, "workspaces", workspaceId);
        const workspaceSnap = await getDoc(workspaceRef);

        if (workspaceSnap.exists()) {
          const workspaceData = workspaceSnap.data();
          setWorkspaceName(workspaceData.name || "Untitled Workspace");

          const membersRef = collection(db, `workspaces/${workspaceId}/members`);
          const membersSnap = await getDocs(membersRef);
          setMembersCount(membersSnap.size);

          // Check if workspace has any files
          const filesRef = collection(db, `workspaces/${workspaceId}/files`);
          const filesSnap = await getDocs(filesRef);
          const filesExist = filesSnap.size > 0;
          setHasFiles(filesExist);
          
          // Show prompt if no files exist (only after loading is complete)
          if (!filesExist && !error) {
            setShowCreateFilePrompt(true);
          }
        } else {
          setError("Space not found");
        }
      } catch (err) {
        console.error("Error fetching workspace:", err);
        setError("Failed to load workspace. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspace();
  }, [workspaceId]);

  // Auto-detect language when a file is selected based on its extension
  useEffect(() => {
    if (selectedFile?.name) {
      const detectedLanguage = getLanguageFromFilename(selectedFile.name);
      setLanguage(detectedLanguage);
    }
  }, [selectedFile]);

  // Listen for file changes to update hasFiles state
  useEffect(() => {
    if (!workspaceId || isLoading) return;

    const filesRef = collection(db, `workspaces/${workspaceId}/files`);
    const unsubscribe = onSnapshot(filesRef, (snapshot) => {
      const filesExist = snapshot.size > 0;
      setHasFiles(filesExist);
      
      // Hide prompt if files now exist, show if they don't
      if (filesExist) {
        setShowCreateFilePrompt(false);
      } else {
        // If all files are deleted, clear selected file and show prompt
        if (!isLoading) {
          setSelectedFile(null);
          setShowCreateFilePrompt(true);
        }
      }
    });

    return () => unsubscribe();
  }, [workspaceId, isLoading]);

  const handleGenerateDocs = async (code, lang) => {
    try {
      setDocumentation(""); // Reset docs to ensure UI update triggers
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
      <div className="flex flex-col h-screen bg-black text-white min-w-[1024px] relative overflow-hidden">
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
                    openFile={setSelectedFile}
                    onFileCreated={(file) => {
                      // If this was the first file, auto-open it and hide prompt
                      if (!hasFiles && file) {
                        setSelectedFile(file);
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
            ) : null}

            {/* Center - Editor & Output */}
            <Panel order={2} minSize={30}>
              <PanelGroup direction="vertical">
                <Panel order={1} minSize={30}>
                  <main className="flex flex-col h-full min-w-0 relative">
                    {/* Workspace Header */}
                    <div className="relative z-40 flex items-center justify-between px-6 py-3 border-b border-white/5 bg-zinc-900/30 backdrop-blur-sm shrink-0">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
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

                        <h1 className="text-sm font-medium text-zinc-400 truncate">
                          <span className="text-zinc-500">Space:</span>{" "}
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

                        {!isChatOpen && (
                          <button
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
                            No files in workspace
                          </h3>
                          <p className="text-sm text-zinc-400 mb-4">
                            Create a file to get started. Click the "File" button in the sidebar to create your first file.
                          </p>
                          <button
                            onClick={() => setIsNavOpen(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Open Sidebar
                          </button>
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
                    />
                  </div>
                </Panel>
              </PanelGroup>
            </Panel>

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
                  className="bg-zinc-900/40 backdrop-blur-md border-l border-white/5"
                >
                  <Chat
                    workspaceId={workspaceId}
                    setIsChatOpen={setIsChatOpen}
                    editorInstance={editorInstance}
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

        {/* Voice Chat (Overlay) */}
        {workspaceId && (
          <VoiceChat workspaceId={workspaceId} />
        )}

      </div>
    </WorkspaceStateProvider>
  );
};

export default Workspace;
