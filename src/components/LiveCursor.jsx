"use client";

import { useEffect, useState } from "react";
import { getDatabase, ref, set, onValue, remove } from "firebase/database";
import { useAuth } from "@/context/AuthProvider";
import { rtdb } from "@/config/firebase";

const LiveCursor = ({ workspaceId }) => {
  const { user } = useAuth();
  const [cursors, setCursors] = useState({});

  useEffect(() => {
    if (!user || !workspaceId) return;

    const cursorRef = ref(rtdb, `workspaces/${workspaceId}/cursors/${user.uid}`);

    const handleMouseMove = (event) => {
      const { clientX, clientY } = event;

      // Update cursor position in Realtime Database
      set(cursorRef, {
        x: clientX,
        y: clientY,
        displayName: user.displayName || "Anonymous",
        color: "#18181b", // Minimal dark color
        timestamp: Date.now(),
      });
    };

    document.addEventListener("mousemove", handleMouseMove);

    // Cleanup: Remove cursor when user leaves
    const handleDisconnect = () => remove(cursorRef);
    window.addEventListener("beforeunload", handleDisconnect);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("beforeunload", handleDisconnect);
      remove(cursorRef); // Remove cursor on component unmount
    };
  }, [user, workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;

    const cursorsRef = ref(rtdb, `workspaces/${workspaceId}/cursors`);

    // Listen for real-time cursor updates
    const unsubscribe = onValue(cursorsRef, (snapshot) => {
      setCursors(snapshot.val() || {});
    });

    return () => unsubscribe();
  }, [workspaceId]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Object.entries(cursors).map(([userId, cursor]) =>
        userId !== user?.uid && cursor ? (
          <div
            key={userId}
            className="absolute transition-all duration-300 ease-out will-change-transform group"
            style={{
              left: 0,
              top: 0,
              transform: `translate(${cursor.x}px, ${cursor.y}px)`,
            }}
          >
            {/* Cursor SVG */}
            <svg
              className="w-5 h-5 drop-shadow-lg"
              viewBox="0 0 24 24"
              fill="#18181b"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* User Display Name - Always visible */}
            <div
              className="absolute left-5 top-0 px-2.5 py-1 rounded-md text-[11px] font-semibold text-white bg-zinc-900 border border-white/10 shadow-lg whitespace-nowrap"
            >
              {cursor?.displayName || "User"}
            </div>
          </div>
        ) : null
      )}
    </div>
  );
};

export default LiveCursor;
