"use client";
import { FileText, Copy, Check } from "lucide-react";
import { useState } from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const DocsPanel = ({ documentation }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!documentation) return;
        navigator.clipboard.writeText(documentation);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full h-full flex flex-col bg-zinc-950">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-zinc-900/50">
                <div className="flex items-center gap-2">
                    <FileText size={14} className="text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-300">Documentation</span>
                </div>

                <button
                    onClick={handleCopy}
                    disabled={!documentation}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Copy Documentation"
                >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 text-sm">
                {documentation ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-zinc-100 mb-4 pb-2 border-b border-white/10" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-lg font-semibold text-zinc-200 mt-6 mb-3" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-base font-medium text-zinc-300 mt-4 mb-2" {...props} />,
                                p: ({ node, ...props }) => <p className="text-zinc-400 leading-relaxed mb-4" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 text-zinc-400 mb-4 ml-2" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 text-zinc-400 mb-4 ml-2" {...props} />,
                                li: ({ node, ...props }) => <li className="text-zinc-400" {...props} />,
                                code: ({ node, inline, className, children, ...props }) => {
                                    return inline ? (
                                        <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-300 border border-white/10" {...props}>
                                            {children}
                                        </code>
                                    ) : (
                                        <code className="block bg-zinc-900 p-3 rounded-lg text-xs font-mono text-zinc-300 border border-white/10 overflow-x-auto my-4" {...props}>
                                            {children}
                                        </code>
                                    );
                                },
                                blockquote: ({ node, ...props }) => <blockquote className="border-l-2 border-zinc-700 pl-4 italic text-zinc-500 my-4" {...props} />,
                            }}
                        >
                            {documentation}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2">
                        <FileText size={24} className="opacity-50" />
                        <p className="text-xs">Generate docs to see them here</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocsPanel;
