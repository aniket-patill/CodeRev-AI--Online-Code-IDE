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
import { ClipboardDocumentIcon, CheckIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { MessageSquarePlus, Sparkles, Trash, X } from "lucide-react";

function Chatroom({ workspaceId, setIsChatOpen, editorInstance }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  // Null-safe auth access (prevents crash during hydration)
  const userId = auth.currentUser?.uid;
  const name = auth.currentUser?.displayName || "User";

  const messagesRef = collection(firestore, "messages");
  const messagesQuery = query(messagesRef, orderBy("createdAt"));

  const messagesEndRef = useRef(null);

  // Guard: If user is not authenticated, show message
  if (!userId) {
    return (
      <div className="flex flex-col h-full bg-zinc-900/95 backdrop-blur-xl border-l border-white/10 items-center justify-center p-6">
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

  const generateAIResponse = async (prompt, codeContext) => {
    setIsAIProcessing(true);
    try {
      const response = await fetch('/api/getChatResponse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: prompt, codeContext }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      return data.aiResponse;
    } catch (error) {
      console.error("API Error:", error);
      return "Sorry, I couldn't process that request. Please try again.";
    } finally {
      setIsAIProcessing(false);
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim() === "") return;

    const imageUrl = auth.currentUser.photoURL;
    const aiMatch = newMessage.match(/@(.+)/);
    let aiPrompt = null;
    let userMessage = newMessage;

    if (aiMatch) {
      aiPrompt = aiMatch[1].trim();
    }

    try {
      if (userMessage) {
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
          text: `🤖 ${aiResponse}`,
          createdAt: serverTimestamp(),
          imageUrl: "/ai-avatar.png",
          userId: "AI_BOT",
          name: "CodeRev AI",
          workspaceId,
        });
      }

      setNewMessage("");
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
      <div className={`flex flex-col gap-1 ${isCurrentUser ? "items-end" :
        isAI ? "items-center w-full" : "items-start"
        }`}>
        {!isAI && (
          <span className="text-xs text-zinc-400">
            {isCurrentUser ? "You" : msg.name}
          </span>
        )}

        <div className="flex justify-end gap-2 w-full">
          {!isCurrentUser && !isAI && (
            <img
              src={msg.imageUrl || "/robotic.png"}
              alt="Avatar"
              className="w-6 h-6 rounded-full flex-shrink-0 border border-white/10"
            />
          )}

          <div className={`py-3 px-4 text-sm rounded-2xl max-w-[85%] break-words ${isAI ? "bg-zinc-800/50 border border-white/10 w-full" :
            isCurrentUser ? "bg-white text-black" : "bg-zinc-800 text-white border border-white/10"
            }`}>
            {isAI && <span className="text-white mr-2">⚡</span>}

            {parseMessage(msg.text).map((part, index) => {
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
                          <CheckIcon className="h-3.5 w-3.5 text-green-400" />
                        ) : (
                          <ClipboardDocumentIcon className="h-3.5 w-3.5 text-zinc-300" />
                        )}
                      </button>
                    </div>
                    <div className="rounded-lg overflow-hidden border border-white/10">
                      <SyntaxHighlighter
                        language={part.lang}
                        style={vscDarkPlus}
                        customStyle={{
                          background: '#09090b', // zinc-950
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
            })}

            {isAI && (
              <div className="text-[10px] text-zinc-500 mt-2 font-medium uppercase tracking-wider">
                AI-generated response
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
    <div className="flex flex-col h-full bg-zinc-900/95 backdrop-blur-xl border-l border-white/10">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-white/10">
        <div className="flex items-center gap-3">

          <div>
            <h2 className="text-sm font-semibold text-white">CodeRev AI</h2>
            <p className="text-xs text-zinc-500">Your AI coding assistant</p>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-sm">
            <div className="mb-4 p-4 bg-zinc-800/50 rounded-full border border-white/5">
              <MessageSquarePlus className="h-8 w-8 opacity-50" />
            </div>
            <p className="font-medium text-zinc-400">Start a conversation</p>
            <p className="text-xs mt-1 text-zinc-600">Type @ followed by your query for AI</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
            />
          ))
        )}

        {isAIProcessing && (
          <div className="flex justify-center">
            <div className="flex items-center gap-3 text-zinc-400 text-xs py-2 px-4 rounded-full bg-zinc-800 border border-white/10">
              <div className="flex space-x-1">
                <div className="h-1.5 w-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="h-1.5 w-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="h-1.5 w-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="p-4 border-t border-white/10 bg-zinc-900/50">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (@ for AI)"
            className="flex-1 bg-zinc-800/50 border border-white/10 text-white placeholder:text-zinc-600 rounded-xl focus:border-white/20 focus:ring-0 h-11"
          />
          <Button
            type="submit"
            disabled={isAIProcessing || !newMessage.trim()}
            className="h-11 px-4 bg-white hover:bg-zinc-200 text-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Chatroom;