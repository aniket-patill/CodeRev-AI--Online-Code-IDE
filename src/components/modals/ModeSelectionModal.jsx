"use client";

import { useState } from "react";
import { Zap, BookOpen, Check } from "lucide-react";
import { MODES } from "@/context/WorkspaceSettingsContext";

const ModeCard = ({ title, description, icon: Icon, isSelected, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`group relative p-6 rounded-2xl border text-left transition-all duration-300 w-full md:w-80 flex flex-col gap-4
        ${isSelected
                    ? "bg-white/10 border-white/40 shadow-2xl shadow-blue-500/10 scale-105"
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]"
                }
      `}
        >
            <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300
          ${isSelected
                        ? "bg-white text-black"
                        : "bg-white/10 text-white group-hover:bg-white/20"
                    }
        `}
            >
                <Icon className="w-6 h-6" />
            </div>

            <div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
                    {description}
                </p>
            </div>

            {isSelected && (
                <div className="absolute top-4 right-4 text-green-400 animate-in fade-in zoom-in duration-300">
                    <Check className="w-5 h-5" />
                </div>
            )}
        </button>
    );
};

const ModeSelectionModal = ({ onSelect }) => {
    const [selected, setSelected] = useState(null);

    const handleConfirm = () => {
        if (selected) {
            onSelect(selected);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

            <div className="relative z-10 w-full max-w-4xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 delay-100">
                <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                        Choose Your Workflow
                    </h2>
                    <p className="text-zinc-400 text-lg">
                        How do you want to work today?
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-6 mb-10">
                    <ModeCard
                        title="Focus Mode"
                        description="Pure coding environment. No AI interactions, no distractions. Perfect for building muscle memory and deep work."
                        icon={Zap}
                        isSelected={selected === MODES.FOCUS}
                        onClick={() => setSelected(MODES.FOCUS)}
                    />
                    <ModeCard
                        title="Learning Mode"
                        description="Full AI assistance. Chat with CodeRev, generate code, and get explanations. Perfect for learning and rapid prototyping."
                        icon={BookOpen}
                        isSelected={selected === MODES.LEARNING}
                        onClick={() => setSelected(MODES.LEARNING)}
                    />
                </div>

                <button
                    onClick={handleConfirm}
                    disabled={!selected}
                    className={`
            h-12 px-10 rounded-xl font-bold text-sm transition-all duration-300
            ${selected
                            ? "bg-white text-black hover:scale-105 hover:shadow-lg hover:shadow-white/20 cursor-pointer"
                            : "bg-white/10 text-white/40 cursor-not-allowed"
                        }
          `}
                >
                    Enter Workspace
                </button>
            </div>
        </div>
    );
};

export default ModeSelectionModal;
