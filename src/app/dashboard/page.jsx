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
import { Globe, Lock, Loader2, PlusCircle, Trash2, FileText } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
import TestCreationModal from "@/components/test/TestCreationModal";
import TestCard from "@/components/test/TestCard";
import TestJoinModal from "@/components/test/TestJoinModal";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";





const Dashboard = () => {
  // Router
  const router = useRouter();
  const user = auth.currentUser;

  // State management
  const [workspaces, setWorkspaces] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null);
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState(null);
  const [activeTab, setActiveTab] = useState("spaces"); // "spaces" or "tests"

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
      } catch (error) {
        console.error("Error fetching spaces:", error);
      }
    };

    const fetchTests = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "tests"));
        const testData = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((test) => test.createdBy === user.uid);
        setTests(testData);
      } catch (error) {
        console.error("Error fetching tests:", error);
      }
    };

    Promise.all([fetchWorkspaces(), fetchTests()]).finally(() => {
      setLoading(false);
    });
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
  const handleDeleteButtonClick = (workspaceId) => {
    setWorkspaceToDelete(workspaceId);
    setIsDeleteOpen(true);
  };

  const confirmDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;

    try {
      setDeletingWorkspaceId(workspaceToDelete);
      await deleteDoc(doc(db, `workspaces/${workspaceToDelete}`));
      setWorkspaces(workspaces.filter((ws) => ws.id !== workspaceToDelete));
      toast.success("Space deleted successfully");
    } catch (error) {
      toast.error("Failed to delete space");
    } finally {
      setDeletingWorkspaceId(null);
      setIsDeleteOpen(false);
      setWorkspaceToDelete(null);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Radiant Glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />



      {/* Header */}
      <div className="relative z-10">
        <Header />
      </div>

      {/* Page Header */}
      <div id="dashboard-header" className="relative z-10 flex justify-between items-center px-8 py-8 container mx-auto max-w-7xl">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-bold text-white tracking-tight">Dashboard</h1>
          </div>
          <p className="text-zinc-400">Manage your spaces and tests</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsTestModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all hover:scale-105 active:scale-95 border-0"
          >
            <FileText size={20} />
            <span>Create Test</span>
          </Button>

          <Button
            onClick={() => setIsJoinModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-all hover:scale-105 active:scale-95 border border-white/10"
          >
            <span>Join Test</span>
          </Button>

          <Button
            id="create-space-btn"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-5 bg-white text-black font-semibold rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-zinc-100 transition-all hover:scale-105 active:scale-95 border-0"
            disabled={isCreating}
          >
            {isCreating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <PlusCircle size={20} />
                <span>Create Space</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative z-10 px-8 container mx-auto max-w-7xl mb-6">
        <div className="flex items-center gap-3">
          <div id="dashboard-tabs-container" className="flex gap-1 p-1 bg-zinc-900/50 rounded-xl w-fit border border-white/5">
            <button
              id="dashboard-spaces-tab"
              onClick={() => setActiveTab("spaces")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "spaces"
                ? "bg-white text-black"
                : "text-zinc-400 hover:text-white"
                }`}
            >
              Spaces ({workspaces.length})
            </button>
            <button
              id="dashboard-tests-tab"
              onClick={() => setActiveTab("tests")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "tests"
                ? "bg-white text-black"
                : "text-zinc-400 hover:text-white"
                }`}
            >
              Tests ({tests.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="relative z-10 flex-1 overflow-y-auto px-8 pb-8 container mx-auto max-w-7xl">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            <span className="ml-3 text-zinc-500">Loading...</span>
          </div>
        ) : activeTab === "spaces" ? (
          /* Spaces Grid */
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
                  className="relative group border border-white/10 bg-zinc-900 rounded-2xl transition-all duration-300 hover:scale-[1.01] hover:border-white/20 hover:shadow-2xl overflow-hidden flex flex-col"
                >
                  <CardContent className="p-6 flex flex-col h-full gap-6">
                    {/* Header with Icons */}
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl text-zinc-400 transition-colors">
                        {ws.isPublic ? <Globe size={20} /> : <Lock size={20} />}
                      </div>
                      {/* Delete Button */}
                      {ws.role === "owner" && (
                        <button
                          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors z-20"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteButtonClick(ws.id);
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

                    <Link href={`/workspace/${ws.id}`} className="block flex-1 group/link">
                      <div>
                        <h2 className="text-xl font-bold text-white tracking-tight mb-1 truncate group-hover/link:text-zinc-200 transition-colors">
                          {ws.name}
                        </h2>
                        <p className="text-sm text-zinc-500 font-medium flex items-center gap-2">
                          {ws.isPublic ? "Public Environment" : "Private Environment"}
                        </p>
                      </div>
                    </Link>

                    <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-auto">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-600">Role</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${ws.role === 'owner' ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-800 text-zinc-500'}`}>
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
        ) : (
          /* Tests Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center h-[400px] text-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-zinc-500 opacity-50" />
                </div>
                <p className="text-zinc-300 text-xl font-medium mb-2">No tests found</p>
                <p className="text-zinc-500 mb-6 max-w-sm">Create a test to assess your students or run a coding assessment.</p>
                <Button
                  onClick={() => setIsTestModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Create Your First Test
                </Button>
              </div>
            ) : (
              tests.map((test) => (
                <TestCard
                  key={test.id}
                  test={test}
                  onDelete={(deletedTestId) => {
                    setTests(prevTests => prevTests.filter(t => t.id !== deletedTestId));
                    toast.success("Test deleted successfully!");
                  }}
                />
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
                id="create-workspace-modal-name"
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
                id="create-workspace-confirm"
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

      {/* Minimal Delete Confirmation - Bottom Right */}
      <AnimatePresence>
        {isDeleteOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            className="fixed bottom-8 right-8 z-[100] w-full max-w-[320px]"
          >
            <div className="bg-zinc-950/90 backdrop-blur-xl border border-red-500/20 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="absolute top-0 right-0 p-8 bg-red-500/5 blur-2xl rounded-full" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </div>
                  <h3 className="font-bold text-white text-sm">Delete Space?</h3>
                </div>

                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                  This action is permanent and <span className="text-red-400 font-medium">cannot be undone</span>.
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setIsDeleteOpen(false);
                      setWorkspaceToDelete(null);
                    }}
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-400 h-9 rounded-xl text-xs font-medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmDeleteWorkspace}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white h-9 rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-red-900/20"
                    disabled={deletingWorkspaceId !== null}
                  >
                    {deletingWorkspaceId !== null ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Test Creation Modal */}
      <TestCreationModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />

      {/* Test Join Modal */}
      <TestJoinModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />

      {/* Invite Notifications - Bottom Right */}
      <InviteNotification />

      {/* Onboarding Flow */}
      <OnboardingFlow />


    </div>
  );
};

export default Dashboard;