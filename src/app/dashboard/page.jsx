"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/config/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { Globe, Lock, Loader2, PlusCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import ShowMembers from "@/components/Members";
import InviteNotification from "@/components/InviteNotification";



const Dashboard = () => {
  // Router
  const router = useRouter();
  const user = auth.currentUser;

  // State management
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState(null);

  // Fetch workspaces on mount
  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchWorkspaces = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "workspaces"));

        const workspaceData = await Promise.all(
          querySnapshot.docs.map(async (workspaceDoc) => {
            const membersRef = collection(
              db,
              `workspaces/${workspaceDoc.id}/members`
            );
            const membersSnapshot = await getDocs(membersRef);

            const userMemberData = membersSnapshot.docs.find(
              (doc) => doc.data().userId === user.uid
            );

            if (!userMemberData) return null;

            return {
              id: workspaceDoc.id,
              ...workspaceDoc.data(),
              role: userMemberData.data().role || "Unknown",
            };
          })
        );

        setWorkspaces(workspaceData.filter(Boolean));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching spaces:", error);
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, [user, router]);

  // Create workspace handler
  const handleCreateWorkspace = async () => {
    if (!workspaceName || isCreating) return;

    try {
      setIsCreating(true);
      const workspaceRef = await addDoc(collection(db, "workspaces"), {
        name: workspaceName,
        isPublic,
      });

      const membersRef = collection(db, `workspaces/${workspaceRef.id}/members`);
      await setDoc(doc(membersRef, user.uid), {
        userId: user.uid,
        role: "owner",
        displayName: user.displayName || "Unknown",
        photoURL: user.photoURL || "/robotic.png",
      });

      const cursorsRef = doc(db, `workspaces/${workspaceRef.id}`);
      await setDoc(cursorsRef, { cursors: {} }, { merge: true });

      setWorkspaces([
        ...workspaces,
        { id: workspaceRef.id, name: workspaceName, isPublic, role: "owner" },
      ]);

      toast.success("Space created successfully!");
      setIsOpen(false);
      setWorkspaceName("");
    } catch (error) {
      toast.error("Failed to create space.");
    } finally {
      setIsCreating(false);
    }
  };

  // Delete workspace handler
  const deleteWorkspace = async (workspaceId) => {
    const confirmationToast = toast(
      <div className="flex justify-between items-center gap-4">
        <span>Are you sure you want to delete this space?</span>
        <div className="flex space-x-2">
          <Button
            onClick={async () => {
              try {
                setDeletingWorkspaceId(workspaceId);
                await deleteDoc(doc(db, `workspaces/${workspaceId}`));
                setWorkspaces(workspaces.filter((ws) => ws.id !== workspaceId));
                toast.success("Space deleted successfully!");
              } catch (error) {
                toast.error("Failed to delete space.");
              } finally {
                setDeletingWorkspaceId(null);
                toast.dismiss(confirmationToast);
              }
            }}
            className="bg-red-500 hover:bg-red-600 text-white h-8 px-3 rounded-lg"
            disabled={deletingWorkspaceId === workspaceId}
          >
            {deletingWorkspaceId === workspaceId ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Delete"
            )}
          </Button>
          <Button
            onClick={() => toast.dismiss(confirmationToast)}
            className="bg-zinc-700 hover:bg-zinc-600 text-white h-8 px-3 rounded-lg"
            disabled={deletingWorkspaceId === workspaceId}
          >
            Cancel
          </Button>
        </div>
      </div>,
      {
        ...toastOptions,
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        hideProgressBar: true,
      }
    );
  };

  return (
    <div className="min-h-screen w-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Radiant Glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />



      {/* Header */}
      <div className="relative z-10">
        <Header />
      </div>

      {/* Page Header */}
      <div className="relative z-10 flex justify-between items-center px-8 py-8 container mx-auto max-w-7xl">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-bold text-white tracking-tight">Your Spaces</h1>
          <p className="text-zinc-400">Manage and create your development environments</p>
        </div>

        <Button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-6 bg-white text-black font-semibold rounded-xl col-span-1 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-zinc-100 transition-all hover:scale-105 active:scale-95 border-0 text-base"
          disabled={isCreating}
        >
          {isCreating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <PlusCircle size={22} className="text-black" />
              <span>Create Space</span>
            </>
          )}
        </Button>
      </div>

      {/* Workspaces Grid */}
      <div className="relative z-10 flex-1 overflow-y-auto px-8 pb-8 container mx-auto max-w-7xl">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            <span className="ml-3 text-zinc-500">Loading spaces...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center h-[400px] text-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                  <Globe className="w-8 h-8 text-zinc-500 opacity-50" />
                </div>
                <p className="text-zinc-300 text-xl font-medium mb-2">No spaces found</p>
                <p className="text-zinc-500 mb-6 max-w-sm">You haven't created any development spaces yet. Start by creating one to begin coding.</p>
                <Button
                  onClick={() => setIsOpen(true)}
                  className="bg-white text-black hover:bg-zinc-200 px-6 py-2 rounded-lg font-medium"
                >
                  Create Your First Space
                </Button>
              </div>
            ) : (
              workspaces.map((ws) => (
                <Card
                  key={ws.id}
                  className="relative group border border-white/5 bg-zinc-900/40 backdrop-blur-xl rounded-2xl transition-all duration-300 hover:scale-[1.01] hover:border-blue-500/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <CardContent className="p-6 flex flex-col h-full justify-between gap-6">
                    <Link href={`/workspace/${ws.id}`} className="block flex-1 group/link">
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="p-3 bg-zinc-800/50 rounded-xl group-hover/link:bg-blue-500/10 group-hover/link:text-blue-400 transition-colors">
                            {ws.isPublic ? <Globe size={24} /> : <Lock size={24} />}
                          </div>
                          {ws.role === "owner" && (
                            <button
                              className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors z-20"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteWorkspace(ws.id);
                              }}
                              disabled={deletingWorkspaceId === ws.id}
                            >
                              {deletingWorkspaceId === ws.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          )}
                        </div>

                        <div>
                          <h2 className="text-xl font-bold text-white tracking-wide group-hover/link:text-blue-400 transition-colors mb-1 truncate">
                            {ws.name}
                          </h2>
                          <p className="text-sm text-zinc-500 font-medium flex items-center gap-2">
                            {ws.isPublic ? "Public Environment" : "Private Environment"}
                          </p>
                        </div>
                      </div>
                    </Link>

                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Role</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ws.role === 'owner' ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-800 text-zinc-400'}`}>
                          {ws.role}
                        </span>
                      </div>
                      <ShowMembers workspaceId={ws.id} />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Workspace Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild />
        <DialogContent className="bg-zinc-950/95 backdrop-blur-2xl border border-white/10 p-0 overflow-hidden rounded-2xl max-w-md shadow-2xl">
          <div className="p-6 border-b border-white/5 bg-zinc-900/30">
            <DialogTitle className="text-2xl font-bold text-white mb-1">
              Create New Space
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Set up a new development environment.
            </DialogDescription>
          </div>

          <div className="p-6 space-y-6">
            {/* Workspace Name Input */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">Space Name</label>
              <Input
                placeholder="e.g., My Awesome Project"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="bg-zinc-900 text-white border-white/10 focus:border-blue-500/50 focus:ring-blue-500/20 h-12 rounded-xl text-base"
              />
            </div>

            {/* Visibility Toggle */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1">Visibility</label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setIsPublic(true)}
                  className={`cursor-pointer rounded-xl border p-3 flex flex-col gap-2 transition-all ${isPublic ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/30' : 'bg-zinc-900 border-white/5 hover:bg-zinc-800'}`}
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Globe size={16} className={isPublic ? "text-blue-400" : "text-zinc-400"} />
                    Public
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight">Visible to anyone with the link.</p>
                </div>

                <div
                  onClick={() => setIsPublic(false)}
                  className={`cursor-pointer rounded-xl border p-3 flex flex-col gap-2 transition-all ${!isPublic ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/30' : 'bg-zinc-900 border-white/5 hover:bg-zinc-800'}`}
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Lock size={16} className={!isPublic ? "text-blue-400" : "text-zinc-400"} />
                    Private
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight">Only visible to you and members.</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setIsOpen(false);
                  setWorkspaceName("");
                }}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 h-12 rounded-xl font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateWorkspace}
                className="flex-1 items-center gap-2 bg-white text-black hover:bg-zinc-200 h-12 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                disabled={isCreating || !workspaceName}
              >
                {isCreating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Create Space"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Notifications - Bottom Right */}
      <InviteNotification />
    </div>
  );
};

export default Dashboard;