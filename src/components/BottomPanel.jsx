"use client";
import { useState, useEffect } from "react";
import Output from "./Output";
import DocsPanel from "./DocsPanel";

const BottomPanel = ({ editorRef, language, documentation }) => {
  const [activeTab, setActiveTab] = useState("output"); // 'output' | 'docs'

  // Auto-switch to docs tab when documentation is generated
  useEffect(() => {
    if (documentation) {
      setActiveTab("docs");
    }
  }, [documentation]);

  return (
    <div className="flex-1 h-full bg-black border-t border-white/10 flex flex-col min-h-0">
      {/* Tab Switcher */}
      <div className="flex border-b border-white/10 bg-zinc-900/50">
        <button
          className={`px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === "output"
              ? "text-white border-b-2 border-white bg-white/5"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
          onClick={() => setActiveTab("output")}
        >
          Output
        </button>
        <button
          className={`px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === "docs"
              ? "text-white border-b-2 border-white bg-white/5"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
          onClick={() => setActiveTab("docs")}
        >
          Docs
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === "output" ? (
          <Output editorRef={editorRef} language={language} />
        ) : (
          <DocsPanel documentation={documentation} />
        )}
      </div>
    </div>
  );
};

export default BottomPanel;
