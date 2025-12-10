"use client";

import { useEffect, useState } from "react";
import { onSnapshot, doc, updateDoc, arrayRemove, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthProvider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Loader2 } from "lucide-react";

const InviteNotification = () => {
  const { user } = useAuth();
  const [invites, setInvites] = useState([]);
  const [workspaceNames, setWorkspaceNames] = useState({});
  const [loadingAccept, setLoadingAccept] = useState(null);
  const [loadingDecline, setLoadingDecline] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        const inviteIds = docSnap.data().invites || [];
        setInvites(inviteIds);

        // Fetch workspace names
        const names = {};
        for (const id of inviteIds) {
          try {
            const workspaceRef = doc(db, "workspaces", id);
            const workspaceSnap = await getDoc(workspaceRef);
            if (workspaceSnap.exists()) {
              names[id] = workspaceSnap.data().name || id;
            } else {
              names[id] = id;
            }
          } catch {
            names[id] = id;
          }
        }
        setWorkspaceNames(names);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleAcceptInvite = async (workspaceId) => {
    if (!user) {
      toast.error("You must be logged in to accept invites");
      return;
    }

    setLoadingAccept(workspaceId);

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
      toast.success("Joined workspace successfully");
      router.push("/workspace/" + workspaceId);
    } catch (error) {
      console.error("Error accepting invite:", error);
      toast.error("Failed to accept invite");
    } finally {
      setLoadingAccept(null);
    }
  };

  const handleDeleteInvite = async (workspaceId) => {
    if (!user) return;

    setLoadingDecline(workspaceId);

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        invites: arrayRemove(workspaceId),
      });

      setInvites((prev) => prev.filter((id) => id !== workspaceId));
      toast.info("Invite declined");
    } catch (error) {
      console.error("Error deleting invite:", error);
      toast.error("Failed to decline invite");
    } finally {
      setLoadingDecline(null);
    }
  };

  if (invites.length === 0) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-4">
      <AnimatePresence>
        {invites.map((workspaceId) => (
          <motion.div
            key={workspaceId}
            initial={{ opacity: 0, y: 100, x: 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
          >
            <div className="w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-700 rounded-lg">
                    <Users size={16} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold text-white">Workspace Invite</span>
                </div>
                <button
                  onClick={() => setInvites((prev) => prev.filter((id) => id !== workspaceId))}
                  className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-zinc-400 text-sm mb-3">You&apos;ve been invited to join:</p>
                <div className="px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700 mb-4">
                  <span className="text-white text-base font-semibold truncate block">
                    {workspaceNames[workspaceId] || workspaceId}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleDeleteInvite(workspaceId)}
                    disabled={loadingDecline === workspaceId || loadingAccept === workspaceId}
                    className="flex-1 h-10 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg border border-zinc-700 disabled:opacity-50"
                  >
                    {loadingDecline === workspaceId ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Decline"
                    )}
                  </Button>
                  <Button
                    onClick={() => handleAcceptInvite(workspaceId)}
                    disabled={loadingAccept === workspaceId || loadingDecline === workspaceId}
                    className="flex-1 h-10 bg-white hover:bg-zinc-200 text-black text-sm font-semibold rounded-lg disabled:opacity-50"
                  >
                    {loadingAccept === workspaceId ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Accept"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default InviteNotification;