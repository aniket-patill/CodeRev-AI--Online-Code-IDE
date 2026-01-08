"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthProvider";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, set, onValue, remove, off } from "firebase/database";
import { db, rtdb } from "@/config/firebase";
import { Mic, MicOff, Users } from "lucide-react";

const VoiceChat = ({ workspaceId }) => {
  const { user } = useAuth();
  const [isMuted, setIsMuted] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [participants, setParticipants] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [remoteAudioStreams, setRemoteAudioStreams] = useState({});
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [speakingUsers, setSpeakingUsers] = useState(new Set());
  const [showParticipants, setShowParticipants] = useState(false);
  const localAudioRef = useRef(null);
  const remoteAudioRefs = useRef({});

  // WebRTC references
  const peerConnectionsRef = useRef({});
  const localStreamRef = useRef(null);
  const signalingListenersRef = useRef({});
  const participantsListenerRef = useRef(null);
  const audioAnalysersRef = useRef({});
  const animationFrameRef = useRef(null);

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

  // Initialize audio capture - only when user explicitly requests it
  const initAudio = useCallback(async () => {
    if (!hasAccess || !user) return false;

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
      setMicPermissionDenied(false);
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }
      
      // Set up audio analyser for local user speaking detection
      if (stream && stream.getAudioTracks().length > 0) {
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.8;
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          audioAnalysersRef.current[user.uid] = { analyser, audioContext };
        } catch (err) {
          console.error("Error setting up local audio analyser:", err);
        }
      }
      
      return true;
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setMicPermissionDenied(true);
      setIsMuted(true); // Keep muted if permission denied
      return false;
    }
  }, [hasAccess, user]);

  // Cleanup audio stream on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    };
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback((userId) => {
    // Close existing connection if any
    if (peerConnectionsRef.current[userId]) {
      peerConnectionsRef.current[userId].close();
    }

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
      const stream = event.streams[0];
      // Create or update remote audio element for this user
      setRemoteAudioStreams(prev => ({
        ...prev,
        [userId]: stream
      }));
      
      // Set up audio analyser for speaking detection
      if (stream && stream.getAudioTracks().length > 0) {
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.8;
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          audioAnalysersRef.current[userId] = { analyser, audioContext };
        } catch (err) {
          console.error("Error setting up audio analyser:", err);
        }
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        console.log(`Connection with ${userId} ${peerConnection.connectionState}`);
        // Clean up failed connection
        if (peerConnection.connectionState === 'failed') {
          peerConnection.close();
          delete peerConnectionsRef.current[userId];
          setRemoteAudioStreams(prev => {
            const updated = { ...prev };
            delete updated[userId];
            return updated;
          });
          
          // Clean up audio analyser
          if (audioAnalysersRef.current[userId]) {
            try {
              audioAnalysersRef.current[userId].audioContext.close();
            } catch (e) {}
            delete audioAnalysersRef.current[userId];
          }
          
          // Clean up audio element
          if (remoteAudioRefs.current[userId]) {
            remoteAudioRefs.current[userId] = null;
          }
        }
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to remote peer via Firebase
        const signalingRef = ref(rtdb, `workspaces/${workspaceId}/voice/signaling/${userId}/${user.uid}/iceCandidate`);
        set(signalingRef, {
          candidate: event.candidate.toJSON(),
          timestamp: Date.now()
        }).catch(err => {
          console.error("Error sending ICE candidate:", err);
        });
      }
    };

    return peerConnection;
  }, [workspaceId, user]);

  // Handle incoming offers
  const handleOffer = useCallback(async (offer, fromUserId) => {
    if (!peerConnectionsRef.current[fromUserId]) {
      peerConnectionsRef.current[fromUserId] = createPeerConnection(fromUserId);
    }

    const peerConnection = peerConnectionsRef.current[fromUserId];

    try {
      // Check if already have a remote description
      if (peerConnection.remoteDescription) {
        console.log(`Already have remote description for ${fromUserId}, skipping offer`);
        return;
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      // Send answer back to the offerer
      const answerRef = ref(rtdb, `workspaces/${workspaceId}/voice/signaling/${fromUserId}/${user.uid}/answer`);
      set(answerRef, {
        answer: answer.toJSON(),
        timestamp: Date.now()
      }).catch(err => {
        console.error("Error sending answer:", err);
      });
    } catch (error) {
      console.error("Error handling offer:", error);
      // Clean up failed connection
      if (peerConnectionsRef.current[fromUserId]) {
        peerConnectionsRef.current[fromUserId].close();
        delete peerConnectionsRef.current[fromUserId];
      }
    }
  }, [workspaceId, user, createPeerConnection]);

  // Handle incoming answers
  const handleAnswer = useCallback(async (answer, fromUserId) => {
    if (peerConnectionsRef.current[fromUserId]) {
      try {
        // Check if already have a remote description
        if (peerConnectionsRef.current[fromUserId].remoteDescription) {
          console.log(`Already have remote description for ${fromUserId}, skipping answer`);
          return;
        }
        await peerConnectionsRef.current[fromUserId].setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      } catch (error) {
        console.error("Error handling answer:", error);
      }
    }
  }, []);

  // Handle incoming ICE candidates
  const handleIceCandidate = useCallback(async (candidate, fromUserId) => {
    if (peerConnectionsRef.current[fromUserId]) {
      try {
        await peerConnectionsRef.current[fromUserId].addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (error) {
        // Ignore errors for duplicate or already processed candidates
        if (error.name !== 'OperationError') {
          console.error("Error handling ICE candidate:", error);
        }
      }
    }
  }, []);

  // Create offer for new participant
  const createOffer = useCallback(async (toUserId) => {
    if (!localStreamRef.current) {
      console.log("No local stream available, cannot create offer");
      return;
    }

    if (!peerConnectionsRef.current[toUserId]) {
      peerConnectionsRef.current[toUserId] = createPeerConnection(toUserId);
    }

    const peerConnection = peerConnectionsRef.current[toUserId];

    try {
      // Check if already have a local description
      if (peerConnection.localDescription) {
        console.log(`Already have local description for ${toUserId}, skipping offer`);
        return;
      }

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer to remote peer via Firebase
      const offerRef = ref(rtdb, `workspaces/${workspaceId}/voice/signaling/${toUserId}/${user.uid}/offer`);
      set(offerRef, {
        offer: offer.toJSON(),
        timestamp: Date.now()
      }).catch(err => {
        console.error("Error sending offer:", err);
      });
    } catch (error) {
      console.error("Error creating offer:", error);
      // Clean up failed connection
      if (peerConnectionsRef.current[toUserId]) {
        peerConnectionsRef.current[toUserId].close();
        delete peerConnectionsRef.current[toUserId];
      }
    }
  }, [workspaceId, user, createPeerConnection]);

  // Manage user's voice status in Firebase
  useEffect(() => {
    if (!user || !workspaceId || !hasAccess) return;

    const userVoiceRef = ref(rtdb, `workspaces/${workspaceId}/voice/participants/${user.uid}`);

    // Update user's voice status periodically
    const updateStatus = () => {
      set(userVoiceRef, {
        isMuted: isMuted,
        displayName: user.displayName || "Anonymous",
        userId: user.uid,
        timestamp: Date.now()
      }).catch(err => {
        console.error("Error updating voice status:", err);
      });
    };

    updateStatus();
    // Update status every 10 seconds to keep connection alive
    const statusInterval = setInterval(updateStatus, 10000);

    // Update audio track mute status
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }

    // Clean up when component unmounts
    return () => {
      clearInterval(statusInterval);
      remove(userVoiceRef).catch(err => {
        console.error("Error removing voice status:", err);
      });
    };
  }, [user, workspaceId, isMuted, hasAccess]);

  // Listen for other participants and establish connections
  useEffect(() => {
    if (!workspaceId || !hasAccess || !user) return;

    const participantsRef = ref(rtdb, `workspaces/${workspaceId}/voice/participants`);

    const unsubscribe = onValue(participantsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const now = Date.now();
      
      // Filter out stale connections (older than 30 seconds)
      const activeParticipants = Object.fromEntries(
        Object.entries(data).filter(([_, participant]) =>
          now - participant.timestamp < 30000
        )
      );
      
      setParticipants(activeParticipants);

      // Clean up connections for participants who left
      Object.keys(peerConnectionsRef.current).forEach(userId => {
        if (userId !== user.uid && !activeParticipants[userId]) {
          // Participant left, clean up connection
          if (peerConnectionsRef.current[userId]) {
            peerConnectionsRef.current[userId].close();
            delete peerConnectionsRef.current[userId];
          }
          setRemoteAudioStreams(prev => {
            const updated = { ...prev };
            delete updated[userId];
            return updated;
          });
          
          // Clean up audio analyser
          if (audioAnalysersRef.current[userId]) {
            try {
              audioAnalysersRef.current[userId].audioContext.close();
            } catch (e) {}
            delete audioAnalysersRef.current[userId];
          }
          
          // Clean up audio element
          if (remoteAudioRefs.current[userId]) {
            remoteAudioRefs.current[userId] = null;
          }
        }
      });

      // Create connections with new participants
      Object.keys(activeParticipants).forEach(userId => {
        if (userId !== user.uid && !peerConnectionsRef.current[userId]) {
          // Only create offer if we have a local stream
          if (localStreamRef.current) {
            createOffer(userId);
          }
        }
      });
    });

    participantsListenerRef.current = unsubscribe;

    return () => {
      if (participantsListenerRef.current) {
        participantsListenerRef.current();
      }
    };
  }, [workspaceId, hasAccess, user, createOffer]);

  // Detect active speakers using audio levels
  useEffect(() => {
    if (Object.keys(audioAnalysersRef.current).length === 0) {
      return;
    }

    const detectSpeaking = () => {
      const newSpeakingUsers = new Set();
      const threshold = 30; // Adjust this value to change sensitivity

      Object.entries(audioAnalysersRef.current).forEach(([userId, { analyser }]) => {
        try {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);
          
          // Calculate average volume
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          
          // Check if user is speaking (above threshold and not muted)
          const participant = participants[userId];
          if (average > threshold && participant && !participant.isMuted) {
            newSpeakingUsers.add(userId);
          }
        } catch (err) {
          // Ignore errors
        }
      });

      setSpeakingUsers(newSpeakingUsers);
      animationFrameRef.current = requestAnimationFrame(detectSpeaking);
    };

    animationFrameRef.current = requestAnimationFrame(detectSpeaking);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [participants]);

  // Listen for signaling messages (offers, answers, ICE candidates)
  useEffect(() => {
    if (!workspaceId || !hasAccess || !user) return;

    // Listen for signaling messages
    const signalingRef = ref(rtdb, `workspaces/${workspaceId}/voice/signaling/${user.uid}`);
    const unsubscribeSignaling = onValue(signalingRef, (snapshot) => {
      const data = snapshot.val() || {};
      Object.entries(data).forEach(([fromUserId, signalingData]) => {
        if (!signalingData) return;
        
        if (signalingData.offer) {
          handleOffer(signalingData.offer, fromUserId);
        }
        if (signalingData.answer) {
          handleAnswer(signalingData.answer, fromUserId);
        }
        if (signalingData.iceCandidate) {
          handleIceCandidate(signalingData.iceCandidate.candidate, fromUserId);
        }
      });
    }, (error) => {
      console.error("Error listening to signaling:", error);
    });

    signalingListenersRef.current[user.uid] = unsubscribeSignaling;

    return () => {
      if (signalingListenersRef.current[user.uid]) {
        signalingListenersRef.current[user.uid]();
        delete signalingListenersRef.current[user.uid];
      }
    };
  }, [workspaceId, hasAccess, user, handleOffer, handleAnswer, handleIceCandidate]);

  // Cleanup peer connections on unmount
  useEffect(() => {
    return () => {
      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Close all peer connections
      Object.values(peerConnectionsRef.current).forEach(pc => {
        try {
          pc.close();
        } catch (err) {
          console.error("Error closing peer connection:", err);
        }
      });
      peerConnectionsRef.current = {};

      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      // Clean up all audio analysers
      Object.values(audioAnalysersRef.current).forEach(({ audioContext }) => {
        try {
          audioContext.close();
        } catch (e) {}
      });
      audioAnalysersRef.current = {};

      // Remove all signaling listeners
      Object.values(signalingListenersRef.current).forEach(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
      signalingListenersRef.current = {};

      // Remove participants listener
      if (participantsListenerRef.current) {
        participantsListenerRef.current();
        participantsListenerRef.current = null;
      }

      // Clean up user's voice status
      if (user && workspaceId) {
        const userVoiceRef = ref(rtdb, `workspaces/${workspaceId}/voice/participants/${user.uid}`);
        remove(userVoiceRef).catch(err => {
          console.error("Error cleaning up voice status:", err);
        });
      }
    };
  }, [user, workspaceId]);

  const toggleMute = async () => {
    if (isMuted && !localStreamRef.current) {
      // User wants to unmute, but we don't have a stream yet - request permission
      const success = await initAudio();
      if (success && localStreamRef.current) {
        setIsMuted(false);
      }
    } else {
      setIsMuted(!isMuted);
    }
  };

  if (!hasAccess) return null;

  // Get all participants except current user
  const otherParticipants = Object.entries(participants).filter(
    ([userId]) => userId !== user?.uid
  );

  // Get currently speaking user (most recent)
  const currentSpeaker = Array.from(speakingUsers)[0];

  return (
    <div className="fixed bottom-6 left-6 z-30 flex flex-col gap-2">
      {/* Participants panel */}
      {showParticipants && otherParticipants.length > 0 && (
        <div className="mb-2 bg-zinc-900/95 border border-white/10 rounded-lg p-3 backdrop-blur-md shadow-xl min-w-[200px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
              Participants ({otherParticipants.length + 1})
            </span>
            <button
              onClick={() => setShowParticipants(false)}
              className="text-zinc-500 hover:text-zinc-300 text-xs"
            >
              ×
            </button>
          </div>
          
          {/* Current user */}
          <div className="flex items-center gap-2 py-1.5 px-2 rounded mb-1 bg-zinc-800/50">
            <div className={`w-2 h-2 rounded-full ${isMuted ? 'bg-zinc-500' : 'bg-green-500'} ${!isMuted && speakingUsers.has(user?.uid) ? 'animate-pulse' : ''}`}></div>
            <span className="text-xs text-zinc-200 flex-1 truncate">
              {user?.displayName || "You"}
            </span>
            {isMuted ? (
              <MicOff size={12} className="text-zinc-500" />
            ) : (
              <Mic size={12} className="text-green-500" />
            )}
          </div>

          {/* Other participants */}
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {otherParticipants.map(([userId, participant]) => {
              const isSpeaking = speakingUsers.has(userId);
              const isMutedParticipant = participant.isMuted;
              
              return (
                <div
                  key={userId}
                  className={`flex items-center gap-2 py-1.5 px-2 rounded transition-all ${
                    isSpeaking
                      ? 'bg-green-500/20 border border-green-500/50'
                      : 'bg-zinc-800/30'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isMutedParticipant
                        ? 'bg-zinc-500'
                        : isSpeaking
                        ? 'bg-green-500 animate-pulse'
                        : 'bg-green-500/50'
                    }`}
                  ></div>
                  <span className="text-xs text-zinc-200 flex-1 truncate">
                    {participant.displayName || "Anonymous"}
                  </span>
                  {isMutedParticipant ? (
                    <MicOff size={12} className="text-zinc-500" />
                  ) : (
                    <Mic size={12} className="text-green-500" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active speaker indicator */}
      {currentSpeaker && participants[currentSpeaker] && (
        <div className="mb-2 flex items-center gap-2 bg-green-500/20 border border-green-500/50 px-3 py-2 rounded-lg backdrop-blur-md animate-pulse">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-green-400">
            {participants[currentSpeaker].displayName} is speaking
          </span>
        </div>
      )}

      {/* Control buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowParticipants(!showParticipants)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/90 border border-white/10 hover:bg-zinc-800 transition-colors"
          title="Show participants"
        >
          <Users size={16} className="text-zinc-400" />
          <span className="text-xs text-zinc-400">{otherParticipants.length + 1}</span>
        </button>

        <button
          onClick={toggleMute}
          disabled={micPermissionDenied}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all border ${
            micPermissionDenied
              ? "bg-red-900/50 hover:bg-red-900/70 text-red-400 border-red-500/30 cursor-not-allowed"
              : isMuted
              ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-white/10"
              : "bg-white text-black hover:bg-zinc-200 border-transparent shadow-white/10"
          }`}
          title={micPermissionDenied ? "Microphone permission denied. Please allow microphone access in your browser settings." : isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <MicOff size={16} />
          ) : (
            <Mic size={16} className={speakingUsers.has(user?.uid) ? "animate-pulse" : ""} />
          )}
          <span className="text-sm font-medium">
            {micPermissionDenied ? "Denied" : isMuted ? "Muted" : "Live"}
          </span>
        </button>
      </div>

      {/* Hidden audio element for local playback */}
      <audio ref={localAudioRef} autoPlay muted />

      {/* Hidden audio elements for remote playback */}
      {Object.entries(remoteAudioStreams).map(([userId, stream]) => (
        <audio
          key={userId}
          autoPlay
          ref={el => {
            if (el && stream) {
              el.srcObject = stream;
              remoteAudioRefs.current[userId] = el;
              // Ensure audio plays
              el.play().catch(err => {
                console.error(`Error playing audio for ${userId}:`, err);
              });
            }
          }}
        />
      ))}
    </div>
  );
};

export default VoiceChat;