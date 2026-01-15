"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Bot, User, Code2, Loader2, Copy, Check } from "lucide-react";
import axios from "axios";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

export default function DropInChat({ isOpen, onClose, codeContext, language, initialInput }) {
    const [messages, setMessages] = useState([
        {
            id: "welcome",
            role: "ai",
            content: "Hello! I'm your AI assistant. I have context of your current code. How can I help you improve or understand it?"
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (initialInput) {
            setInput(initialInput);
        }
    }, [initialInput, isOpen]); // Reset input when opened with new initialInput

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { id: Date.now(), role: "user", content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await axios.post("/api/getChatResponse", {
                message: input,
                codeContext: codeContext,
                language: language
            });

            const aiMsg = {
                id: Date.now() + 1,
                role: "ai",
                content: res.data.aiResponse || "I couldn't generate a response."
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: "ai",
                content: "Sorry, I encountered an error. Please try again."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const CodeBlock = ({ language, value }) => {
        const [copied, setCopied] = useState(false);
        const onCopy = () => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        };

        return (
            <div className="relative group my-4 rounded-lg overflow-hidden border border-white/10">
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={onCopy} className="p-1.5 rounded bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-400 hover:text-white transition-colors">
                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                </div>
                <SyntaxHighlighter
                    language={language || 'javascript'}
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, padding: '1rem', background: '#09090b', fontSize: '0.8rem' }}
                    codeTagProps={{ style: { fontFamily: 'Fira Code, monospace' } }}
                >
                    {value}
                </SyntaxHighlighter>
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ y: "-100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "-100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="absolute top-0 left-0 right-0 z-40 mx-auto w-full max-w-3xl shadow-2xl"
                    style={{ pointerEvents: "auto" }}
                >
                    <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-b-2xl shadow-2xl overflow-hidden flex flex-col max-h-[600px]">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                    <Bot size={18} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white leading-none">AI Assistant</h3>
                                    <p className="text-[10px] text-zinc-400 font-medium">Powered by Gemini</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border border-white/10 ${msg.role === "ai" ? "bg-zinc-800 text-blue-400" : "bg-blue-600 text-white"}`}>
                                        {msg.role === "ai" ? <Sparkles size={14} /> : <User size={14} />}
                                    </div>

                                    <div className={`flex-1 max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${msg.role === "user"
                                        ? "bg-blue-600 text-white"
                                        : "bg-zinc-800/50 border border-white/5 text-zinc-200"
                                        }`}>
                                        {msg.role === "ai" ? (
                                            <ReactMarkdown
                                                components={{
                                                    code({ node, inline, className, children, ...props }) {
                                                        const match = /language-(\w+)/.exec(className || '');
                                                        return !inline && match ? (
                                                            <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
                                                        ) : (
                                                            <code className="bg-zinc-700/50 px-1 py-0.5 rounded text-white font-mono text-xs" {...props}>
                                                                {children}
                                                            </code>
                                                        );
                                                    }
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-blue-400">
                                        <Sparkles size={14} />
                                    </div>
                                    <div className="bg-zinc-800/50 border border-white/5 rounded-2xl px-4 py-3 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-4 bg-zinc-900 border-t border-white/10">
                            <div className="relative flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl px-2 py-2 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about your code..."
                                    className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-zinc-500 h-9 px-2"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg transition-all"
                                >
                                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
