import fs from "fs/promises";
import path from "path";
import { SessionManager } from "./SessionManager";
import { JUDGE_CONFIG, EXECUTION_TIMEOUT_MS } from "./config";
import { PYTHON_DRIVER_TEMPLATE } from "./runners/templates/python";
import { JAVASCRIPT_DRIVER_TEMPLATE } from "./runners/templates/javascript";
import { Verdict, ExecutionResult, TestCase } from "./types";
import Docker from "dockerode";

const docker = new Docker();

export class JudgeService {
    static async execute(
        userId: string,
        sessionId: string,
        language: string,
        code: string,
        testCases: TestCase[]
    ): Promise<ExecutionResult> {

        // 1. Get Session
        const session = await SessionManager.getSession(userId, sessionId, language);
        const config = JUDGE_CONFIG[language as keyof typeof JUDGE_CONFIG];

        if (!config) {
            return {
                verdict: "Internal Error",
                stdout: "",
                stderr: `Language ${language} not supported yet in JudgeService.`,
                timeMs: 0,
                memoryMb: 0
            };
        }

        // 2. Prepare Files
        const solutionFile = `solution.${config.extension}`; // e.g., solution.py
        const testsFile = "tests.json";

        let runnerContent = "";
        let runnerFile = "";
        let runCmd: string[] = [];

        if (language === "python") {
            runnerContent = PYTHON_DRIVER_TEMPLATE;
            runnerFile = "driver.py";
            runCmd = ["python3", "driver.py"];
        } else if (language === "javascript") {
            runnerContent = JAVASCRIPT_DRIVER_TEMPLATE;
            runnerFile = "driver.js";
            runCmd = ["node", "driver.js"];
        } else {
            // Fallback for not-yet-implemented languages
            return {
                verdict: "Internal Error",
                stdout: "",
                stderr: "Runner template not implemented.",
                timeMs: 0,
                memoryMb: 0
            };
        }

        // Write to host path (mounted to /code)
        await fs.writeFile(path.join(session.hostPath, solutionFile), code);
        await fs.writeFile(path.join(session.hostPath, testsFile), JSON.stringify(testCases));
        await fs.writeFile(path.join(session.hostPath, runnerFile), runnerContent);

        // 3. Execute in Container
        const container = docker.getContainer(session.containerId);

        const exec = await container.exec({
            Cmd: runCmd,
            AttachStdout: true,
            AttachStderr: true,
            WorkingDir: "/code",
        });

        const stream = await exec.start({ hijack: true, stdin: false });

        // 4. Capture Output with Timeout
        const output = await new Promise<{ stdout: string, stderr: string }>((resolve, reject) => {
            let stdout = "";
            let stderr = "";
            let finished = false;

            const timer = setTimeout(() => {
                if (!finished) {
                    finished = true;
                    stream.destroy(); // Cut connection
                    resolve({ stdout, stderr: stderr + "\nTime Limit Exceeded (System Hard Limit)" });
                }
            }, EXECUTION_TIMEOUT_MS + 1000); // Give slightly more than internal runner timeout

            // Demux Docker stream
            // container.modem.demuxStream(stream, process.stdout, process.stderr) style
            container.modem.demuxStream(stream, {
                write: (chunk: Buffer) => { stdout += chunk.toString('utf8'); }
            }, {
                write: (chunk: Buffer) => { stderr += chunk.toString('utf8'); }
            });

            stream.on('end', () => {
                if (!finished) {
                    finished = true;
                    clearTimeout(timer);
                    resolve({ stdout, stderr });
                }
            });

            // Also listen to close just in case
            stream.on('close', () => {
                if (!finished) {
                    finished = true;
                    clearTimeout(timer);
                    resolve({ stdout, stderr });
                }
            });
        });

        // 5. Parse Result
        try {
            // The runner prints JSON on the LAST line of stdout usually.
            // But users might print garbage. We look for the last valid JSON line.
            const lines = output.stdout.trim().split('\n');
            let jsonResult: any = null;

            // Search backwards for the result JSON
            for (let i = lines.length - 1; i >= 0; i--) {
                try {
                    const parsed = JSON.parse(lines[i]);
                    if (parsed.verdict && parsed.results) {
                        jsonResult = parsed;
                        break;
                    }
                } catch (e) {
                    // Not JSON
                }
            }

            if (jsonResult) {
                return {
                    verdict: jsonResult.verdict as Verdict,
                    stdout: output.stdout,
                    stderr: output.stderr + (jsonResult.stderr || ""), // Add runner stderr if any
                    timeMs: jsonResult.timeMs || 0,
                    memoryMb: 0,
                    testCaseResults: jsonResult.results
                };
            } else {
                throw new Error("No structured output found");
            }
        } catch (e) {
            return {
                verdict: "Runtime Error",
                stdout: output.stdout,
                stderr: output.stderr || "Execution failing without returning a system verdict.",
                timeMs: 0,
                memoryMb: 0
            };
        }
    }
}
