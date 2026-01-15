"use client";
import { useState, useEffect } from "react";
import { MessageSquarePlus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const TextSelectionMenu = ({ onAskAI, externalSelection }) => {
    const [position, setPosition] = useState(null);
    const [selectedText, setSelectedText] = useState("");
    const [isVisible, setIsVisible] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        if (externalSelection) {
            setPosition({ top: externalSelection.top, left: externalSelection.left });
            setSelectedText(externalSelection.text);
            setIsVisible(true);
            setIsSubmitted(false);
            return;
        } else {
            // If no external selection, ensure menu is hidden
            setIsVisible(false);
        }
    }, [externalSelection]);

    const handleAskAIClick = (e) => {
        e.stopPropagation();
        setIsSubmitted(true);
        // Small delay to allow start of animation before logic fires if needed,
        // but typically we can fire logic immediately. 
        // We'll fire logic after a tiny delay so the user sees the button start moving?
        // Actually, firing immediately is fine if the parent doesn't unmount us.

        // We set visible false to trigger exit animation
        setIsVisible(false);

        // Perform action after animation would essentially complete visually
        setTimeout(() => {
            if (externalSelection) {
                onAskAI(externalSelection);
            } else if (selectedText) {
                onAskAI(selectedText);
                // Clear selection after action
                window.getSelection().removeAllRanges();
            }
        }, 200);
    };

    if (!isVisible && !isSubmitted) return position ? null : null; // Keep null if really closed
    // Simplify: AnimatePresence handles the visual removal. 
    // We need to render the component if isVisible is true OR if it's animating out.
    // But AnimatePresence handles the conditional rendering of children.
    // So if render uses `isVisible` condition, we are good.

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    id="text-selection-menu"
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={isSubmitted
                        ? {
                            left: "50%",
                            top: "20%",
                            x: "-50%",
                            y: 0,
                            opacity: 0,
                            scale: 0.5,
                            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
                        }
                        : { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
                    }
                    style={{
                        position: "absolute",
                        top: position?.top,
                        left: position?.left,
                        zIndex: 9999,
                        transform: "translateX(-50%)"
                    }}
                    className="flex items-center p-1 pr-3 bg-zinc-900/90 border border-white/10 rounded-full shadow-2xl backdrop-blur-xl ring-1 ring-white/5"
                >
                    <button
                        onClick={handleAskAIClick}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white/90 hover:text-white transition-colors group relative overflow-hidden"
                    >
                        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                        <span className="relative z-10 flex items-center gap-2">

                            Ask AI
                        </span>
                    </button>


                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TextSelectionMenu;
