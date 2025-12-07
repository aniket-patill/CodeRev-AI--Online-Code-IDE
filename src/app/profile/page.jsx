"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "@/config/firebase";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logout from "@/helpers/logoutHelp";
import { FaArrowLeft } from "react-icons/fa";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [invites, setInvites] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      setEmail(currentUser.email);
      fetchInvites(currentUser.uid);
    } else {
      router.push("/login");
    }
  }, [router]);

  const fetchInvites = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setInvites(userSnap.data().invites || []);
      }
    } catch (error) {
      console.error("Error fetching invites:", error);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) return;
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset link sent to your email!");
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Error sending password reset email: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

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

      setInvites(invites.filter((id) => id !== workspaceId));
      toast.success("You have joined the workspace as a contributor!");
    } catch (error) {
      console.error("Error accepting invite:", error);
      toast.error("Error accepting invite!");
    }
  };

  const handleDeleteInvite = async (workspaceId) => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        invites: arrayRemove(workspaceId),
      });

      setInvites(invites.filter((id) => id !== workspaceId));
      toast.success("Invite deleted successfully.");
    } catch (error) {
      console.error("Error deleting invite:", error);
      toast.error("Error deleting invite!");
    }
  };

  const isGoogleUser = user && user.providerData.some((provider) => provider.providerId === "google.com");

  const handleGoBack = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-black text-white px-6 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Gradient Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-white/5 via-zinc-500/5 to-white/5 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden p-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-8">
          <Avatar className="w-20 h-20 mb-4 border-2 border-white/10 shadow-lg">
            <AvatarImage src={auth.currentUser?.photoURL || "/robotic.png"} alt="Profile" />
            <AvatarFallback className="bg-zinc-800 text-zinc-400">U</AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold text-white">{user?.displayName || "User"}</h1>
          <p className="text-sm text-zinc-400">{user?.email}</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-8">
          <Button
            onClick={handleGoBack}
            className="w-full bg-zinc-800/50 hover:bg-zinc-800 border border-white/10 text-white font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <FaArrowLeft className="text-sm" />
            Back to Dashboard
          </Button>

          {!isGoogleUser && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-white text-black hover:bg-zinc-200 font-semibold py-2 rounded-lg transition-all">
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 p-6 rounded-2xl">
                <DialogTitle className="text-xl font-semibold mb-2 text-white">Reset Password</DialogTitle>
                <DialogDescription className="text-sm text-zinc-400 mb-6">
                  Enter your email to receive a password reset link.
                </DialogDescription>
                <Input
                  type="email"
                  placeholder="Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mb-6 bg-zinc-800/50 text-white border border-white/10 focus:border-white/30 placeholder:text-zinc-500 h-11 rounded-lg"
                />
                <div className="flex justify-end gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setIsDialogOpen(false)}
                    className="bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white h-10 px-4 rounded-lg font-medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePasswordReset}
                    disabled={isLoading}
                    className="bg-white hover:bg-zinc-200 text-black h-10 px-4 rounded-lg font-medium disabled:opacity-50"
                  >
                    {isLoading ? "Sending..." : "Send Link"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Button
            onClick={logout}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium py-2 rounded-lg transition-all"
          >
            Logout
          </Button>
        </div>

        {/* Invitations Section */}
        <div className="pt-6 border-t border-white/10">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Pending Invitations</h2>
          {invites.length > 0 ? (
            <div className="space-y-3">
              {invites.map((workspaceId) => (
                <div key={workspaceId} className="bg-zinc-800/30 border border-white/5 p-3 rounded-lg flex justify-between items-center">
                  <span className="text-sm text-zinc-300 truncate max-w-[150px]">ID: {workspaceId}</span>
                  <div className="flex gap-2">
                    <Button
                      className="bg-white/10 hover:bg-white/20 text-white text-xs h-8 px-3 rounded-md"
                      onClick={() => handleAcceptInvite(workspaceId)}
                    >
                      Accept
                    </Button>
                    <Button
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs h-8 px-3 rounded-md"
                      onClick={() => handleDeleteInvite(workspaceId)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 text-center py-2">No pending invitations</p>
          )}
        </div>
      </div>

      <ToastContainer position="top-right" theme="dark" />
    </div>
  );
};

export default Profile;
