"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { auth } from "@/config/firebase";
import WelcomeToast from "./WelcomeToast";
import TourTooltip from "./TourTooltip";
import {
    getOnboardingStatus,
    skipOnboarding,
    markWelcomeSeen,
    markDashboardTourComplete,
    markWorkspaceTourComplete,
} from "@/helpers/onboarding";

// Tour configurations
const DASHBOARD_TOUR_STEPS = [
    {
        targetId: "dashboard-header",
        title: "Welcome to Dashboard",
        description: "This is your central command center. Here you can manage your projects, track your assessments, and collaborate with your team.",
        position: "bottom",
    },
    {
        targetId: "dashboard-tabs-container",
        title: "Spaces & Tests",
        description: "Switch between your coding workspaces ('Spaces') and your technical assessments ('Tests'). Keep your development and evaluation workflows organized in one place.",
        position: "bottom",
    },
    {
        targetId: "create-space-btn",
        title: "Start Building",
        description: "Click to create your first workspace. This will open the setup form.",
        position: "bottom",
        advanceOnTargetClick: true,
    },
];

const WORKSPACE_TOUR_STEPS = [
    {
        targetId: "left-panel",
        title: "File Explorer",
        description: "Manage your files and folders here. Create, rename, delete, and organize your project structure.",
        position: "right",
    },
    {
        targetId: "create-file-btn",
        title: "Create a File",
        description: "Let's write some code! Click this button to create your first file (e.g., index.js) and see the editor in action.",
        position: "bottom",
    },
    {
        targetId: "code-editor-wrapper",
        title: "Code Editor",
        description: "Your main coding area powered by Monaco Editor. Features intelligent autocomplete, syntax highlighting, and real-time collaboration.",
        position: "bottom",
    },
    {
        targetId: "bottom-panel",
        title: "Output & Documentation",
        description: "View code execution results, terminal output, and AI-generated documentation. Switch between tabs to access different tools.",
        position: "top",
    },
    {
        targetId: "invite-members-btn",
        title: "Real-time Collaboration",
        description: "Invite team members to code with you in real-time. Share your workspace and build together.",
        position: "bottom",
    },
    {
        targetId: "git-control-btn",
        title: "Git Integration",
        description: "Push your code to GitHub with a single click. Connect your repository and manage version control seamlessly.",
        position: "bottom",
    },
    {
        targetId: "chat-panel",
        title: "AI Assistant",
        description: "Get instant help with code explanations, debugging, and generation. Your AI pair programmer is always ready to assist!",
        position: "left",
    },
];

/**
 * OnboardingFlow - Main controller for the onboarding experience
 */
