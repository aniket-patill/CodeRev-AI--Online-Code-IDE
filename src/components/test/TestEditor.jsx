"use client";

import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { useTest } from "@/context/TestContext";

const TestEditor = ({ file, language = "javascript", readOnly = false, onChange }) => {
    const { currentParticipant, updateCode } = useTest();
    const [code, setCode] = useState(file?.content || "");
    const editorRef = useRef(null);
    const saveTimeoutRef = useRef(null);

    // Initialize with file content or saved content
    useEffect(() => {
        if (currentParticipant?.files?.[file?.name]) {
            setCode(currentParticipant.files[file.name]);
        } else if (file?.content) {
            setCode(file.content);
        }
    }, [file, currentParticipant]);

    const handleEditorMount = (editor) => {
        editorRef.current = editor;
    };

    const handleChange = (value) => {
        setCode(value || "");
        onChange?.(value);

        // Debounced auto-save
        if (!readOnly && file?.name) {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            saveTimeoutRef.current = setTimeout(() => {
                updateCode(file.name, value || "");
            }, 1000); // Save after 1 second of inactivity
        }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="h-full w-full relative">
            <Editor
                height="100%"
                language={language}
                value={code}
                onChange={handleChange}
                onMount={handleEditorMount}
                theme="vs-dark"
                options={{
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    lineNumbers: "on",
                    glyphMargin: false,
                    folding: true,
                    lineDecorationsWidth: 10,
                    lineNumbersMinChars: 3,
                    readOnly: readOnly,
                    wordWrap: "on",
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                    smoothScrolling: true,
                    renderLineHighlight: "line",
                    contextmenu: false, // Disable right-click menu
                }}
            />

            {/* Read-only indicator */}
            {readOnly && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded">
                    Read Only
                </div>
            )}
        </div>
    );
};

export default TestEditor;
