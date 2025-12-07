"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

const ThemeToggle = ({ className = "" }) => {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme, resolvedTheme } = useTheme();

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // Return placeholder to prevent layout shift
        return (
            <button
                className={`relative w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center ${className}`}
                aria-label="Toggle theme"
            >
                <div className="w-4 h-4 rounded-full bg-zinc-600 animate-pulse" />
            </button>
        );
    }

    const isDark = resolvedTheme === "dark";

    const toggleTheme = () => {
        setTheme(isDark ? "light" : "dark");
    };

    return (
        <button
            onClick={toggleTheme}
            className={`
        group relative w-9 h-9 rounded-lg 
        bg-zinc-100 dark:bg-white/5 
        hover:bg-zinc-200 dark:hover:bg-white/10 
        border border-zinc-300 dark:border-white/10 
        hover:border-zinc-400 dark:hover:border-white/20
        backdrop-blur-sm
        flex items-center justify-center 
        transition-all duration-300 
        hover:scale-105
        ${className}
      `}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
            {/* Sun icon - shown in dark mode */}
            <Sun
                className={`
          absolute w-4 h-4 text-zinc-500 dark:text-zinc-400 
          group-hover:text-yellow-500 dark:group-hover:text-yellow-400
          transition-all duration-500 ease-out
          ${isDark
                        ? "opacity-100rotate-0 scale-100"
                        : "opacity-0 -rotate-90 scale-50"
                    }
        `}
            />

            {/* Moon icon - shown in light mode */}
            <Moon
                className={`
          absolute w-4 h-4 text-zinc-700 dark:text-zinc-600 
          group-hover:text-indigo-600 dark:group-hover:text-indigo-500
          transition-all duration-500 ease-out
          ${!isDark
                        ? "opacity-100 rotate-0 scale-100"
                        : "opacity-0 rotate-90 scale-50"
                    }
        `}
            />

            {/* Subtle glow effect on hover */}
            <div
                className={`
          absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100
          transition-opacity duration-300
          ${isDark
                        ? "bg-yellow-500/10"
                        : "bg-indigo-500/10"
                    }
        `}
            />
        </button>
    );
};

export default ThemeToggle;
