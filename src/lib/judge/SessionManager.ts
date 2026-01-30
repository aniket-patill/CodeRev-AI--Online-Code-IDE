import Docker from "dockerode";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { JUDGE_CONFIG, SESSION_TIMEOUT_MS } from "./config";

const docker = new Docker();

interface ContainerSession {
    containerId: string;
    language: string;
    lastUsed: number;
    hostPath: string; // The temp path on the host mounted to /code
    isExecuting: boolean;
}

// Global cache to persist across hot-reloads in dev
const globalForJudge = global as unknown as { judgeSessions: Map<string, ContainerSession> };
const sessions = globalForJudge.judgeSessions || new Map<string, ContainerSession>();
if (process.env.NODE_ENV !== "production") globalForJudge.judgeSessions = sessions;

export class SessionManager {
    /**
     * Get an existing session or create a new one.
     * A session is defined by userId + sessionId + language (since containers are language specific).
     */
    static async getSession(userId: string, sessionId: string, language: string): Promise<ContainerSession> {
        // Unique key for the session-language pair
        const key = `${userId}:${sessionId}:${language}`;

        // Check for existing valid session
        if (sessions.has(key)) {
            const session = sessions.get(key)!;
            try {
                const container = docker.getContainer(session.containerId);
                const info = await container.inspect();
                if (info.State.Running) {
                    session.lastUsed = Date.now();
                    return session;
                }
                // If not running, remove and recreate
                sessions.delete(key);
            } catch (e) {
                sessions.delete(key);
            }
        }

        // Create new session
        return await this.createSession(key, language);
    }

    private static async createSession(key: string, language: string): Promise<ContainerSession> {
        const config = JUDGE_CONFIG[language as keyof typeof JUDGE_CONFIG];
        if (!config) throw new Error(`Unsupported language: ${language}`);

        // Create unique host directory
        // We use a safe folder inside os.tmpdir
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "coderev-session-"));
        // Windows path fix for Docker bind
        const bindPath = process.platform === "win32" ? tmpDir.replace(/\\/g, "/") : tmpDir;

        // Create container
        // We run a dummy process to keep it alive: "tail -f /dev/null" or similar.
        // Ideally we use the language image.
        // We set limits.
        const container = await docker.createContainer({
            Image: config.image,
            Cmd: ["sh", "-c", "sleep infinity"], // Keep alive
            HostConfig: {
                Binds: [`${bindPath}:/code`], // Mount host dir to /code
                NetworkMode: "none", // No internet
                Memory: config.memoryLimitMb * 1024 * 1024,
                NanoCpus: config.cpuLimit * 1e9,
                AutoRemove: true, // Auto remove when stopped
            },
            WorkingDir: "/code",
            Tty: false,
        });

        await container.start();

        const session: ContainerSession = {
            containerId: container.id,
            language,
            lastUsed: Date.now(),
            hostPath: tmpDir, // Store the native path for fs operations
            isExecuting: false,
        };

        sessions.set(key, session);
        return session;
    }

    /**
     * Kill a session and clean up resources
     */
    static async killSession(key: string) {
        const session = sessions.get(key);
        if (!session) return;

        try {
            const container = docker.getContainer(session.containerId);
            await container.stop().catch(() => { }); // AutoRemove should handle removal
            await fs.rm(session.hostPath, { recursive: true, force: true }).catch(() => { });
        } catch (e) {
            console.error(`Failed to kill session ${key}`, e);
        } finally {
            sessions.delete(key);
        }
    }

    /**
     * Cleanup API to be called by a cron job
     */
    static async cleanupInactiveSessions() {
        const now = Date.now();
        for (const [key, session] of sessions.entries()) {
            if (now - session.lastUsed > SESSION_TIMEOUT_MS) {
                await this.killSession(key);
            }
        }
    }
}
