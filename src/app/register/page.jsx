"use client";

import { useState } from "react";
import { signUpUser, signInWithGoogle, verifyEmailCode } from "@/helpers/signUpHelp";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const toastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "dark",
};

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const router = useRouter();

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const res = await signUpUser(email, password, displayName);
      if (!res.success) {
        toast.error(res.message, toastOptions);
      } else {
        toast.success(res.message, toastOptions);
        setShowVerification(true);
      }
    } catch (error) {
      toast.error("Sign-up failed: " + error.message, toastOptions);
    }
    setLoading(false);
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) return;

    setLoading(true);
    try {
      const res = await verifyEmailCode(email, verificationCode, password, displayName);
      if (res.success) {
        toast.success("Account created successfully! Redirecting...", toastOptions);
        setVerificationCode("");
        router.push("/dashboard");
      } else {
        toast.error(res.message, toastOptions);
        setVerificationCode("");
      }
    } catch (error) {
      toast.error("Verification failed: " + error.message, toastOptions);
      setVerificationCode("");
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        router.push("/dashboard");
      } else {
        toast.error(res.error, toastOptions);
      }
    } catch (error) {
      toast.error("Google sign-in failed: " + error.message, toastOptions);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-black text-white px-6 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Gradient Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-white/5 via-zinc-500/5 to-white/5 rounded-full blur-[120px]" />

      <ToastContainer theme="dark" />

      {/* Signup Card */}
      <Card className="relative w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="text-center pb-4">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <Image
              src="/CodeRev_Logo.png"
              alt="CodeRev Logo"
              width={48}
              height={48}
              className="w-12 h-12 object-contain"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-white">Create Account</CardTitle>
          <p className="text-sm text-zinc-400 mt-2">Join CodeRev and start coding today</p>
        </CardHeader>

        <CardContent className="space-y-5 px-8 pb-8">
          <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400 font-medium">Display Name</label>
              <Input
                type="text"
                placeholder="John Doe"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-zinc-800/50 text-white border border-white/10 focus:border-white/30 placeholder:text-zinc-500 h-11 rounded-lg transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400 font-medium">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-800/50 text-white border border-white/10 focus:border-white/30 placeholder:text-zinc-500 h-11 rounded-lg transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400 font-medium">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-800/50 text-white border border-white/10 focus:border-white/30 placeholder:text-zinc-500 h-11 rounded-lg transition-all"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-white text-black hover:bg-zinc-200 font-semibold rounded-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? "Processing..." : "Create Account"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-zinc-900/50 text-zinc-500">OR CONTINUE WITH</span>
            </div>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-11 bg-zinc-800/50 border border-white/10 hover:bg-zinc-800 hover:border-white/20 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {loading ? "Processing..." : "Continue with Google"}
          </Button>

          <div className="flex items-center justify-center text-sm pt-2">
            <p className="text-zinc-400">
              Already have an account?{" "}
              <Link href="/login" className="text-white hover:underline font-medium transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={showVerification} onOpenChange={setShowVerification}>
        <DialogContent className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">Verify Your Email</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 mt-2">
              Enter the 6-digit verification code sent to <span className="text-white font-medium">{email}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm text-zinc-400 font-medium">Verification Code</Label>
              <Input
                type="text"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="bg-zinc-800/50 text-white border border-white/10 focus:border-white/30 placeholder:text-zinc-500 h-11 rounded-lg text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setShowVerification(false);
                setVerificationCode("");
              }}
              className="bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white h-10 px-4 rounded-lg font-medium"
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerifyCode}
              disabled={loading || !verificationCode}
              className="bg-white hover:bg-zinc-200 text-black h-10 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}