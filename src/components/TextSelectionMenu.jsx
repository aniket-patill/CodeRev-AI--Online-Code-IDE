"use client";
import { useState, useEffect } from "react";
import { Sparkles, MessageSquarePlus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const TextSelectionMenu = ({ onAskAI, externalSelection }) => {
    const [position, setPosition] = useState(null);
    const [selectedText, setSelectedText] = useState("");
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (externalSelection) {
            setPosition({ top: externalSelection.top, left: externalSelection.left });
            setSelectedText(externalSelection.text);
            setIsVisible(true);
            return;
        }

        const handleSelectionChange = () => {
            const selection = window.getSelection();
            const text = selection.toString().trim();

            if (text.length > 0) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                // Calculate position (centered above selection)
                // Add scroll offsets
                const top = rect.top + window.scrollY - 50;
                const left = rect.left + window.scrollX + (rect.width / 2);

                // Only update if we have a valid distinct position
                setPosition({ top, left });
                setSelectedText(text);
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        // Use mouseup to finalize selection rather than selectionchange which fires rapidly
        document.addEventListener("mouseup", handleSelectionChange);
        // Also handle keyup for keyboard selection
        document.addEventListener("keyup", handleSelectionChange);

        // Hide on scroll to prevent floating weirdness
        window.addEventListener("scroll", () => setIsVisible(false));

        // Hide when clicking outside
        document.addEventListener("mousedown", (e) => {
            // If clicking the menu itself, don't hide immediately (handled by button click)
            if (e.target.closest("#text-selection-menu")) return;
            setIsVisible(false);
        });

        return () => {
            document.removeEventListener("mouseup", handleSelectionChange);
            document.removeEventListener("keyup", handleSelectionChange);
            window.removeEventListener("scroll", () => setIsVisible(false));
        };
    }, [externalSelection]);

    const handleAskAIClick = (e) => {
        e.stopPropagation(); // Prevent ensuring selection is lost immediately
        if (externalSelection) {
            onAskAI(externalSelection);
            setIsVisible(false);
        } else if (selectedText) {
            onAskAI(selectedText);
            // Clear selection after action
            window.getSelection().removeAllRanges();
            setIsVisible(false);
        }
    };

    if (!isVisible || !position) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    id="text-selection-menu"
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    style={{
                        position: "absolute",
                        top: position.top,
                        left: position.left,
                        zIndex: 9999,
                        transform: "translateX(-50%)"
                    }}
                    className="flex items-center gap-1 p-1 bg-zinc-900 border border-white/10 rounded-lg shadow-xl backdrop-blur-md"
                >
                    <button
                        onClick={handleAskAIClick}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 rounded-md transition-colors group"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:text-purple-300" />
                        Ask AI
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TextSelectionMenu;