const OnboardingFlow = () => {
    const pathname = usePathname();
    const [showWelcome, setShowWelcome] = useState(false);
    const [showTour, setShowTour] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [tourType, setTourType] = useState(null); // 'dashboard' or 'workspace'
    const [onboardingStatus, setOnboardingStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Determine current tour steps
    const [activeTourSteps, setActiveTourSteps] = useState([]);

    // Load onboarding status
    useEffect(() => {
        const loadOnboardingStatus = async () => {
            const user = auth.currentUser;
            if (!user) {
                setIsLoading(false);
                return;
            }

            const status = await getOnboardingStatus(user.uid);
            setOnboardingStatus(status);
            setIsLoading(false);

            // Show welcome toast for ALL users who haven't completed or skipped
            // We removed !status.hasSeenWelcome so existing users see it too
            // Show welcome toast for ALL users who haven't completed
            // "Dont keep any user restrictions" -> We check only if tour is incomplete, ignoring skipped
            if (status) {
                const isDashboard = pathname === "/dashboard";
                const isWorkspace = pathname.startsWith("/workspace/");

                // For testing period: Always ask, regardless of completion status
                const shouldShow = isDashboard || isWorkspace;

                if (shouldShow) {
                    setTimeout(() => {
                        setShowWelcome(true);
                    }, 500);
                }
            }
        };

        loadOnboardingStatus();
    }, [pathname]);

    // Auto-start tour based on route
    useEffect(() => {
        if (isLoading || !onboardingStatus) return;

        const user = auth.currentUser;
        if (!user) return;

        // Auto-start Workspace tour ONLY if Dashboard tour is complete
        // This creates the "Continue after this one" effect
        if (pathname.startsWith("/workspace/")) {
            // Check if we should auto-start (Dashboard done, Workspace not done)
            // We ignore isSkipped here to ensure continuity if they click "Start Building"
            if (onboardingStatus.dashboardTourComplete && !onboardingStatus.workspaceTourComplete) {
                // Determine valid steps first (dynamic filtering)
                const validSteps = WORKSPACE_TOUR_STEPS.filter(step => !!document.getElementById(step.targetId));

                if (validSteps.length > 0) {
                    setTourType("workspace");
                    setActiveTourSteps(validSteps);
                    setCurrentStep(0);
                    setShowTour(true);
                    // Hide welcome toast if auto-starting
                    setShowWelcome(false);
                }
            }
        }
    }, [pathname, onboardingStatus, isLoading]);

    const handleStartTour = async () => {
        const user = auth.currentUser;
        if (!user) return;

        await markWelcomeSeen(user.uid);
        setShowWelcome(false);

        // Determine tour type and filter valid steps
        let rawSteps = [];
        let type = null;

        if (pathname === "/dashboard") {
            type = "dashboard";
            rawSteps = DASHBOARD_TOUR_STEPS;
        } else if (pathname.startsWith("/workspace/")) {
            type = "workspace";
            rawSteps = WORKSPACE_TOUR_STEPS;
        }

        if (type) {
            setTourType(type);
            // For Dashboard, we do NOT filter steps because some targets (modal) appear dynamically
            if (type === "dashboard") {
                setActiveTourSteps(rawSteps);
                setCurrentStep(0);
                setShowTour(true);
            } else {
                // For Workspace, we filter as before
                const validSteps = rawSteps.filter(step => !!document.getElementById(step.targetId));

                if (validSteps.length > 0) {
                    setActiveTourSteps(validSteps);
                    setCurrentStep(0);
                    setShowTour(true);
                } else {
                    console.warn("No valid tour steps found for this page.");
                }
            }
        }

        // Update local state
        setOnboardingStatus((prev) => ({
            ...prev,
            hasSeenWelcome: true,
        }));
    };

    const handleSkip = async () => {
        const user = auth.currentUser;
        if (!user) return;

        await skipOnboarding(user.uid);
        setShowWelcome(false);
        setShowTour(false);

        // Update local state
        // Update local state - do NOT mark as complete
        setOnboardingStatus((prev) => ({
            ...prev,
            hasSeenWelcome: true,
            isSkipped: true,
        }));
    };

    const handleNext = async () => {
        const user = auth.currentUser;
        if (!user) return;

        if (currentStep < activeTourSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // Tour complete
            setShowTour(false);

            if (tourType === "dashboard") {
                await markDashboardTourComplete(user.uid);
                setOnboardingStatus((prev) => ({
                    ...prev,
                    dashboardTourComplete: true,
                }));
            } else if (tourType === "workspace") {
                await markWorkspaceTourComplete(user.uid);
                setOnboardingStatus((prev) => ({
                    ...prev,
                    workspaceTourComplete: true,
                }));
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    if (isLoading) return null;

    const currentStepData = activeTourSteps[currentStep];

    return (
        <>
            <WelcomeToast
                isVisible={showWelcome}
                onStartTour={handleStartTour}
                onSkip={handleSkip}
            />

            {showTour && currentStepData && (
                <TourTooltip
                    isVisible={showTour}
                    targetId={currentStepData.targetId}
                    title={currentStepData.title}
                    description={currentStepData.description}
                    step={currentStep + 1}
                    totalSteps={activeTourSteps.length}
                    position={currentStepData.position}
                    onNext={handleNext}
                    onBack={handleBack}
                    onSkip={handleSkip}
                    advanceOnTargetClick={currentStepData.advanceOnTargetClick}
                    allowBack={tourType !== "workspace"}
                />
            )}
        </>
    );
};

export default OnboardingFlow;
