"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Play, Pause, RotateCcw, Coffee, Zap, Settings, X, Volume2, Bell } from "lucide-react";

const PomodoroTimer = () => {
    // Default values
    const DEFAULT_FOCUS = 25;
    const DEFAULT_BREAK = 5;

    const [focusDuration, setFocusDuration] = useState(DEFAULT_FOCUS);
    const [breakDuration, setBreakDuration] = useState(DEFAULT_BREAK);

    const [timeLeft, setTimeLeft] = useState(DEFAULT_FOCUS * 60);
    const [isActive, setIsActive] = useState(false);
    const [isBreak, setIsBreak] = useState(false); // false = Focus, true = Break
    const [showSettings, setShowSettings] = useState(false);
    const [showCompletionModal, setShowCompletionModal] = useState(false);

    // Sound & Notification Refs
    const audioContextRef = useRef(null);

    // Request Notification Permission on mount
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // Update timer when settings change (if timer is not running)
    useEffect(() => {
        if (!isActive) {
            if (isBreak) {
                setTimeLeft(breakDuration * 60);
            } else {
                setTimeLeft(focusDuration * 60);
            }
        }
    }, [focusDuration, breakDuration]);

    // Timer Logic
    useEffect(() => {
        let interval = null;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prevTime) => prevTime - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            // Timer finished
            setIsActive(false);
            handleTimerComplete();
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const handleTimerComplete = () => {
        playSound();
        sendNotification();
        setShowCompletionModal(true);
    };

    const playSound = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext();
            }

            const ctx = audioContextRef.current;

            // Create a pleasant completion chime (C Major 7th ish)
            const notes = [523.25, 659.25, 783.99, 987.77]; // C5, E5, G5, B5
            const now = ctx.currentTime;

            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, now);

                // Staggered start for a strum effect
                const start = now + i * 0.05;

                // ADSR Envelope
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.1, start + 0.05); // Attack
                gain.gain.exponentialRampToValueAtTime(0.001, start + 1.5); // Decay

                osc.start(start);
                osc.stop(start + 1.5);
            });

        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    const sendNotification = () => {
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("CodeRev Timer", {
                body: isBreak ? "Break is over! Time to focus." : "Focus session complete! Take a break.",
                icon: "/favicon.ico", // Assuming fav icon exists, else fallback
            });
        }
    };

    // Initialize Audio Context on user interaction
    const initAudio = () => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext();
        }

        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
    };

    const toggleTimer = () => {
        if (!isActive) {
            initAudio(); // Initialize audio when starting
        }
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(isBreak ? breakDuration * 60 : focusDuration * 60);
    };

    const switchMode = () => {
        const nextModeIsBreak = !isBreak;
        setIsBreak(nextModeIsBreak);
        setTimeLeft(nextModeIsBreak ? breakDuration * 60 : focusDuration * 60);
        setIsActive(false);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // Portal logic for modal
    const ModalPortal = ({ children }) => {
        if (typeof document === 'undefined') return null;
        return createPortal(children, document.body);
    };

    // Main UI
    return (
        <div className="relative flex items-center gap-3 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-full shadow-lg">
            <button
                onClick={switchMode}
                className={`p-1.5 rounded-full transition-colors ${isBreak ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
                    }`}
                title={isBreak ? "Switch to Focus" : "Switch to Break"}
            >
                {isBreak ? <Coffee className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            </button>

            <div className="font-mono text-sm font-bold text-white w-[50px] text-center select-none">
                {formatTime(timeLeft)}
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={toggleTimer}
                    className="p-1 hover:text-white text-zinc-400 transition-colors"
                    title={isActive ? "Pause" : "Start"}
                >
                    {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                    onClick={resetTimer}
                    className="p-1 hover:text-white text-zinc-400 transition-colors"
                    title="Reset"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => setShowSettings(true)}
                    className="p-1 hover:text-white text-zinc-400 transition-colors ml-1 border-l border-white/5 pl-2"
                    title="Settings"
                >
                    <Settings className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Settings Dropdown */}
            {showSettings && (
                <div className="absolute top-full right-0 mt-2 flex flex-col gap-3 px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl shadow-lg min-w-[200px] animate-in slide-in-from-top-2 duration-200 z-[60]">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Timer Settings</span>
                        <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4">
                            <label className="text-sm text-zinc-300">Focus (min)</label>
                            <input
                                type="number"
                                min="1"
                                max="120"
                                value={focusDuration}
                                onChange={(e) => setFocusDuration(Number(e.target.value))}
                                className="w-12 bg-zinc-800 border border-white/10 rounded text-center text-sm py-1 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <label className="text-sm text-zinc-300">Break (min)</label>
                            <input
                                type="number"
                                min="1"
                                max="60"
                                value={breakDuration}
                                onChange={(e) => setBreakDuration(Number(e.target.value))}
                                className="w-12 bg-zinc-800 border border-white/10 rounded text-center text-sm py-1 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Time Up Popup - Teleported to Body */}
            {showCompletionModal && (
                <ModalPortal>
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                        {/* Overlay */}
                        <div className="absolute inset-0" onClick={() => setShowCompletionModal(false)} />

                        <div className="relative bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4 text-white">
                                {isBreak ? <Zap className="w-6 h-6" /> : <Coffee className="w-6 h-6" />}
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">Time is up!</h3>
                            <p className="text-zinc-400 mb-6">
                                {isBreak ? "Your break is over. Ready for another focus session?" : "Focus session complete. Time for a well-deserved break!"}
                            </p>

                            <div className="flex w-full gap-3">
                                <button
                                    onClick={() => setShowCompletionModal(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors"
                                >
                                    Dismiss
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCompletionModal(false);
                                        switchMode();
                                        setIsActive(true); // Automatically start the next session
                                    }}
                                    className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors"
                                >
                                    {isBreak ? "Start Focus" : "Start Break"}
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};

export default PomodoroTimer;
