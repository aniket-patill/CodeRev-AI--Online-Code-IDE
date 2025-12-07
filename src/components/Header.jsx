"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { auth, db } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { LayoutDashboard, Users } from "lucide-react";
import InviteNotification from "./InviteNotification";


const Header = ({ workspaceId }) => {
  const pathname = usePathname();
  const router = useRouter();

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

  const goToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-200 dark:border-white/10 shadow-lg">
      {/* Logo & Title */}
      <Link href="/dashboard" className="flex items-center gap-3 group">


        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
          CodeRev
        </h1>
      </Link>

      <InviteNotification />

      <div className="flex items-center gap-6">
        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-4">
          <Link
            href="/dashboard"
            className={`text-sm font-medium transition-colors ${pathname === "/dashboard"
              ? "text-zinc-900 dark:text-white"
              : "text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
          >
            Dashboard
          </Link>
          <Link
            href="/roadmap"
            className={`text-sm font-medium transition-colors flex items-center gap-2 ${pathname === "/roadmap"
              ? "text-zinc-900 dark:text-white"
              : "text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
          >
            <Users size={16} />
            Roadmap
          </Link>
        </nav>

        {/* Theme Toggle */}


        {/* Dashboard Button */}
        {pathname.startsWith("/workspace/") && (
          <Button
            onClick={goToDashboard}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-800/50 border border-zinc-300 dark:border-white/10 hover:bg-zinc-300 dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-white/20 text-zinc-900 dark:text-white font-medium rounded-lg transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Button>
        )}

        {/* Welcome Message */}
        <p className="text-sm text-zinc-700 dark:text-zinc-400">
          Welcome, <span className="font-medium text-zinc-900 dark:text-white">{userName}</span>
        </p>

        {/* Profile Avatar */}
        <Link href="/profile">
          <Avatar className="w-9 h-9 cursor-pointer border border-zinc-300 dark:border-white/20 transition-all duration-300 hover:border-zinc-400 dark:hover:border-white/40 hover:scale-105">
            <AvatarImage
              src={auth.currentUser?.photoURL || "/robotic.png"}
              alt="Profile"
            />
            <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white">U</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
};

export default Header;
