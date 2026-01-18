"use client";
import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * InfoTooltip - Contextual help tooltip for UI sections
 * Shows what a specific feature/section does when clicked
 */
const InfoTooltip = ({ title, description, position = "bottom" }) => {
    const [isOpen, setIsOpen] = useState(false);

    const positionClasses = {
        top: "bottom-full mb-2",
        bottom: "top-full mt-2",
        left: "right-full mr-2",
        right: "left-full ml-2",
    };

    return (
        <div className="relative inline-block">
            {/* Info Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 hover:bg-zinc-800/50 rounded-lg transition-colors text-zinc-500 hover:text-blue-400 group"
                title="Click for help"
            >
                <HelpCircle size={16} className="transition-transform group-hover:scale-110" />
            </button>

            {/* Tooltip Popup */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop with Blur */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Tooltip Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -5 }}
                            transition={{ duration: 0.15 }}
                            className={`absolute ${positionClasses[position]} left-0 z-[9999] w-72`}
                        >
                            <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                                {/* Header */}
                                <div className="flex items-start justify-between p-4 border-b border-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                            <HelpCircle size={16} className="text-blue-400" />
                                        </div>
                                        <h4 className="text-sm font-semibold text-white">{title}</h4>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 hover:bg-zinc-800/50 rounded-lg transition-colors text-zinc-500 hover:text-white"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <p className="text-xs text-zinc-300 leading-relaxed">
                                        {description}
                                    </p>
                                </div>

                                {/* Arrow */}
                                <div
                                    className={`absolute w-3 h-3 bg-zinc-900 border-white/10 transform rotate-45 ${position === "bottom"
                                        ? "-top-1.5 left-4 border-t border-l"
                                        : position === "top"
                                            ? "-bottom-1.5 left-4 border-b border-r"
                                            : position === "right"
                                                ? "-left-1.5 top-4 border-l border-b"
                                                : "-right-1.5 top-4 border-r border-t"
                                        }`}
                                />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InfoTooltip;
