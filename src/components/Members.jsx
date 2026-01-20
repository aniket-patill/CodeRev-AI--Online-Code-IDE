"use client";

import { useState, useEffect, useRef } from "react";
import { collection, doc, onSnapshot, deleteDoc } from "firebase/firestore";
import { db, auth } from "@/config/firebase";
import { X, LogOut, Users } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ShowMembers({ workspaceId }) {
  const router = useRouter();
  const user = auth.currentUser;
  const membersRef = useRef(null);

  // State management
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Fetch members in realtime
  useEffect(() => {
    if (!workspaceId || !user) return;
    let unsubscribe;

    const fetchMembersRealtime = () => {
      setLoading(true);
      const membersCollectionRef = collection(db, `workspaces/${workspaceId}/members`);

      unsubscribe = onSnapshot(membersCollectionRef, async (snapshot) => {
        if (snapshot.empty) {
          setMembers([]);
          setLoading(false);
          return;
        }

        const membersData = snapshot.docs.map((docSnap) => {
          const { userId, role, displayName, photoURL } = docSnap.data();
          if (userId === user.uid) setUserRole(role);
          return {
            id: userId,
            displayName: displayName || "Unknown User",
            photoURL: photoURL || "/robotic.png",
            role: role || "Member",
          };
        });

        setMembers(membersData);
        setLoading(false);
      });
    };

    fetchMembersRealtime();
    return () => unsubscribe && unsubscribe();
  }, [workspaceId, user]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (membersRef.current && !membersRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const exitWorkspace = async () => {
    if (!user || !workspaceId) return;
    await deleteDoc(doc(db, `workspaces/${workspaceId}/members`, user.uid));
    router.push("/dashboard");
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Member Count & Avatars */}
      <div className="flex gap-2 items-center">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Users className="w-3.5 h-3.5" />
          <span>{members.length}</span>
        </div>

        <div className="flex -space-x-2 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          {members.slice(0, 4).map((member, index) => (
            <img
              key={member.id}
              src={member.photoURL || "/robotic.png"}
              alt={member.displayName}
              className="w-7 h-7 rounded-full border-2 border-zinc-900 hover:border-white/40 transition-all"
              style={{ zIndex: members.length - index }}
            />
          ))}
          {members.length > 4 && (
            <div className="w-7 h-7 flex items-center justify-center bg-zinc-800 text-white rounded-full border-2 border-zinc-900 text-[10px] font-medium">
              +{members.length - 4}
            </div>
          )}
        </div>
      </div>

      {/* Members Dropdown */}
      {isOpen && (
        <div
          ref={membersRef}
          className="absolute top-12 right-0 bg-zinc-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl w-72 md:w-80 z-50"
        >
          <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-3">
            <h3 className="text-white text-sm font-semibold">Space Members</h3>
            <button
              className="text-zinc-400 hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading && <div className="text-zinc-400 text-center text-sm py-4">Loading...</div>}

          <div className="max-h-60 overflow-y-auto space-y-1">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center p-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
              >
                <img
                  src={member.photoURL || "/robotic.png"}
                  alt={member.displayName}
                  className="w-8 h-8 rounded-full mr-3 border border-white/10"
                />
                <div className="flex-grow">
                  <p className="text-white text-sm font-medium">{member.displayName}</p>
                  <p className="text-zinc-400 text-xs capitalize">{member.role}</p>
                </div>
                {/* Exit button for current user (except owner) */}
                {member.id === user?.uid && userRole !== "owner" && (
                  <button
                    className="text-red-400 hover:text-red-500 transition-colors"
                    onClick={exitWorkspace}
                    title="Leave space"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
