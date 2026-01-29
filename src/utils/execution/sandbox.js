import Docker from "dockerode";
import fs from "fs/promises";
import path from "path";
import os from "os";
import {
  LANGUAGE_CONFIG,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_MEMORY_MB,
  ALLOWED_LANGUAGES,
} from "./executionConfig.js";

const docker = new Docker();

/**
 * Run user code in an isolated Docker container.
 * @param {Object} options
 * @param {string} options.code - Source code to run
 * @param {string} options.language - Language key (python, javascript, java, cpp)
 * @param {string} [options.stdin=''] - Standard input for the process
 * @param {number} [options.timeoutMs] - Max execution time (ms)
 * @param {number} [options.memoryMB] - Memory limit (MB)
 * @returns {Promise<{ stdout: string, stderr: string, exitCode: number, timedOut: boolean }>}
 */
export async function runInSandbox({
  code,
  language,
  stdin = "",
  timeoutMs = DEFAULT_TIMEOUT_MS,
  memoryMB = DEFAULT_MEMORY_MB,
}) {
  if (!ALLOWED_LANGUAGES.includes(language)) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const config = LANGUAGE_CONFIG[language];
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "coderev-"));
  const codeFilePath = path.join(tmpDir, config.file);
  const inputFilePath = path.join(tmpDir, "input.txt");

  let container = null;

  try {
    await fs.writeFile(codeFilePath, code, "utf8");
    await fs.writeFile(inputFilePath, stdin, "utf8");

    const runCmd = ["sh", "-c", [...config.cmd].join(" ") + " < /code/input.txt"];
    const memoryBytes = memoryMB * 1024 * 1024;
    const bindPath = process.platform === "win32" ? tmpDir.replace(/\\/g, "/") : tmpDir;

    container = await docker.createContainer({
      Image: config.image,
      Cmd: runCmd,
      HostConfig: {
        Binds: [`${bindPath}:/code:ro`],
        NetworkMode: "none",
        Memory: memoryBytes,
        AutoRemove: false,
      },
      AttachStdout: true,
      AttachStderr: true,
    });

    await container.start();

    const waitResult = await Promise.race([
      container.wait(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("TIMEOUT")),
          timeoutMs
        )
      ),
    ]).catch((err) => {
      if (err.message === "TIMEOUT") return { timedOut: true };
      throw err;
    });

    const timedOut = waitResult?.timedOut === true;
    if (timedOut) {
      try {
        await container.kill();
      } catch {
        // already exited
      }
    }

    const logsStream = await container.logs({
      stdout: true,
      stderr: true,
      tail: 0,
    });
    const raw = await streamToBuffer(logsStream);
    const { stdout, stderr } = demuxDockerLogs(raw);

    const exitCode = timedOut ? -1 : waitResult?.StatusCode ?? -1;

    return {
      stdout,
      stderr,
      exitCode,
      timedOut,
    };
  } finally {
    if (container) {
      try {
        await container.remove({ force: true });
      } catch {
        // ignore
      }
    }
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

/** Collect a stream (or buffer) into a Buffer. */
function streamToBuffer(stream) {
  if (Buffer.isBuffer(stream)) return stream;
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

function demuxDockerLogs(buf) {
  let stdout = "";
  let stderr = "";
  let i = 0;
  const raw = Buffer.isBuffer(buf) ? buf : Buffer.from(buf, "utf8");

  while (i + 8 <= raw.length) {
    const stream = raw[i];
    const size = raw.readUInt32BE(i + 4);
    i += 8;
    if (i + size > raw.length) break;
    const chunk = raw.subarray(i, i + size).toString("utf8");
    i += size;
    if (stream === 1) {
      stdout += chunk;
    } else if (stream === 2) {
      stderr += chunk;
    }
  }

  return { stdout, stderr };
}
