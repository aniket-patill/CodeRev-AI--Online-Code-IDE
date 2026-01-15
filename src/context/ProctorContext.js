"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

const ProctorContext = createContext();

// Violation types
export const VIOLATIONS = {
    FULLSCREEN_EXIT: "fullscreen_exit",
    TAB_SWITCH: "tab_switch",
    WINDOW_BLUR: "window_blur",
    DEVTOOLS_OPEN: "devtools_open",
    PASTE_ATTEMPT: "paste_attempt",
    RIGHT_CLICK: "right_click",
    KEYBOARD_SHORTCUT: "keyboard_shortcut",
    REFRESH_ATTEMPT: "refresh_attempt",
    SCREEN_CHANGE: "screen_change",
    IDLE_SUSPICIOUS: "idle_suspicious",
    FAST_INPUT: "fast_input",
};

// Violation severity
const SEVERITY = {
    WARNING: "warning",
    CRITICAL: "critical",
};

export const ProctorProvider = ({ children, onAutoSubmit, enabled = true }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [violations, setViolations] = useState([]);
    const [warningCount, setWarningCount] = useState(0);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [currentWarning, setCurrentWarning] = useState(null);
    const [isProctorActive, setIsProctorActive] = useState(false);

    // Refs for tracking
    const lastActivityRef = useRef(Date.now());
    const lastInputLengthRef = useRef(0);
    const devToolsOpenRef = useRef(false);

    // Log a violation
    const logViolation = useCallback((type, details = {}) => {
        const violation = {
            type,
            timestamp: new Date().toISOString(),
            details,
        };

        setViolations((prev) => [...prev, violation]);
        console.warn(`[PROCTOR] Violation: ${type}`, details);

        return violation;
    }, []);

    // Handle violation with warning system
    const handleViolation = useCallback((type, severity = SEVERITY.WARNING) => {
        logViolation(type);

        if (severity === SEVERITY.CRITICAL) {
            // Critical violations = immediate auto-submit
            onAutoSubmit?.("Critical violation: " + type);
            return;
        }

        setWarningCount((prev) => {
            const newCount = prev + 1;

            if (newCount >= 200) { // Increased limit significantly to prevent auto-submit
                // Second warning = auto-submit
                // onAutoSubmit?.("Multiple violations detected"); // DISABLED FOR STABILITY
            } else {
                // First warning = show modal
                // setCurrentWarning(type); // Optional: Disable warning modal too if annoying
                // setShowWarningModal(true);
            }

            return newCount;
        });
    }, [logViolation, onAutoSubmit]);

    // Enter fullscreen
    const enterFullscreen = useCallback(async () => {
        try {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                await elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                await elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) {
                await elem.msRequestFullscreen();
            }
            setIsFullscreen(true);
            return true;
        } catch (err) {
            console.error("Failed to enter fullscreen:", err);
            return false;
        }
    }, []);

    // Start proctoring
    const startProctoring = useCallback(async () => {
        const success = await enterFullscreen();
        if (success) {
            setIsProctorActive(true);
        }
        return success;
    }, [enterFullscreen]);

    // Dismiss warning modal
    const dismissWarning = useCallback(() => {
        setShowWarningModal(false);
        setCurrentWarning(null);
        // Re-enter fullscreen after warning
        enterFullscreen();
    }, [enterFullscreen]);

    // ============================================
    // EFFECT: Fullscreen change detection
    // ============================================
    useEffect(() => {
        if (!enabled || !isProctorActive) return;

        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = !!document.fullscreenElement;
            setIsFullscreen(isCurrentlyFullscreen);

            if (!isCurrentlyFullscreen && isProctorActive) {
                handleViolation(VIOLATIONS.FULLSCREEN_EXIT);
            }
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
        };
    }, [enabled, isProctorActive, handleViolation]);

    // ============================================
    // EFFECT: Tab/window visibility detection
    // ============================================
    useEffect(() => {
        if (!enabled || !isProctorActive) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleViolation(VIOLATIONS.TAB_SWITCH);
            }
        };

        const handleWindowBlur = () => {
            handleViolation(VIOLATIONS.WINDOW_BLUR);
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleWindowBlur);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleWindowBlur);
        };
    }, [enabled, isProctorActive, handleViolation]);

    // ============================================
    // EFFECT: Keyboard shortcut blocking
    // ============================================
    useEffect(() => {
        if (!enabled || !isProctorActive) return;

        const handleKeyDown = (e) => {
            if (!e || typeof e.getModifierState !== 'function') {
                // Safe check for valid keyboard event
                return;
            }

            // Block DevTools shortcuts
            if (
                e.key === "F12" ||
                (e.ctrlKey && e.shiftKey && e.key === "I") ||
                (e.ctrlKey && e.shiftKey && e.key === "C") ||
                (e.ctrlKey && e.shiftKey && e.key === "J")
            ) {
                e.preventDefault();
                handleViolation(VIOLATIONS.DEVTOOLS_OPEN);
                return;
            }

            // Block refresh shortcuts
            if (
                e.key === "F5" ||
                (e.ctrlKey && e.key === "r") ||
                (e.ctrlKey && e.key === "R")
            ) {
                e.preventDefault();
                handleViolation(VIOLATIONS.REFRESH_ATTEMPT, SEVERITY.CRITICAL);
                return;
            }

            // Block tab switching shortcuts
            if (
                (e.altKey && e.key === "Tab") ||
                (e.ctrlKey && e.key === "Tab") ||
                e.key === "Meta" || // Windows/Cmd key
                e.key === "Escape"
            ) {
                e.preventDefault();
                handleViolation(VIOLATIONS.KEYBOARD_SHORTCUT);
                return;
            }

            // Block copy/paste/cut
            if (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "x")) {
                // Allow Ctrl+C for copy within editor (read-only)
                // But block paste
                if (e.key === "v") {
                    // e.preventDefault(); // ALLOW PASTE FOR NOW
                    handleViolation(VIOLATIONS.PASTE_ATTEMPT);
                }
            }

            // Update last activity
            lastActivityRef.current = Date.now();
        };

        window.addEventListener("keydown", handleKeyDown, true);

        return () => {
            window.removeEventListener("keydown", handleKeyDown, true);
        };
    }, [enabled, isProctorActive, handleViolation]);

    // ============================================
    // EFFECT: Right-click and context menu blocking
    // ============================================
    useEffect(() => {
        if (!enabled || !isProctorActive) return;

        const handleContextMenu = (e) => {
            // e.preventDefault(); // ALLOW RIGHT CLICK FOR NOW
            handleViolation(VIOLATIONS.RIGHT_CLICK);
        };

        document.addEventListener("contextmenu", handleContextMenu);

        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
        };
    }, [enabled, isProctorActive, handleViolation]);

    // ============================================
    // EFFECT: Paste event blocking
    // ============================================
    useEffect(() => {
        if (!enabled || !isProctorActive) return;

        const handlePaste = (e) => {
            // e.preventDefault(); // ALLOW PASTE
            handleViolation(VIOLATIONS.PASTE_ATTEMPT);
        };

        const handleDrop = (e) => {
            // e.preventDefault(); // ALLOW DROP
            handleViolation(VIOLATIONS.PASTE_ATTEMPT);
        };

        document.addEventListener("paste", handlePaste);
        document.addEventListener("drop", handleDrop);

        return () => {
            document.removeEventListener("paste", handlePaste);
            document.removeEventListener("drop", handleDrop);
        };
    }, [enabled, isProctorActive, handleViolation]);

    // ============================================
    // EFFECT: DevTools detection via resize
    // ============================================
    useEffect(() => {
        if (!enabled || !isProctorActive) return;

        const threshold = 160;

        const checkDevTools = () => {
            const widthDiff = window.outerWidth - window.innerWidth;
            const heightDiff = window.outerHeight - window.innerHeight;

            const isDevToolsOpen = widthDiff > threshold || heightDiff > threshold;

            if (isDevToolsOpen && !devToolsOpenRef.current) {
                devToolsOpenRef.current = true;
                handleViolation(VIOLATIONS.DEVTOOLS_OPEN);
            } else if (!isDevToolsOpen) {
                devToolsOpenRef.current = false;
            }
        };

        const interval = setInterval(checkDevTools, 1000);

        return () => clearInterval(interval);
    }, [enabled, isProctorActive, handleViolation]);

    // ============================================
    // EFFECT: Screen/display change detection
    // ============================================
    useEffect(() => {
        if (!enabled || !isProctorActive) return;

        const initialScreens = window.screen?.availWidth;

        const handleResize = () => {
            // Detect significant resolution change (possible monitor switch)
            if (Math.abs(window.screen.availWidth - initialScreens) > 200) {
                logViolation(VIOLATIONS.SCREEN_CHANGE, {
                    previousWidth: initialScreens,
                    newWidth: window.screen.availWidth,
                });
            }
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [enabled, isProctorActive, logViolation]);

    // ============================================
    // EFFECT: Beforeunload prevention
    // ============================================
    useEffect(() => {
        if (!enabled || !isProctorActive) return;

        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = "Are you sure you want to leave? Your test will be submitted.";
            logViolation(VIOLATIONS.REFRESH_ATTEMPT);
            return e.returnValue;
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [enabled, isProctorActive, logViolation]);

    // ============================================
    // EFFECT: Text selection prevention
    // ============================================
    useEffect(() => {
        if (!enabled || !isProctorActive) return;

        const style = document.createElement("style");
        style.textContent = `
      * {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      .monaco-editor * {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
    `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, [enabled, isProctorActive]);

    return (
        <ProctorContext.Provider
            value={{
                isFullscreen,
                isProctorActive,
                violations,
                warningCount,
                showWarningModal,
                currentWarning,
                startProctoring,
                enterFullscreen,
                dismissWarning,
                logViolation,
                handleViolation,
            }}
        >
            {children}
        </ProctorContext.Provider>
    );
};

export const useProctor = () => {
    const context = useContext(ProctorContext);
    if (!context) {
        return {
            isFullscreen: false,
            isProctorActive: false,
            violations: [],
            warningCount: 0,
            showWarningModal: false,
            currentWarning: null,
            startProctoring: () => Promise.resolve(false),
            enterFullscreen: () => Promise.resolve(false),
            dismissWarning: () => { },
            logViolation: () => { },
            handleViolation: () => { },
        };
    }
    return context;
};
