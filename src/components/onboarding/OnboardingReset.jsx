"use client";
import { useState } from "react";
import { auth } from "@/config/firebase";
import { updateOnboardingStatus } from "@/helpers/onboarding";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

/**
 * OnboardingReset - Developer tool to reset onboarding status
 * This allows testing the onboarding flow with existing accounts
 */
const OnboardingReset = () => {
    const [isResetting, setIsResetting] = useState(false);

    const handleReset = async () => {
        const user = auth.currentUser;
        if (!user) {
            toast.error("Please login first");
            return;
        }

        setIsResetting(true);
        try {
            // Reset all onboarding flags
            await updateOnboardingStatus(user.uid, {
                hasSeenWelcome: false,
                dashboardTourComplete: false,
                workspaceTourComplete: false,
                isSkipped: false,
            });

            toast.success("Onboarding reset! Refresh the page to see the tour.");
        } catch (error) {
            console.error("Error resetting onboarding:", error);
            toast.error("Failed to reset onboarding");
        } finally {
            setIsResetting(false);
        }
    };

    // Only show in development mode
    if (process.env.NODE_ENV !== "development") {
        return null;
    }

    return (
        <button
            onClick={handleReset}
            disabled={isResetting}
            className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-purple-400/20"
            title="Reset onboarding status (Dev only)"
        >
            <RotateCcw size={16} className={isResetting ? "animate-spin" : ""} />
            {isResetting ? "Resetting..." : "Reset Onboarding"}
        </button>
    );
};

export default OnboardingReset;
