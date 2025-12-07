"use client";

import { useState } from "react";
import { loginWithEmailAndPassword, loginWithGoogle } from "@/helpers/loginHelp";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";
import Image from "next/image";
import { toast, ToastContainer } from "react-toastify";
import { auth, db } from "@/config/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import "react-toastify/dist/ReactToastify.css";
import ThemeToggle from "@/components/ui/ThemeToggle";

const toastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "dark",
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const user = await loginWithEmailAndPassword(email, password);
      console.log("Logged in as:", user.email);

      if (user) {
        toast.success("Login successful!", toastOptions);
        router.push("/dashboard");
      }
    } catch (error) {
      setError(error.message);
      toast.error("Login failed ", toastOptions);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      console.log("Logged in with Google:", user.displayName);

      if (user) {
        toast.success("Logged in with Google!", toastOptions);
        router.push("/dashboard");
      }
    } catch (error) {
      setError(error.message);
      toast.error("Google login failed ", toastOptions);
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
      toast.error("Error sending password reset email ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-white dark:bg-black text-zinc-900 dark:text-white px-6 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Gradient Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-zinc-200/20 via-zinc-500/5 to-zinc-200/20 dark:from-white/5 dark:via-zinc-500/5 dark:to-white/5 rounded-full blur-[120px]" />

      <ToastContainer theme="dark" />

      {/* Login Card */}
      <Card className="relative w-full max-w-md bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-white/10 shadow-2xl rounded-2xl overflow-hidden">
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
          <CardTitle className="text-3xl font-bold text-zinc-900 dark:text-white">Welcome Back</CardTitle>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">Sign in to continue to CodeRev</p>
        </CardHeader>

        <CardContent className="space-y-5 px-8 pb-8">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10 focus:border-zinc-400 dark:focus:border-white/30 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 h-11 rounded-lg transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10 focus:border-zinc-400 dark:focus:border-white/30 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 h-11 rounded-lg transition-all"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold rounded-lg transition-all hover:scale-[1.02]"
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white/50 dark:bg-zinc-900/50 text-zinc-500">OR CONTINUE WITH</span>
            </div>
          </div>

          <Button
            onClick={handleGoogleLogin}
            className="w-full h-11 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-white/20 text-zinc-900 dark:text-white font-semibold rounded-lg transition-all"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>

          <div className="flex items-center justify-between text-sm pt-2">
            <p className="text-zinc-600 dark:text-zinc-400">
              Don't have an account?{" "}
              <Link href="/register" className="text-zinc-900 dark:text-white hover:underline font-medium transition-colors">
                Sign Up
              </Link>
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="link"
                className="w-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm h-auto p-0 font-normal"
              >
                Forgot your password?
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-white/10 p-6 rounded-2xl">
              <DialogTitle className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">Reset Password</DialogTitle>
              <DialogDescription className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </DialogDescription>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-6 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10 focus:border-zinc-400 dark:focus:border-white/30 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 h-11 rounded-lg"
              />
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setIsDialogOpen(false)}
                  className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white h-10 px-4 rounded-lg font-medium"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePasswordReset}
                  disabled={isLoading}
                  className="bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black h-10 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
