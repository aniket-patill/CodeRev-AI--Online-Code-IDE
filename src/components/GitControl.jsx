import { useState, useEffect } from "react";
import { Github, UploadCloud, Check, X, Loader2, GitBranch, AlertCircle } from "lucide-react";
import { linkWithPopup, signInWithPopup, GithubAuthProvider, reauthenticateWithPopup } from "firebase/auth";
import { auth, githubProvider } from "@/config/firebase";
import { createPortal } from "react-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";
import axios from "axios";

const GitControl = ({ isOpen, onClose, workspaceId }) => {
    const [step, setStep] = useState("auth"); // auth, form, pushing, success, error
    const [repoName, setRepoName] = useState("");
    const [commitMessage, setCommitMessage] = useState("Update from CodeRev");
    const [githubToken, setGithubToken] = useState(null);
    const [error, setError] = useState("");
    const [logs, setLogs] = useState([]);

    // Load token from storage (local or session)
    useEffect(() => {
        const storedToken = localStorage.getItem("coderev_github_token") || sessionStorage.getItem("coderev_github_token");
        if (storedToken) {
            setGithubToken(storedToken);
            setStep("form");
        }
    }, [isOpen]);

    const handleConnect = async () => {
        try {
            setError("");
            // detailed error handling for popup
            if (!auth.currentUser) {
                // If not logged in at all, sign in
                const result = await signInWithPopup(auth, githubProvider);
                const token = result._tokenResponse?.oauthAccessToken; // Undocumented but common in Firebase JS SDK
                // Or technically: const credential = GithubAuthProvider.credentialFromResult(result);
                const credential = GithubAuthProvider.credentialFromResult(result);
                const accessToken = credential.accessToken;

                if (accessToken) {
                    setGithubToken(accessToken);
                    localStorage.setItem("coderev_github_token", accessToken);
                    setStep("form");
                }
            } else {
                // Link to existing user
                try {
                    const result = await linkWithPopup(auth.currentUser, githubProvider);
                    const credential = GithubAuthProvider.credentialFromResult(result);
                    const accessToken = credential.accessToken;
                    if (accessToken) {
                        setGithubToken(accessToken);
                        localStorage.setItem("coderev_github_token", accessToken);
                        setStep("form");
                    }
                } catch (linkError) {
                    if (linkError.code === 'auth/credential-already-in-use') {
                        // Account already linked. We need to re-authenticate to get a fresh token.
                        try {
                            const result = await reauthenticateWithPopup(auth.currentUser, githubProvider);
                            const credential = GithubAuthProvider.credentialFromResult(result);
                            const accessToken = credential.accessToken;

                            if (accessToken) {
                                setGithubToken(accessToken);
                                sessionStorage.setItem("coderev_github_token", accessToken);
                                setStep("form");
                            }
                        } catch (reAuthError) {
                            console.error("Re-auth failed:", reAuthError);
                            // If popup blocked or failed, show dedicated re-auth UI
                            setStep("reauth");
                        }
                    } else {
                        throw linkError;
                    }
                }
            }
        } catch (err) {
            console.error("GitHub Auth Error:", err);
            setError(err.message || "Failed to connect to GitHub");
        }
    };

    const handleReAuth = async () => {
        try {
            setError("");
            const result = await reauthenticateWithPopup(auth.currentUser, githubProvider);
            const credential = GithubAuthProvider.credentialFromResult(result);
            const accessToken = credential.accessToken;

            if (accessToken) {
                setGithubToken(accessToken);
                localStorage.setItem("coderev_github_token", accessToken);
                setStep("form");
            }
        } catch (err) {
            console.error("Re-auth manual failed:", err);
            setError(err.message);
        }
    };

    const handlePush = async () => {
        let targetRepo = repoName.trim();

        // Extract owner/repo from URL if provided
        if (targetRepo.includes("github.com/")) {
            const match = targetRepo.match(/github\.com\/([^\/]+\/[^\/]+?)(\.git)?$/);
            if (match) {
                targetRepo = match[1];
            } else {
                setError("Invalid GitHub URL format.");
                return;
            }
        } else if (!targetRepo.includes("/")) {
            setError("Please enter a valid URL or 'username/repo'");
            return;
        }

        try {
            setStep("pushing");
            setLogs(prev => [...prev, "Fetching workspace files..."]);

            // 1. Fetch all files from Firestore
            const filesRef = collection(db, `workspaces/${workspaceId}/files`);
            const snapshot = await getDocs(filesRef);

            if (snapshot.empty) {
                throw new Error("No files to push!");
            }

            const files = snapshot.docs.map(doc => ({
                path: doc.data().name, // Assuming name is relative path or filename
                content: doc.data().content || ""
            }));

            setLogs(prev => [...prev, `Found ${files.length} files.`]);
            setLogs(prev => [...prev, "Pushing to GitHub..."]);

            // 2. Call API Route
            await axios.post("/api/github/push", {
                accessToken: githubToken,
                repoName: targetRepo,
                message: commitMessage,
                files
            });

            setStep("success");
        } catch (err) {
            console.error("Push Error:", err);
            setError(err.response?.data?.error || err.message || "Failed to push code");
            setStep("error");
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-900/50">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Github className="w-5 h-5" />
                        Git Control
                    </h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {step === "auth" && (
                        <div className="text-center py-4">
                            <p className="text-zinc-400 mb-6">
                                Connect your GitHub account to push your workspace code to a repository.
                            </p>
                            <button
                                onClick={handleConnect}
                                className="w-full py-3 bg-[#24292e] hover:bg-[#2f363d] text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                            >
                                <Github className="w-5 h-5" />
                                Connect GitHub
                            </button>
                            {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
                        </div>
                    )}

                    {step === "reauth" && (
                        <div className="text-center py-4">
                            <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Verification Required</h3>
                            <p className="text-zinc-400 mb-6 text-sm">
                                For security, GitHub requires you to verify your identity again to authorize the connection.
                            </p>
                            <button
                                onClick={handleReAuth}
                                className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-bold transition-colors"
                            >
                                Verify Identity
                            </button>
                            {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
                        </div>
                    )}

                    {step === "form" && (
                        <div className="space-y-4">
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                <div className="text-xs text-blue-200/80 space-y-1">
                                    <p className="font-medium text-blue-100">Before pushing:</p>
                                    <ul className="list-disc list-inside">
                                        <li>Ensure the repository <strong>already exists</strong> on GitHub.</li>
                                        <li>The repository should be <strong>empty</strong> to avoid conflicts.</li>
                                    </ul>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Repository URL</label>
                                <input
                                    type="text"
                                    placeholder="https://github.com/username/repo"
                                    value={repoName}
                                    onChange={(e) => setRepoName(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                                />
                                <p className="text-[10px] text-zinc-500 mt-1">Make sure the repository exists and is empty (or safe to update).</p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Commit Message</label>
                                <input
                                    type="text"
                                    value={commitMessage}
                                    onChange={(e) => setCommitMessage(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                                />
                            </div>

                            <button
                                onClick={handlePush}
                                disabled={!repoName}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors mt-2"
                            >
                                <UploadCloud className="w-5 h-5" />
                                Push to GitHub
                            </button>
                        </div>
                    )}

                    {step === "pushing" && (
                        <div className="text-center py-6">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <h3 className="text-white font-medium mb-2">Pushing Code...</h3>
                            <div className="text-xs text-zinc-500 font-mono text-left bg-black/40 p-3 rounded-lg max-h-32 overflow-y-auto">
                                {logs.map((log, i) => <div key={i}>{`> ${log}`}</div>)}
                            </div>
                        </div>
                    )}

                    {step === "success" && (
                        <div className="text-center py-6">
                            <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Push Complete!</h3>
                            <p className="text-zinc-400 mb-6">Your code has been successfully pushed to <strong>{repoName}</strong>.</p>
                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    )}

                    {step === "error" && (
                        <div className="text-center py-6">
                            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Push Failed</h3>
                            <p className="text-red-400 text-sm mb-6 bg-red-500/5 p-3 rounded-lg border border-red-500/10">{error}</p>
                            <button
                                onClick={() => setStep("form")}
                                className="w-full py-3 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>,
        document.body
    );
};

export default GitControl;
