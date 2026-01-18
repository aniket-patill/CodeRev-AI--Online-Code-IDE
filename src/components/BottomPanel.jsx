"use client";
import { useState, useEffect } from "react";
import Output from "./Output";
import DocsPanel from "./DocsPanel";
import GitControl from "./GitControl";
import { Github } from "lucide-react";

const BottomPanel = ({ editorRef, language, documentation, workspaceId, isLearningMode = false }) => {
  const [activeTab, setActiveTab] = useState("output"); // 'output' | 'docs'
  const [isGitOpen, setIsGitOpen] = useState(false);

  // Auto-switch to docs tab when documentation is generated
  useEffect(() => {
    if (documentation) {
      setActiveTab("docs");
    }
  }, [documentation]);

  return (
    <div id="bottom-panel" className="flex-1 h-full bg-black border-t border-white/10 flex flex-col min-h-0">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-white/10 bg-zinc-900/50 pr-2">
        <div className="flex">
          <button
            className={`px-4 py-2 text-xs font-medium transition-colors ${activeTab === "output"
              ? "text-white border-b-2 border-white bg-white/5"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              }`}
            onClick={() => setActiveTab("output")}
          >
            Output
          </button>
          <button
            className={`px-4 py-2 text-xs font-medium transition-colors ${activeTab === "docs"
              ? "text-white border-b-2 border-white bg-white/5"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              }`}
            onClick={() => setActiveTab("docs")}
          >
            Docs
          </button>
        </div>

        {/* Git Control Trigger */}
        <button
          id="git-control-btn"
          onClick={() => setIsGitOpen(true)}
          className="flex items-center gap-1.5 px-2 py-1 bg-[#24292e] hover:bg-[#2f363d] text-white text-[10px] font-medium rounded-md transition-colors border border-white/10"
        >
          <Github className="w-3 h-3" />
          Git Push
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === "output" ? (
          <Output editorRef={editorRef} language={language} />
        ) : (
          <DocsPanel documentation={documentation} isLearningMode={isLearningMode} />
        )}
      </div>

      {workspaceId && (
        <GitControl
          isOpen={isGitOpen}
          onClose={() => setIsGitOpen(false)}
          workspaceId={workspaceId}
        />
      )}
    </div>
  );
};

export default BottomPanel;
