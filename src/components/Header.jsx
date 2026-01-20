"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { auth, db } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { LayoutDashboard, Users, Zap, BookOpen, LayoutGrid, Share2, HelpCircle } from "lucide-react";
import { useWorkspaceSettings, MODES } from "@/context/WorkspaceSettingsContext";
import PomodoroTimer from "./PomodoroTimer";
import { updateOnboardingStatus } from "@/helpers/onboarding";
import { toast } from "sonner";

const ModeBadge = () => {
  const { mode, setMode } = useWorkspaceSettings();

  if (!mode) return null;

  const isFocus = mode === MODES.FOCUS;

  return (
    <button
      onClick={() => setMode(null)}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold
        transition-all duration-300 hover:scale-105
        ${isFocus
          ? "bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-500"
          : "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/40"
        }
      `}
      title="Click to change mode"
    >
      {isFocus ? <Zap className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
      {isFocus ? "Focus Mode" : "Learning Mode"}
    </button>
  );
};

const Header = ({ workspaceId }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isFocusMode } = useWorkspaceSettings();

  const [isPublic, setIsPublic] = useState(true);
  const [userName, setUserName] = useState("");

  // Fetch workspace details
  useEffect(() => {
    if (!workspaceId) return;

    const fetchWorkspaceDetails = async () => {
      try {
        const workspaceRef = doc(db, "workspaces", workspaceId);
        const workspaceSnap = await getDoc(workspaceRef);

        if (workspaceSnap.exists()) {
          setIsPublic(workspaceSnap.data().isPublic ?? true);
        }
      } catch (error) {
        console.error("Error fetching workspace:", error);
      }
    };

    fetchWorkspaceDetails();
  }, [workspaceId]);

  // Fetch user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setUserName(userSnap.data().displayName || user.email);
          } else {
            setUserName(user.displayName || user.email);
          }
        } catch (error) {
          console.error("Error fetching user info:", error);
          setUserName(user.displayName || user.email);
        }
      }
    };

    fetchUserInfo();
  }, []);

  const startTour = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast.error("Please login first");
      return;
    }

    try {
      // Reset onboarding status to trigger the tour
      await updateOnboardingStatus(user.uid, {
        hasSeenWelcome: false,
        dashboardTourComplete: false,
        workspaceTourComplete: false,
        isSkipped: false,
      });

      // Navigate to dashboard if not already there
      if (!pathname.startsWith("/dashboard")) {
        router.push("/dashboard");
        toast.success("Redirecting to dashboard to start tour...");
      } else {
        toast.success("Refresh the page to start the tour!");
      }

      // Reload page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error starting tour:", error);
      toast.error("Failed to start tour");
    }
  };

  const goToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <header className="flex items-center justify-between px-4 md:px-8 py-4 bg-zinc-900/50 backdrop-blur-xl border-b border-white/10 shadow-lg">
      {/* Logo & Title */}
      <Link href="/dashboard" className="flex items-center gap-3 group">


        <h1 className="text-lg font-bold text-white bg-[#0022ff] px-3 py-1 rounded-lg tracking-tight">
          CodeRev
        </h1>
      </Link>

      <div className="flex items-center gap-6">
        {/* Pomodoro Timer - Only in Focus Mode */}
        {isFocusMode && <PomodoroTimer />}

        {/* Navigation Links - Hide on workspace pages */}
        {!pathname.startsWith("/workspace/") && (
          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors ${pathname === "/dashboard"
                ? "text-white"
                : "text-zinc-400 hover:text-white"
                }`}
            >
              Dashboard
            </Link>
            <Link
              href="/roadmap"
              className={`text-sm hidden font-medium transition-colors flex items-center gap-2 ${pathname === "/roadmap"
                ? "text-white"
                : "text-zinc-400 hover:text-white"
                }`}
            >
              <Users size={16} />
              Roadmap
            </Link>
          </nav>
        )}

        {/* Dashboard Button - Only show on workspace pages */}
        {pathname.startsWith("/workspace/") && (
          <div className="flex items-center gap-3">
            <ModeBadge />



            <Button
              onClick={goToDashboard}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border border-white/10 hover:bg-zinc-800 hover:border-white/20 text-white font-medium rounded-lg transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </div>
        )}

        {/* Welcome Message */}
        <p className="hidden md:block text-sm text-zinc-400">
          Welcome, <span className="font-medium text-white">{userName}</span>
        </p>

        {/* Profile Avatar */}
        <Link href="/profile">
          <Avatar className="w-9 h-9 cursor-pointer border border-white/20 transition-all duration-300 hover:border-white/40 hover:scale-105">
            <AvatarImage
              src={auth.currentUser?.photoURL || "/robotic.png"}
              alt="Profile"
            />
            <AvatarFallback className="bg-zinc-800 text-white">U</AvatarFallback>
          </Avatar>
        </Link>
      </div>


    </header>
  );
};

export default Header;
