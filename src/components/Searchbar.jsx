"use client";
import { useState, useEffect, useRef } from "react";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "@/config/firebase";
import { UserPlus, X, Search, Mail, Check } from "lucide-react";

export default function SearchBar({ workspaceId }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [workspaceMembers, setWorkspaceMembers] = useState(new Set());
  const [invitedUsers, setInvitedUsers] = useState(new Set()); // Track invited users
  const auth = getAuth();
  const currentUserEmail = auth.currentUser?.email;
  const searchRef = useRef(null);

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceMembers();
    }
  }, [workspaceId]);

  useEffect(() => {
    if (searchTerm.length > 0) {
      fetchUsers(searchTerm.toLowerCase());
    } else {
      setUsers([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
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

  // Reset invited users when popup closes
  useEffect(() => {
    if (!isOpen) {
      setInvitedUsers(new Set());
    }
  }, [isOpen]);

  const fetchWorkspaceMembers = async () => {
    try {
      const membersQuery = collection(db, `workspaces/${workspaceId}/members`);
      const membersSnapshot = await getDocs(membersQuery);
      const membersSet = new Set(membersSnapshot.docs.map(doc => doc.id));
      setWorkspaceMembers(membersSet);
    } catch (error) {
      console.error("Error fetching space members:", error);
    }
  };

  const fetchUsers = async (term) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "users"),
        where("email", ">=", term),
        where("email", "<=", term + "\uf8ff")
      );

      const querySnapshot = await getDocs(q);
      let matchedUsers = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      matchedUsers = matchedUsers.filter(user => user.email !== currentUserEmail && !workspaceMembers.has(user.id));

      setUsers(matchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async (userId, userEmail) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        invites: arrayUnion(workspaceId),
      });

      // Mark user as invited
      setInvitedUsers(prev => new Set([...prev, userId]));
    } catch (error) {
      console.error("Error sending invitation:", error);
    }
  };

  return (
    <div className="relative flex items-center">
      <button
        ref={searchRef}
        className="flex items-center gap-2 px-3 py-1.5 bg-white text-black hover:bg-zinc-200 rounded-lg text-sm font-medium transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <UserPlus className="w-4 h-4" />
        <span className="hidden sm:inline">Invite</span>
      </button>

      {isOpen && (
        <div ref={searchRef} className="absolute top-10 right-0 bg-zinc-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl w-72 md:w-80 z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Invite Members</h3>
            <button
              className="text-zinc-400 hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-800/50 border border-white/10 text-white pl-9 pr-3 py-2 rounded-lg text-sm outline-none focus:border-white/30 transition-colors placeholder:text-zinc-600"
              autoFocus
            />
          </div>

          {loading && <div className="text-zinc-500 text-center text-xs py-2">Searching...</div>}

          <div className="max-h-60 overflow-y-auto space-y-1">
            {users.length > 0 ? (
              users.map((user) => (
                <div key={user.id} className="flex justify-between items-center p-2 hover:bg-zinc-800/50 rounded-lg transition-colors group">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-white/10">
                      <Mail className="w-3 h-3 text-zinc-400" />
                    </div>
                    <span className="text-zinc-300 text-sm truncate">{user.email}</span>
                  </div>
                  {invitedUsers.has(user.id) ? (
                    <span className="flex items-center gap-1 px-3 py-1 bg-zinc-800 text-zinc-400 text-xs font-medium rounded-md">
                      <Check className="w-3 h-3" />
                      Done
                    </span>
                  ) : (
                    <button
                      className="px-3 py-1 bg-white text-black text-xs font-medium rounded-md hover:bg-zinc-200 transition-colors opacity-0 group-hover:opacity-100"
                      onClick={() => inviteUser(user.id, user.email)}
                    >
                      Add
                    </button>
                  )}
                </div>
              ))
            ) : searchTerm.length > 0 && !loading ? (
              <div className="text-center py-4 text-zinc-500 text-xs">
                No users found
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
