"use client";
import { motion, AnimatePresence } from "framer-motion";


/**
 * WelcomeToast - Small bottom-left popup welcoming users
 */
const WelcomeToast = ({ isVisible, onStartTour, onSkip }) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="fixed bottom-6 left-6 z-[9999] max-w-sm"
                >
                    <div className="bg-[#1C1C1E] border border-white/10 rounded-xl shadow-2xl overflow-hidden p-5">
                        <div className="flex flex-col gap-3">
                            <div>
                                <h3 className="text-sm font-semibold text-white mb-1">
                                    Welcome to CodeRev AI
                                </h3>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Would you like a quick tour of the features?
                                </p>
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                                <button
                                    onClick={onStartTour}
                                    className="px-3 py-1.5 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors text-xs"
                                >
                                    Start Tour
                                </button>
                                <button
                                    onClick={onSkip}
                                    className="px-3 py-1.5 text-zinc-400 hover:text-white transition-colors text-xs"
                                >
                                    No thanks
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WelcomeToast;
