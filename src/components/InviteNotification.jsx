"use client";

import { useEffect, useState } from "react";
import { onSnapshot, doc, updateDoc, arrayRemove, setDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthProvider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail } from "lucide-react";

const InviteNotification = () => {
  const { user } = useAuth();
  const [invites, setInvites] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setInvites(docSnap.data().invites || []);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleAcceptInvite = async (workspaceId) => {
    if (!user) return;

    try {
      const membersRef = doc(db, `workspaces/${workspaceId}/members`, user.uid);
      await setDoc(membersRef, {
        userId: user.uid,
        role: "contributor",
        displayName: user.displayName || "Unknown",
        photoURL: user.photoURL || "/robotic.png",
      });

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        invites: arrayRemove(workspaceId),
      });

      setInvites((prev) => prev.filter((id) => id !== workspaceId));
      toast.success("Joined space successfully");
      router.push("/workspace/" + workspaceId);
    } catch (error) {
      console.error("Error accepting invite:", error);
    }
  };

  const handleDeleteInvite = async (workspaceId) => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        invites: arrayRemove(workspaceId),
      });

      setInvites((prev) => prev.filter((id) => id !== workspaceId));
      toast.info("Invite declined");
    } catch (error) {
      console.error("Error deleting invite:", error);
    }
  };

  return (
    <div className="fixed top-[80px] right-5 space-y-3 z-[100]">
      <AnimatePresence>
        {invites.map((workspaceId) => (
          <motion.div
            key={workspaceId}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative"
          >
            <div className="w-80 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
              <CardHeader className="p-4 pb-2 border-b border-white/5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/10 rounded-lg">
                      <Mail size={14} className="text-white" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-white">
                      Space Invite
                    </CardTitle>
                  </div>
                  <button
                    onClick={() => setInvites((prev) => prev.filter((id) => id !== workspaceId))}
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-zinc-400 text-xs mb-4 leading-relaxed">
                  You have been invited to join space:
                  <span className="block font-mono text-white mt-1.5 p-2 bg-zinc-800 rounded-lg border border-white/5 truncate text-xs">
                    {workspaceId}
                  </span>
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDeleteInvite(workspaceId)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/10 rounded-lg h-8 text-xs font-medium transition-all"
                  >
                    Decline
                  </Button>
                  <Button
                    onClick={() => handleAcceptInvite(workspaceId)}
                    className="flex-1 bg-white hover:bg-zinc-200 text-black rounded-lg h-8 text-xs font-medium transition-all shadow-lg shadow-white/5"
                  >
                    Accept
                  </Button>
                </div>
              </CardContent>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default InviteNotification;