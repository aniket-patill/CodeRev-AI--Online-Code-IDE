"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * TourTooltip - Floating tooltip that points to specific UI elements
 */
const TourTooltip = ({
    isVisible,
    targetId,
    title,
    description,
    step,
    totalSteps,
    onNext,
    onBack,
    onSkip,
    advanceOnTargetClick = false,
    position = "bottom",
    allowBack = true,
}) => {
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!isVisible || !targetId) {
            setIsReady(false);
            return;
        }

        const targetElement = document.getElementById(targetId);

        const calculatePosition = () => {
            if (!targetElement) {
                console.warn(`Target element with id "${targetId}" not found`);
                setIsReady(false);
                return;
            }

            const rect = targetElement.getBoundingClientRect();
            const tooltipWidth = 320;
            const tooltipHeight = 200;
            const offset = 20;

            let top = 0;
            let left = 0;

            switch (position) {
                case "bottom":
                    top = rect.bottom + offset;
                    left = rect.left + rect.width / 2 - tooltipWidth / 2;
                    break;
                case "top":
                    top = rect.top - tooltipHeight - offset;
                    left = rect.left + rect.width / 2 - tooltipWidth / 2;
                    break;
                case "left":
                    top = rect.top + rect.height / 2 - tooltipHeight / 2;
                    left = rect.left - tooltipWidth - offset;
                    break;
                case "right":
                    top = rect.top + rect.height / 2 - tooltipHeight / 2;
                    left = rect.right + offset;
                    break;
                default:
                    top = rect.bottom + offset;
                    left = rect.left + rect.width / 2 - tooltipWidth / 2;
            }

            // Keep tooltip within viewport
            const padding = 20;
            if (left < padding) left = padding;
            if (left + tooltipWidth > window.innerWidth - padding) {
                left = window.innerWidth - tooltipWidth - padding;
            }
            if (top < padding) top = padding;
            if (top + tooltipHeight > window.innerHeight - padding) {
                top = window.innerHeight - tooltipHeight - padding;
            }

            // Store dimensions accurately for the SVG cutout
            const targetRect = {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            };

            setTooltipPosition({ top, left, targetRect });
            setIsReady(true);
        };

        // Handle target click
        const handleTargetClick = () => {
            if (advanceOnTargetClick) {
                // Small delay to allow UI to update (e.g. modal open)
                setTimeout(() => {
                    onNext();
                }, 200);
            }
        };

        if (targetElement) {
            targetElement.addEventListener("click", handleTargetClick);
        }

        calculatePosition();
        window.addEventListener("resize", calculatePosition);
        window.addEventListener("scroll", calculatePosition);

        return () => {
            if (targetElement) {
                targetElement.removeEventListener("click", handleTargetClick);
            }
            window.removeEventListener("resize", calculatePosition);
            window.removeEventListener("scroll", calculatePosition);
        };
    }, [isVisible, targetId, position, advanceOnTargetClick, onNext]);

    // Calculate path for the SVG mask (cutout effect)
    const getMaskPath = () => {
        if (!tooltipPosition.targetRect) return "";
        const { left, top, width, height } = tooltipPosition.targetRect;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Padding around the element
        const padding = 8;
        const x = left - padding;
        const y = top - padding;
        const w = width + (padding * 2);
        const h = height + (padding * 2);
        const radius = 12; // Rounded corners for the highlight

        // SVG Path: Outer rectangle (screen) minus Inner rectangle (highlight)
        // Uses fill-rule="evenodd" to create the hole
        return `
            M 0 0 h ${windowWidth} v ${windowHeight} h -${windowWidth} Z 
            M ${x + radius} ${y} 
            h ${w - 2 * radius} 
            q ${radius} 0 ${radius} ${radius} 
            v ${h - 2 * radius} 
            q 0 ${radius} -${radius} ${radius} 
            h -${w - 2 * radius} 
            q -${radius} 0 -${radius} -${radius} 
            v -${h - 2 * radius} 
            q 0 -${radius} ${radius} -${radius} Z
        `;
    };

    return (
        <>
            <AnimatePresence>
                {isVisible && isReady && tooltipPosition.targetRect && (
                    <>
                        {/* SVG Spotlight Mask */}
                        <motion.svg
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-0 z-[9998] w-full h-full pointer-events-none"
                            style={{ overflow: 'visible' }}
                        >
                            <defs>
                                <mask id="spotlight-mask">
                                    <motion.path
                                        animate={{ d: getMaskPath() }}
                                        transition={{ duration: 0.8, ease: "easeInOut" }}
                                        fill="white"
                                        fillRule="evenodd"
                                    />
                                </mask>
                            </defs>

                            {/* Dark Overlay with Hole */}
                            <motion.path
                                animate={{ d: getMaskPath() }}
                                transition={{ duration: 0.8, ease: "easeInOut" }}
                                fill="rgba(0, 0, 0, 0.75)"
                                fillRule="evenodd"
                            />

                            {/* Accent Border around the hole */}
                            <motion.rect
                                animate={{
                                    x: tooltipPosition.targetRect.left - 8,
                                    y: tooltipPosition.targetRect.top - 8,
                                    width: tooltipPosition.targetRect.width + 16,
                                    height: tooltipPosition.targetRect.height + 16
                                }}
                                transition={{ duration: 0.8, ease: "easeInOut" }}
                                rx="12"
                                fill="none"
                                stroke="white"
                                strokeWidth="2"
                                strokeOpacity="0.5"
                                style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' }}
                            />
                        </motion.svg>

                        {/* Clickable Backdrop (Invisible, catches clicks outside) */}
                        <div
                            className="fixed inset-0 z-[9997]"
                            onClick={onSkip}
                        />

                        {/* Tooltip Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                                top: tooltipPosition.top,
                                left: tooltipPosition.left
                            }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{
                                duration: 0.8,
                                ease: "easeInOut",
                                // Springy scale/opacity for enter
                                opacity: { duration: 0.2 },
                                scale: { duration: 0.2 },
                                y: { duration: 0.2 }
                            }}
                            style={{
                                position: "fixed",
                                width: "320px",
                            }}
                            className="z-[9999]"
                        >
                            <div className="bg-[#1C1C1E] border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                                <div className="p-5">
                                    {/* Header with Progress Dots */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            {/* Step Counter with Dots */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                                                    Step {step} of {totalSteps}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    {Array.from({ length: totalSteps }).map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className={`h-1.5 rounded-full transition-all duration-300 ${i < step
                                                                    ? 'w-4 bg-blue-500'
                                                                    : i === step - 1
                                                                        ? 'w-6 bg-white'
                                                                        : 'w-1.5 bg-zinc-700'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-bold text-white">{title}</h3>
                                        </div>
                                        <button
                                            onClick={onSkip}
                                            className="text-zinc-500 hover:text-white transition-colors p-1 ml-2"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    {/* Description */}
                                    <p className="text-[13px] text-zinc-400 mb-5 leading-relaxed font-normal">
                                        {description}
                                    </p>

                                    {/* Navigation */}
                                    <div className="flex items-center justify-between">
                                        {allowBack && step > 1 ? (
                                            <button
                                                onClick={onBack}
                                                className="text-white/60 hover:text-white text-xs font-medium transition-colors px-2 py-1"
                                            >
                                                Back
                                            </button>
                                        ) : (
                                            <button
                                                onClick={onSkip}
                                                className="text-white/60 hover:text-white text-xs font-medium transition-colors px-2 py-1"
                                            >
                                                Skip
                                            </button>
                                        )}

                                        <button
                                            onClick={onNext}
                                            className="bg-white text-black px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-zinc-200 transition-colors"
                                        >
                                            {step === totalSteps ? "Finish" : "Next"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default TourTooltip;
