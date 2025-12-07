"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthProvider";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, set, onValue, remove } from "firebase/database";
import { db, rtdb } from "@/config/firebase";
import { Mic, MicOff, Users } from "lucide-react";

const VoiceChat = ({ workspaceId }) => {
  const { user } = useAuth();
  const [isMuted, setIsMuted] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [participants, setParticipants] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [remoteAudioStreams, setRemoteAudioStreams] = useState({});
  const localAudioRef = useRef(null);

  // WebRTC references
  const peerConnectionsRef = useRef({});
  const localStreamRef = useRef(null);

  // Check if user is a member of this workspace
  useEffect(() => {
    const checkWorkspaceMembership = async () => {
      if (!user || !workspaceId) return;

      try {
        // Check if workspace exists
        const workspaceRef = doc(db, "workspaces", workspaceId);
        const workspaceSnap = await getDoc(workspaceRef);

        if (!workspaceSnap.exists()) {
          setHasAccess(false);
          return;
        }

        // Check if user is a member of this workspace
        const membersRef = collection(db, `workspaces/${workspaceId}/members`);
        const q = query(membersRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        setHasAccess(!querySnapshot.empty);
      } catch (error) {
        console.error("Error checking workspace membership:", error);
        setHasAccess(false);
      }
    };

    checkWorkspaceMembership();
  }, [user, workspaceId]);

  // Initialize audio capture
  useEffect(() => {
    if (!hasAccess || !user) return;

    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        setLocalStream(stream);
        localStreamRef.current = stream;
        if (localAudioRef.current) {
          localAudioRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    };

    initAudio();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [hasAccess, user]);

  // Create peer connection
  const createPeerConnection = (userId) => {
    const configuration = {
      iceServers: [
        {
          urls: [
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
          ],
        },
      ],
    };

    const peerConnection = new RTCPeerConnection(configuration);

    // Add local stream tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
      // Create or update remote audio element for this user
      setRemoteAudioStreams(prev => ({
        ...prev,
        [userId]: event.streams[0]
      }));
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to remote peer via Firebase
        const signalingRef = ref(rtdb, `workspaces/${workspaceId}/voice/signaling/${userId}/${user.uid}/iceCandidate`);
        set(signalingRef, {
          candidate: event.candidate.toJSON(),
          timestamp: Date.now()
        });
      }
    };

    return peerConnection;
  };

  // Handle incoming offers
  const handleOffer = async (offer, fromUserId) => {
    if (!peerConnectionsRef.current[fromUserId]) {
      peerConnectionsRef.current[fromUserId] = createPeerConnection(fromUserId);
    }

    const peerConnection = peerConnectionsRef.current[fromUserId];

    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      // Send answer back to the offerer
      const answerRef = ref(rtdb, `workspaces/${workspaceId}/voice/signaling/${fromUserId}/${user.uid}/answer`);
      set(answerRef, {
        answer: answer.toJSON(),
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  };

  // Handle incoming answers
  const handleAnswer = async (answer, fromUserId) => {
    if (peerConnectionsRef.current[fromUserId]) {
      try {
        await peerConnectionsRef.current[fromUserId].setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      } catch (error) {
        console.error("Error handling answer:", error);
      }
    }
  };

  // Handle incoming ICE candidates
  const handleIceCandidate = async (candidate, fromUserId) => {
    if (peerConnectionsRef.current[fromUserId]) {
      try {
        await peerConnectionsRef.current[fromUserId].addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (error) {
        console.error("Error handling ICE candidate:", error);
      }
    }
  };

  // Create offer for new participant
  const createOffer = async (toUserId) => {
    if (!peerConnectionsRef.current[toUserId]) {
      peerConnectionsRef.current[toUserId] = createPeerConnection(toUserId);
    }

    const peerConnection = peerConnectionsRef.current[toUserId];

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer to remote peer via Firebase
      const offerRef = ref(rtdb, `workspaces/${workspaceId}/voice/signaling/${toUserId}/${user.uid}/offer`);
      set(offerRef, {
        offer: offer.toJSON(),
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  };

  // Manage user's voice status in Firebase
  useEffect(() => {
    if (!user || !workspaceId || !hasAccess) return;

    const userVoiceRef = ref(rtdb, `workspaces/${workspaceId}/voice/participants/${user.uid}`);

    // Update user's voice status
    const updateStatus = () => {
      set(userVoiceRef, {
        isMuted: isMuted,
        displayName: user.displayName || "Anonymous",
        userId: user.uid,
        timestamp: Date.now()
      });
    };

    updateStatus();

    // Update audio track mute status
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }

    // Clean up when component unmounts
    return () => {
      remove(userVoiceRef);
    };
  }, [user, workspaceId, isMuted, hasAccess, localStream]);

  // Listen for other participants and establish connections
  useEffect(() => {
    if (!workspaceId || !hasAccess || !user) return;

    const participantsRef = ref(rtdb, `workspaces/${workspaceId}/voice/participants`);

    const unsubscribe = onValue(participantsRef, (snapshot) => {
      const data = snapshot.val() || {};
      // Filter out stale connections (older than 30 seconds)
      const activeParticipants = Object.fromEntries(
        Object.entries(data).filter(([_, participant]) =>
          Date.now() - participant.timestamp < 30000
        )
      );
      setParticipants(activeParticipants);

      // Create connections with new participants
      Object.keys(activeParticipants).forEach(userId => {
        if (userId !== user.uid && !peerConnectionsRef.current[userId]) {
          peerConnectionsRef.current[userId] = createPeerConnection(userId);
          // Create offer for new participant
          createOffer(userId);
        }
      });
    });

    return () => unsubscribe();
  }, [workspaceId, hasAccess, user]);

  // Listen for signaling messages (offers, answers, ICE candidates)
  useEffect(() => {
    if (!workspaceId || !hasAccess || !user) return;

    // Listen for offers
    const offersRef = ref(rtdb, `workspaces/${workspaceId}/voice/signaling/${user.uid}`);
    const unsubscribeOffers = onValue(offersRef, (snapshot) => {
      const data = snapshot.val() || {};
      Object.entries(data).forEach(([fromUserId, signalingData]) => {
        if (signalingData.offer) {
          handleOffer(signalingData.offer, fromUserId);
        }
        if (signalingData.answer) {
          handleAnswer(signalingData.answer, fromUserId);
        }
        if (signalingData.iceCandidate) {
          handleIceCandidate(signalingData.iceCandidate, fromUserId);
        }
      });
    });

    return () => unsubscribeOffers();
  }, [workspaceId, hasAccess, user]);

  // Cleanup peer connections on unmount
  useEffect(() => {
    return () => {
      // Close all peer connections
      Object.values(peerConnectionsRef.current).forEach(pc => {
        pc.close();
      });
    };
  }, []);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (!hasAccess) return null;

  // Count active unmuted participants
  const activeSpeakerCount = Object.values(participants).filter(
    p => !p.isMuted && p.userId !== user?.uid
  ).length;

  return (
    <div className="fixed bottom-6 left-6 z-30">
      {/* Show active speakers */}
      {activeSpeakerCount > 0 && (
        <div className="mb-2 flex flex-col gap-1">
          {Object.entries(participants).map(([userId, participant]) =>
            userId !== user?.uid && !participant.isMuted && (
              <div
                key={userId}
                className="flex items-center gap-2 bg-zinc-900/90 border border-white/10 px-3 py-1.5 rounded-full text-xs backdrop-blur-md"
              >
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-zinc-200">{participant.displayName}</span>
              </div>
            )
          )}
        </div>
      )}

      <button
        onClick={toggleMute}
        className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all border ${isMuted
            ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-white/10"
            : "bg-white text-black hover:bg-zinc-200 border-transparent shadow-white/10"
          }`}
      >
        {isMuted ? <MicOff size={16} /> : <Mic size={16} className="animate-pulse" />}
        <span className="text-sm font-medium">{isMuted ? "Muted" : "Live"}</span>
      </button>

      {/* Hidden audio element for local playback */}
      <audio ref={localAudioRef} autoPlay muted />

      {/* Hidden audio elements for remote playback */}
      {Object.entries(remoteAudioStreams).map(([userId, stream]) => (
        <audio
          key={userId}
          autoPlay
          ref={el => {
            if (el) el.srcObject = stream;
          }}
        />
      ))}
    </div>
  );
};

export default VoiceChat;