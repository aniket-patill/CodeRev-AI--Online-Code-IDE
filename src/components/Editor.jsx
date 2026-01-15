
"use client";
import { Moon, Sun, Sparkles, Wrench, File, Expand, Shrink, Settings, Code2, Check, X, Lightbulb, Bot } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import DropInChat from "./DropInChat";
import Editor, { useMonaco, DiffEditor } from "@monaco-editor/react";
import axios from "axios";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "@/constants";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";

export default function CodeEditor({ file, onEditorMounted, language, setLanguage, onGenerateDocs, isFocusMode }) {
  const [selectedTheme, setSelectedTheme] = useState("vs-dark");
  const [fontSize, setFontSize] = useState(14);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [updatedCode, setUpdatedCode] = useState(
    "//Select a file to start coding..!"
  );
  const [isFixing, setIsFixing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const monaco = useMonaco();
  const timeoutRef = useRef(null);
  const editorRef = useRef(null); // Internal Ref
  const settingsRef = useRef(null);

  // Diff View State
  const [isDiffView, setIsDiffView] = useState(false);
  const [originalCode, setOriginalCode] = useState("");
  const [fixedCode, setFixedCode] = useState("");
  const [hintData, setHintData] = useState(null);

  useEffect(() => {
    if (file) {
      fetchFileContent();
    }
  }, [file]);

  useEffect(() => {
    if (isFocusMode) {
      setIsAiOpen(false);
    }
  }, [isFocusMode]);

  useEffect(() => {
    if (!file?.id || !file?.workspaceId) return;

    const filePath = `workspaces/${file.workspaceId}/files`;
    const fileRef = doc(db, filePath, file.id);

    const unsubscribe = onSnapshot(fileRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.content !== updatedCode && !isDiffView) {
          setUpdatedCode(data.content || "");
        }
      }
    });

    return () => unsubscribe();
  }, [file, isDiffView]);

  const fetchFileContent = async () => {
    if (!file?.id || !file?.workspaceId) return;
    try {
      const filePath = `workspaces/${file.workspaceId}/files`;
      const fileRef = doc(db, filePath, file.id);
      const fileSnap = await getDoc(fileRef);

      if (fileSnap.exists()) {
        setUpdatedCode(fileSnap.data().content || "");
      }
    } catch (error) {
      console.error("Error fetching file content:", error);
    }
  };

  const handleEditorChange = (value) => {
    setUpdatedCode(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => autoSaveFile(value), 1000);
  };

  const autoSaveFile = async (content) => {
    if (!file?.id || !file?.workspaceId) return;
    try {
      const filePath = `workspaces/${file.workspaceId}/files`;
      const fileRef = doc(db, filePath, file.id);
      await updateDoc(fileRef, { content });
    } catch (error) {
      console.error("Error auto-saving file:", error);
    }
  };

  const onSelect = (lang) => {
    setLanguage(lang);
  };

  const onMount = (editor) => {
    editorRef.current = editor;
    if (onEditorMounted) {
      onEditorMounted(editor);
    }
    editor.focus();
  };

  const handleGenerateDocs = async () => {
    setIsLoading(true);
    try {
      await onGenerateDocs(updatedCode, language);
    } catch (error) {
      console.error("Failed to generate documentation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fixSyntaxErrors = async () => {
    setIsFixing(true);
    try {
      const res = await axios.post("/api/get-errors", {
        code: updatedCode,
        language: language,
      });

      if (res.data.fixedCode) {
        if (!res.data.aiFixed) {
          // Optionally show a toast here
        } else {
          setOriginalCode(updatedCode);
          setFixedCode(res.data.fixedCode);
          setIsDiffView(true);
        }
      }
    } catch (error) {
      console.error(
        "Failed to fix syntax:",
        error?.response?.data?.error || error.message
      );
    } finally {
      setIsFixing(false);
    }
  };

  const applyFix = () => {
    setUpdatedCode(fixedCode);
    autoSaveFile(fixedCode);
    setIsDiffView(false);
    setOriginalCode("");
    setFixedCode("");
  };

  const cancelFix = () => {
    setIsDiffView(false);
    setOriginalCode("");
    setFixedCode("");
  };
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [hintCooldown, setHintCooldown] = useState(0);
  const [hintsRemaining, setHintsRemaining] = useState(5);

  useEffect(() => {
    let interval;
    if (hintCooldown > 0) {
      interval = setInterval(() => {
        setHintCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [hintCooldown]);

  const getHint = async () => {
    if (hintCooldown > 0 || hintsRemaining <= 0) return;

    setIsHintLoading(true);
    setHintData(null);
    try {
      const res = await axios.post("/api/getChatResponse", {
        message: "Analyze the current code context and provide a brief, actionable hint about what logically comes next. Do not provide the full code, just a nudge on the next step or logic to implement. Keep it under 2 sentences.",
        codeContext: updatedCode,
      });
      if (res.data?.aiResponse) {
        setHintData(res.data.aiResponse);
        setHintCooldown(10); // 10s cooldown after success
        setHintsRemaining((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Failed to get hint:", error);
      if (error.response?.status === 429) {
        setHintData("Too many requests. Please wait a moment.");
        setHintCooldown(30); // 30s cooldown on rate limit
      } else {
        setHintData("Failed to get hint. Try again later.");
        setHintCooldown(5);
      }
    } finally {
      setIsHintLoading(false);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    setTimeout(() => editorRef.current?.layout(), 100);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const themes = [
    { name: "Dark", value: "vs-dark" },
    { name: "Light", value: "light" },
    { name: "High Contrast", value: "hc-black" },
  ];

  const getMonacoLanguage = (lang) => {
    if (lang === "c") return "cpp";
    return lang;
  };

  return (
    <div
      className={`bg-black/50 backdrop-blur-sm h-full rounded-xl border border-white/10 overflow-hidden flex flex-col ${isExpanded ? "fixed inset-0 z-50 m-0 rounded-none bg-black" : "relative"
        }`}
    >
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`transition-all duration-300 flex flex-col w-full border-r border-white/10`}
        >
          {/* Editor Header */}
          <div className="flex justify-between items-center h-12 px-4 border-b border-white/10 bg-zinc-900/50">
            {file ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                <File size={14} className="text-zinc-400" />
                <span className="text-xs text-zinc-200 font-medium line-clamp-1 max-w-[150px]">
                  {file.name}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                <Code2 size={14} className="text-zinc-400" />
                <span className="text-xs text-zinc-400 font-medium">No file selected</span>
              </div>
            )}

            <div className="flex gap-2 items-center">
              {/* Diff View Controls */}
              {isDiffView ? (
                <>
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-xs font-medium text-green-400 hover:text-green-300 transition-all"
                    onClick={applyFix}
                  >
                    <Check size={12} />
                    Apply Fix
                  </button>
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 transition-all"
                    onClick={cancelFix}
                  >
                    <X size={12} />
                    Cancel
                  </button>
                  <div className="h-4 w-[1px] bg-white/10 mx-1" />
                </>
              ) : (
                <>
                  {/* Settings Dropdown */}
                  <div className="relative" ref={settingsRef}>
                    <button
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      onClick={() => setShowSettings(!showSettings)}
                      title="Editor Settings"
                    >
                      <Settings size={16} />
                    </button>
                    {showSettings && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-3 space-y-3 z-50">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5 block font-medium">
                            Theme
                          </label>
                          <select
                            className="w-full bg-zinc-800 text-zinc-200 text-xs p-2 rounded-lg border border-white/5 focus:border-white/20 outline-none"
                            value={selectedTheme}
                            onChange={(e) => setSelectedTheme(e.target.value)}
                          >
                            {themes.map((theme) => (
                              <option key={theme.value} value={theme.value}>
                                {theme.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5 block font-medium">
                            Font Size
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="10"
                              max="24"
                              value={fontSize}
                              onChange={(e) => setFontSize(Number(e.target.value))}
                              className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                            <span className="text-xs text-zinc-300 w-8 text-right font-mono">
                              {fontSize}px
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="h-4 w-[1px] bg-white/10 mx-1" />

                  {/* Undo/Redo Buttons */}
                  <button
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    onClick={() => editorRef.current?.trigger('keyboard', 'undo')}
                    title="Undo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 7v6h6" />
                      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                    </svg>
                  </button>
                  <button
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    onClick={() => editorRef.current?.trigger('keyboard', 'redo')}
                    title="Redo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 7v6h-6" />
                      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
                    </svg>
                  </button>

                  <div className="h-4 w-[1px] bg-white/10 mx-1" />

                  {/* Action Buttons */}
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg text-xs font-medium text-zinc-300 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleGenerateDocs}
                    disabled={isLoading || isFocusMode}
                    title={isFocusMode ? "Disabled in Focus Mode" : "Generate Documentation"}
                  >
                    <Sparkles size={14} />
                    {isLoading ? "Generating..." : "Docs"}
                  </button>
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg text-xs font-medium text-zinc-300 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={fixSyntaxErrors}
                    disabled={isFixing || isFocusMode}
                    title={isFocusMode ? "Disabled in Focus Mode" : "Fix Syntax Errors"}
                  >
                    <Wrench size={12} />
                    {isFixing ? "Fixing..." : "Fix"}
                  </button>
                  {!isFocusMode && (
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-lg text-xs font-medium text-blue-400 hover:text-blue-300 transition-all"
                      onClick={() => setIsAiOpen(!isAiOpen)}
                    >
                      <Bot size={14} />
                      Ask AI
                    </button>
                  )}

                  {isFocusMode && (
                    <div className="relative">
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-xs font-medium text-amber-500 hover:text-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={getHint}
                        disabled={isHintLoading || (hintsRemaining <= 0 && !hintData) || hintCooldown > 0}
                        title={hintsRemaining <= 0 ? "No hints remaining for this session" : "Get a hint about what to write next"}
                      >
                        <Lightbulb size={12} className={isHintLoading ? "animate-pulse" : ""} />
                        {isHintLoading ? "Thinking..." : `Hint (${hintsRemaining})`}
                      </button>

                      {hintData && (
                        <div className="absolute top-full right-0 mt-3 w-72 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                          <div className="flex justify-between items-start gap-4 mb-2">
                            <div className="flex items-center gap-2 text-amber-500">
                              <Lightbulb size={14} />
                              <span className="text-xs font-bold uppercase tracking-wider">Hint</span>
                            </div>
                            <button
                              onClick={() => setHintData(null)}
                              className="text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <p className="text-zinc-300 text-xs leading-relaxed">
                            {hintData}
                          </p>
                          <div className="absolute -top-1 right-8 w-2 h-2 bg-zinc-900 border-t border-l border-white/10 transform rotate-45" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="h-4 w-[1px] bg-white/10 mx-1" />

                  <LanguageSelector language={language} onSelect={onSelect} />
                </>
              )}
            </div>
          </div>

          {/* Monaco Editor or Diff Editor */}
          <div className="flex-1 relative bg-[#1e1e1e]">
            {isDiffView ? (
              <DiffEditor
                height="100%"
                theme={selectedTheme}
                language={getMonacoLanguage(language)}
                original={originalCode}
                modified={fixedCode}
                options={{
                  fontSize: fontSize,
                  wordWrap: "on",
                  minimap: { enabled: false },
                  readOnly: true,
                  renderSideBySide: true,
                  fontFamily: "'Fira Code', monospace",
                  padding: { top: 16, bottom: 16 },
                }}
              />
            ) : (
              <Editor
                height="100%"
                theme={selectedTheme}
                language={getMonacoLanguage(language)}
                defaultValue={CODE_SNIPPETS[language]}
                value={updatedCode}
                onMount={onMount}
                onChange={handleEditorChange}
                options={{
                  fontSize: fontSize,
                  wordWrap: "on",
                  minimap: { enabled: false },
                  bracketPairColorization: true,
                  suggest: { preview: true },
                  inlineSuggest: {
                    enabled: true,
                    showToolbar: "onHover",
                    mode: "subword",
                    suppressSuggestions: false,
                  },
                  quickSuggestions: {
                    other: true,
                    comments: true,
                    strings: true,
                  },
                  suggestSelection: "recentlyUsed",
                  padding: { top: 16, bottom: 16 },
                  scrollBeyondLastLine: false,
                  fontFamily: "'Fira Code', monospace",
                }}
              />
            )}
          </div>
        </div>
      </div>
      <DropInChat
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        codeContext={updatedCode}
        language={language}
      />
    </div>
  );
}
