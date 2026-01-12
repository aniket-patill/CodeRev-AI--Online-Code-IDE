import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

export async function POST(req) {
    try {
        const { accessToken, repoName, message, files } = await req.json();

        if (!accessToken || !repoName || !files) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const [owner, repo] = repoName.split("/");
        if (!owner || !repo) {
            return NextResponse.json({ error: "Invalid repo format. Use owner/repo" }, { status: 400 });
        }

        const octokit = new Octokit({ auth: accessToken });

        // 1. Get the current commit SHA of the main branch
        // Note: We assume 'main' branch. A more robust input would allow branch selection.
        let baseTreeSha = null;
        let parentCommitSha = null;

        try {
            const { data: refData } = await octokit.git.getRef({
                owner,
                repo,
                ref: "heads/main",
            });
            parentCommitSha = refData.object.sha;

            const { data: commitData } = await octokit.git.getCommit({
                owner,
                repo,
                commit_sha: parentCommitSha,
            });
            baseTreeSha = commitData.tree.sha;
        } catch (e) {
            // If ref doesn't exist (empty repo?), we might need to create it or handle differently.
            // For now, let's assume initialized repo.
            // If empty repo, error usually 409 or 404.
            console.warn("Could not fetch main branch", e);
            // Fallback: If it's a completely empty repo, we might just create a tree from scratch without base?
        }

        // 2. Create Blobs for each file
        const treeItems = [];

        for (const file of files) {
            // Skip empty paths
            if (!file.path) continue;

            // For text content
            const { data: blobData } = await octokit.git.createBlob({
                owner,
                repo,
                content: file.content,
                encoding: "utf-8",
            });

            treeItems.push({
                path: file.path,
                mode: "100644", // standard file
                type: "blob",
                sha: blobData.sha,
            });
        }

        // 3. Create a new Tree
        const { data: treeData } = await octokit.git.createTree({
            owner,
            repo,
            base_tree: baseTreeSha, // if null, creates new root (good for init, but risky if existing files needed)
            tree: treeItems,
        });

        // 4. Create Commit
        const { data: newCommitData } = await octokit.git.createCommit({
            owner,
            repo,
            message: message || "Update from CodeRev",
            tree: treeData.sha,
            parents: parentCommitSha ? [parentCommitSha] : [],
        });

        // 5. Update Reference (Force update? Safe update?)
        // Safe update usually.
        await octokit.git.updateRef({
            owner,
            repo,
            ref: "heads/main",
            sha: newCommitData.sha,
        });

        return NextResponse.json({ success: true, commitUrl: newCommitData.html_url });

    } catch (error) {
        console.error("GitHub API Error:", error);
        return NextResponse.json({
            error: error.message || "Failed to push to GitHub",
            details: error.response?.data
        }, { status: 500 });
    }
}
