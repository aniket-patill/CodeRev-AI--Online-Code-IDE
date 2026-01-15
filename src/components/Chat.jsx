"use client";

import { useState, useEffect, useRef } from "react";
import { auth, firestore } from "@/config/firebase";
import {
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs,
  where
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { MessageSquarePlus, Trash, X, Copy, Check, Send, User, ArrowDown, ArrowUp, Sparkles, Loader2, CornerDownRight } from "lucide-react";
import ReactMarkdown from 'react-markdown';

function Chatroom({ workspaceId, setIsChatOpen, editorInstance, pendingMessage, onMessageConsumed }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [rateLimitError, setRateLimitError] = useState(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const lastRequestTimeRef = useRef(0);
  const cooldownIntervalRef = useRef(null);
  const [aiProcessingPhase, setAiProcessingPhase] = useState("Thinking");

  // Null-safe auth access (prevents crash during hydration)
  const userId = auth.currentUser?.uid;
  const name = auth.currentUser?.displayName || "User";

  const messagesRef = collection(firestore, "messages");
  const messagesQuery = query(messagesRef, orderBy("createdAt"));

  const messagesEndRef = useRef(null);

  // Guard: If user is not authenticated, show message
  if (!userId) {
    return (
      <div className="flex flex-col h-full bg-zinc-900 border-l border-white/10 items-center justify-center p-6">
        <p className="text-zinc-400 text-sm">Please log in to access chat.</p>
      </div>
    );
  }

  useEffect(() => {
    if (!workspaceId) return;

    setLoading(true);

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((msg) => msg.workspaceId === workspaceId);

      setMessages(messagesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [workspaceId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, newMessage, isAIProcessing]);

  const [isReceivingContext, setIsReceivingContext] = useState(false);
  const [selectionContext, setSelectionContext] = useState(null);

  // Handle pending messages from parent (e.g., from TextSelectionMenu)
  useEffect(() => {
    if (pendingMessage) {
      // Store the selection for the context preview bubble
      setSelectionContext(pendingMessage);
      // Set AI mode prefix, user can type their question
      setNewMessage("@ ");

      // Trigger "Catch" animation
      setIsReceivingContext(true);
      setTimeout(() => setIsReceivingContext(false), 1500);

      if (onMessageConsumed) {
        onMessageConsumed();
      }
    }
  }, [pendingMessage, onMessageConsumed]);

  // Start cooldown timer
  const startCooldown = (seconds) => {
    setCooldownSeconds(seconds);
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
    }
    cooldownIntervalRef.current = setInterval(() => {
      setCooldownSeconds(prev => {
        if (prev <= 1) {
          clearInterval(cooldownIntervalRef.current);
          cooldownIntervalRef.current = null;
          setRateLimitError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Clean up cooldown interval on unmount
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  // Cycle through AI processing phases
  useEffect(() => {
    if (!isAIProcessing) {
      setAiProcessingPhase("Thinking");
      return;
    }

    const phases = ["Thinking", "Analyzing", "Composing"];
    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % phases.length;
      setAiProcessingPhase(phases[index]);
    }, 1500);

    return () => clearInterval(interval);
  }, [isAIProcessing]);

  const generateAIResponse = async (prompt, codeContext, retryCount = 0) => {
    // Debounce: prevent rapid requests (min 2 seconds between requests)
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;
    const MIN_REQUEST_INTERVAL = 2000; // 2 seconds

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL && retryCount === 0) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastRequestTimeRef.current = Date.now();
    setIsAIProcessing(true);
    setRateLimitError(null);

    try {
      const response = await fetch('/api/getChatResponse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: prompt, codeContext }),
      });

      // Handle 504 Gateway Timeout before trying to parse JSON
      if (response.status === 504) {
        console.error("API Error: 504 Gateway Timeout");
        return "The AI service took too long to respond. Please try a shorter question or try again in a moment.";
      }

      // Safely parse JSON - some error responses may not be JSON
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        if (response.status >= 500) {
          return "The server encountered an error. Please try again in a moment.";
        }
        return "Sorry, received an invalid response from the server. Please try again.";
      }

      if (!response.ok) {
        // Handle rate limit error specially
        if (response.status === 429) {
          const maxRetries = 2;
          if (retryCount < maxRetries) {
            // Exponential backoff: 3s, 6s
            const waitTime = 3000 * Math.pow(2, retryCount);
            console.log(`Rate limited, retrying in ${waitTime / 1000}s (attempt ${retryCount + 1}/${maxRetries})`);
            setRateLimitError(`Rate limited. Retrying in ${Math.ceil(waitTime / 1000)}s...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            setRateLimitError(null);
            return await generateAIResponse(prompt, codeContext, retryCount + 1);
          }

          // Max retries exceeded - show cooldown
          const cooldownTime = 15; // 15 seconds cooldown
          setRateLimitError(`AI service is busy. Please wait ${cooldownTime}s before trying again.`);
          startCooldown(cooldownTime);
          return "The AI service is currently rate-limited. Please wait a moment and try again. This usually happens when there are too many requests.";
        }

        const errorMsg = data?.error || 'Request failed';
        console.error("API Error:", response.status, errorMsg);
        return `Sorry, I couldn't process that request. ${errorMsg}`;
      }

      return data.aiResponse || "Sorry, I received an empty response. Please try again.";
    } catch (error) {
      console.error("API Error:", error);
      // Check if it's a network error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return "Network error. Please check your connection and try again.";
      }
      return "Sorry, I couldn't process that request. Please try again.";
    } finally {
      setIsAIProcessing(false);
    }
  };

  const sendMessage = async () => {
    // Allow sending if there's a message OR if there's selection context with AI mode
    const hasContent = newMessage.trim() !== "" && newMessage.trim() !== "@";
    const hasSelectionWithAI = selectionContext && newMessage.trim().startsWith("@");

    if (!hasContent && !hasSelectionWithAI) return;

    const imageUrl = auth.currentUser.photoURL;
    const aiMatch = newMessage.match(/@(.*)$/);
    let aiPrompt = null;
    let userMessage = newMessage;

    if (aiMatch) {
      // If there's selection context, prepend it to the prompt
      const userQuery = aiMatch[1].trim();
      if (selectionContext) {
        aiPrompt = userQuery
          ? `${selectionContext}\n\nUser question: ${userQuery}`
          : selectionContext;
        userMessage = userQuery ? `@ ${userQuery}` : `@ Explain this`;
      } else {
        aiPrompt = userQuery;
      }
    }

    try {
      if (userMessage && userMessage.trim() !== "@") {
        await addDoc(messagesRef, {
          text: userMessage,
          createdAt: serverTimestamp(),
          imageUrl,
          userId,
          name,
          workspaceId,
        });
      }

      if (aiPrompt) {
        // Get current code from editor
        const codeContext = editorInstance ? editorInstance.getValue() : "";

        const aiResponse = await generateAIResponse(aiPrompt, codeContext);
        await addDoc(messagesRef, {
          text: `${aiResponse}`,
          createdAt: serverTimestamp(),
          imageUrl: "/ai-avatar.png",
          userId: "AI_BOT",
          name: "CodeRev AI",
          workspaceId,
        });
      }

      setNewMessage("");
      setSelectionContext(null); // Clear selection context after sending
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const clearChat = async () => {
    try {
      const querySnapshot = await getDocs(
        query(messagesRef, where("workspaceId", "==", workspaceId))
      );

      const deletePromises = querySnapshot.docs.map((docItem) => deleteDoc(doc(messagesRef, docItem.id)));
      await Promise.all(deletePromises);
      setMessages([]);
    } catch (error) {
      console.error("Error clearing chat:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const MessageBubble = ({ msg }) => {
    const isCurrentUser = msg.userId === userId;
    const isAI = msg.userId === "AI_BOT";
    const [copiedCode, setCopiedCode] = useState(null);

    const parseMessage = (text) => {
      const parts = [];
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let lastIndex = 0;
      let match;

      while ((match = codeBlockRegex.exec(text)) !== null) {
        const [fullMatch, lang, code] = match;
        const startIndex = match.index;
        const endIndex = codeBlockRegex.lastIndex;

        if (startIndex > lastIndex) {
          parts.push({
            type: 'text',
            content: text.substring(lastIndex, startIndex)
          });
        }

        parts.push({
          type: 'code',
          lang: lang || 'text',
          code: code.trim()
        });

        lastIndex = endIndex;
      }

      if (lastIndex < text.length) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex)
        });
      }

      return parts;
    };

    const copyToClipboard = async (code, index) => {
      await navigator.clipboard.writeText(code);
      setCopiedCode(index);
      setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
      <div className={`flex flex-col gap-2 ${isCurrentUser ? "items-end" : "items-start"} w-full`}>
        {!isAI && (
          <span className="text-[11px] font-medium text-zinc-500 px-1">
            {isCurrentUser ? "You" : msg.name}
          </span>
        )}

        <div className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : "flex-row"} ${isAI ? "w-full" : "max-w-[90%]"}`}>
          {!isCurrentUser && !isAI && (
            <img
              src={msg.imageUrl || "/robotic.png"}
              alt="Avatar"
              className="w-7 h-7 rounded-full flex-shrink-0 border border-white/10 ring-1 ring-white/5"
            />
          )}

          <div className={`py-3.5 px-4 text-[13px] leading-relaxed rounded-2xl break-words shadow-sm transition-all hover:shadow-md ${isAI
            ? "bg-zinc-900/60 backdrop-blur-sm border border-white/5 w-full"
            : isCurrentUser
              ? "bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 text-white"
              : "bg-zinc-800/80 text-white border border-white/5"
            }`}>
            {isAI && (
              <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-white/10">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                  AI
                </div>
                <span className="text-xs font-semibold text-white">CodeRev AI</span>
              </div>
            )}

            {isAI ? (
              <ReactMarkdown
                components={{
                  // Headings
                  h1: ({ children }) => <h1 className="text-lg font-bold text-white mt-3 mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold text-white mt-3 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold text-white mt-2 mb-1">{children}</h3>,
                  // Paragraphs
                  p: ({ children }) => <p className="text-zinc-200 mb-2 last:mb-0">{children}</p>,
                  // Bold and italic
                  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                  em: ({ children }) => <em className="italic text-zinc-300">{children}</em>,
                  // Lists
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 text-zinc-200">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 text-zinc-200">{children}</ol>,
                  li: ({ children }) => <li className="text-zinc-200">{children}</li>,
                  // Inline code
                  code: ({ inline, className, children }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');

                    if (!inline && match) {
                      return (
                        <div className="relative my-3 group">
                          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button
                              onClick={() => copyToClipboard(codeString, codeString.slice(0, 20))}
                              className="p-1.5 rounded bg-zinc-700/80 hover:bg-zinc-600/80 backdrop-blur-sm transition-colors"
                            >
                              {copiedCode === codeString.slice(0, 20) ? (
                                <Check className="h-3.5 w-3.5 text-green-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-zinc-300" />
                              )}
                            </button>
                          </div>
                          <div className="rounded-lg overflow-hidden border border-white/10">
                            <SyntaxHighlighter
                              language={match[1]}
                              style={vscDarkPlus}
                              customStyle={{
                                background: '#09090b',
                                padding: '1rem',
                                margin: 0,
                                fontSize: '0.875rem',
                              }}
                              codeTagProps={{ style: { fontFamily: 'Fira Code, monospace' } }}
                            >
                              {codeString}
                            </SyntaxHighlighter>
                          </div>
                        </div>
                      );
                    }

                    // Inline code
                    return (
                      <code className="px-1.5 py-0.5 bg-zinc-700/50 rounded text-zinc-200 text-xs font-mono">
                        {children}
                      </code>
                    );
                  },
                  // Code blocks without language
                  pre: ({ children }) => <div className="my-2">{children}</div>,
                  // Links
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                      {children}
                    </a>
                  ),
                  // Blockquotes
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-zinc-600 pl-3 my-2 text-zinc-400 italic">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {msg.text}
              </ReactMarkdown>
            ) : (
              parseMessage(msg.text).map((part, index) => {
                if (part.type === 'text') {
                  return (
                    <span key={index} className="whitespace-pre-wrap">
                      {part.content}
                    </span>
                  );
                }

                if (part.type === 'code') {
                  return (
                    <div key={index} className="relative my-3 group">
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                          onClick={() => copyToClipboard(part.code, index)}
                          className="p-1.5 rounded bg-zinc-700/80 hover:bg-zinc-600/80 backdrop-blur-sm transition-colors"
                        >
                          {copiedCode === index ? (
                            <Check className="h-3.5 w-3.5 text-green-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-zinc-300" />
                          )}
                        </button>
                      </div>
                      <div className="rounded-lg overflow-hidden border border-white/10">
                        <SyntaxHighlighter
                          language={part.lang}
                          style={vscDarkPlus}
                          customStyle={{
                            background: '#09090b',
                            padding: '1rem',
                            margin: 0,
                            fontSize: '0.875rem',
                          }}
                          codeTagProps={{ style: { fontFamily: 'Fira Code, monospace' } }}
                        >
                          {part.code}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  );
                }

                return null;
              })
            )}

            {isAI && (
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 mt-3 pt-2 border-t border-white/5">
                <span className="font-medium uppercase tracking-wider">AI-generated response</span>
              </div>
            )}
          </div>

          {isCurrentUser && !isAI && (
            <img
              src={msg.imageUrl || "/robotic.png"}
              alt="Avatar"
              className="w-6 h-6 rounded-full flex-shrink-0 border border-white/10"
            />
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
        Loading messages...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-white/10">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-white/10">
        <div className="flex items-center gap-3">

          <div>
            <h2 className="text-sm font-semibold text-white">CodeRev AI</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[10px] text-zinc-400 font-medium">Online</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={clearChat}
            className="h-8 px-3 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-white/10 rounded-lg transition-all"
          >
            <Trash className="h-3.5 w-3.5 mr-1.5" />
            Clear
          </Button>
          <Button
            onClick={() => setIsChatOpen(false)}
            className="h-8 w-8 p-0 bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-sm">
            <div className="mb-5 p-5 bg-zinc-800/40 rounded-2xl border border-white/5">
              <MessageSquarePlus className="h-10 w-10 opacity-40" />
            </div>
            <p className="font-semibold text-zinc-400 text-base">Start a conversation</p>
            <p className="text-xs mt-2 text-zinc-600">Type <kbd className="px-2 py-0.5 bg-zinc-800 rounded text-blue-400 font-mono text-[11px]">@</kbd> followed by your query for AI</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
            />
          ))
        )}

        {rateLimitError && (
          <div className="flex justify-center animate-in fade-in duration-300">
            <div className="flex items-center gap-3 text-amber-400 text-xs py-2.5 px-4 rounded-xl bg-amber-900/20 border border-amber-500/20 backdrop-blur-sm">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-medium">{rateLimitError}</span>
              {cooldownSeconds > 0 && (
                <span className="font-mono font-bold text-amber-300">{cooldownSeconds}s</span>
              )}
            </div>
          </div>
        )}

        {isAIProcessing && (
          <div className="flex justify-start w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex gap-3 max-w-[90%] items-center">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              </div>
              <div className="bg-zinc-800 border border-white/5 px-4 py-2.5 rounded-xl flex items-center gap-3">
                <span className="text-[13px] text-zinc-300 font-medium animate-pulse">
                  {aiProcessingPhase}
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="p-4 bg-zinc-950 border-t border-white/5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="relative max-w-3xl mx-auto"
        >
          {/* Selection Context Preview */}
          {selectionContext && (
            <div className="mb-2 flex items-center gap-2.5 bg-zinc-800/70 border border-white/5 rounded-lg px-3 py-2.5 animate-in fade-in duration-200">
              <CornerDownRight size={14} className="text-zinc-500 flex-shrink-0" />
              <p className="flex-1 text-[13px] text-zinc-300 truncate">
                "{selectionContext}"
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectionContext(null);
                  setNewMessage("");
                }}
                className="text-zinc-500 hover:text-white transition-colors flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          )}
          {/* Unified Capsule Container */}
          <div className={`
             relative flex items-center p-1.5 
             bg-zinc-950 border border-white/10 
             rounded-[28px] shadow-xl 
             transition-all duration-300
             group
             focus-within:border-white/20 focus-within:shadow-white/5
             ${isReceivingContext ? 'ring-2 ring-blue-500/50 border-blue-500/50' : ''}
          `}>

            {/* Context Catch Animation Overlay */}
            {isReceivingContext && (
              <div className="absolute inset-0 rounded-[28px] bg-blue-500/10 animate-pulse pointer-events-none z-0" />
            )}

            {/* AI Mode Indicator (Inside, Left) */}
            {newMessage.trim().startsWith("@") && (
              <div className="pl-3 animate-in fade-in zoom-in slide-in-from-left-2 duration-300">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-wider shadow-inner">
                  <Sparkles className="w-3 h-3" />
                  AI Mode
                </div>
              </div>
            )}

            {/* Input Field */}
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={newMessage.trim().startsWith("@") ? "Ask AI anything..." : "Type @ to ask AI, or just chat..."}
              className={`
                  flex-1 bg-transparent border-none outline-none 
                  text-[13px] text-white placeholder-zinc-500 
                  h-9 px-3 w-full min-w-0 font-medium z-10
                  ${newMessage.trim().startsWith("@") ? "text-blue-100 placeholder-blue-500/40" : ""}
               `}
              autoComplete="off"
            />

            {/* Send Button (Right) */}
            <div className="flex-shrink-0 z-10">
              <button
                type="submit"
                disabled={isAIProcessing || !newMessage.trim() || cooldownSeconds > 0}
                className={`
                        w-8 h-8 rounded-full flex items-center justify-center 
                        transition-all duration-300 ease-out
                        ${newMessage.trim()
                    ? "bg-white text-black hover:scale-110 hover:rotate-3 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                    : "bg-zinc-800 text-zinc-600 cursor-not-allowed"}
                    `}
              >
                {isAIProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 ml-[2px]" strokeWidth={2} />
                )}
              </button>
            </div>
          </div>

          <div className="text-[10px] text-zinc-600 text-center mt-3 font-medium opacity-60">
            Press <kbd className="font-mono bg-zinc-800 px-1 py-0.5 rounded text-zinc-400">Enter</kbd> to send
          </div>
        </form>
      </div>
    </div>
  );
}

export default Chatroom;