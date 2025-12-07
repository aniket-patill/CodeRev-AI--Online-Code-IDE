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
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color
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
            className="absolute transition-all duration-100 ease-linear will-change-transform"
            style={{
              left: 0,
              top: 0,
              transform: `translate(${cursor.x}px, ${cursor.y}px)`,
            }}
          >
            {/* Cursor SVG */}
            <svg
              className="w-4 h-4 drop-shadow-md"
              viewBox="0 0 24 24"
              fill={cursor?.color || "#ffffff"}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* User Display Name */}
            <div
              className="absolute left-4 top-4 px-2 py-1 rounded-md text-[10px] font-medium text-white shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: cursor?.color || "#000" }}
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
