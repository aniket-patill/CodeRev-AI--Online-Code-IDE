/**
 * Python runner: Pyodide in a Web Worker.
 * Singleton worker, pre-fed stdin, 2s timeout, stdout/stderr collection.
 */

import type { ExecutionResult } from "./execution.types";
import { EXECUTION_TIMEOUT_MS } from "./execution.types";

const WORKER_POOL_SIZE = 3;
const workerPool: Worker[] = [];
const workerReady: boolean[] = [];
const initPromise: Promise<void>[] = [];

function getWorker(): Promise<Worker> {
  for (let i = 0; i < WORKER_POOL_SIZE; i++) {
    if (workerPool[i] && workerReady[i]) {
      return Promise.resolve(workerPool[i]);
    }
  }
  
  for (let i = 0; i < WORKER_POOL_SIZE; i++) {
    if (!workerPool[i]) {
      initPromise[i] = new Promise<void>((resolve, reject) => {
        workerPool[i] = new Worker("/workers/python.worker.js");
        workerReady[i] = false;
        const onReady = () => {
          workerReady[i] = true;
          workerPool[i]!.removeEventListener("message", onMessage);
          resolve();
        };
        const onMessage = (e: MessageEvent) => {
          if (e.data?.type === "ready") onReady();
          if (e.data?.type === "error") reject(new Error(e.data.data));
        };
        workerPool[i].addEventListener("message", onMessage);
        workerPool[i].addEventListener("error", (err) => {
          workerPool[i] = null;
          initPromise[i] = null;
          reject(err);
        });
      });
      return initPromise[i].then(() => workerPool[i]!);
    }
  }
  
  return initPromise[0].then(() => workerPool[0]!);
}

export async function runPython(
  code: string,
  input?: string
): Promise<ExecutionResult> {
  const start = Date.now();
  const result: ExecutionResult = {
    success: false,
    output: "",
    error: null,
    executionTime: 0,
  };

  try {
    const w = await getWorker();
    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];

    const done = new Promise<ExecutionResult>((resolve) => {
      const finish = (overrides: Partial<ExecutionResult>) => {
        clearTimeout(timeoutId);
        w.removeEventListener("message", handler);
        resolve({
          ...result,
          output: stdoutChunks.join(""),
          error:
            stderrChunks.length > 0
              ? stderrChunks.join("")
              : overrides.error ?? null,
          success: overrides.success ?? result.success,
          executionTime: Date.now() - start,
        });
      };

const timeoutId = setTimeout(() => {
        w.terminate();
        finish({ success: false, error: "Execution timed out" });
      }, EXECUTION_TIMEOUT_MS);

      const handler = (e: MessageEvent) => {
        const { type, data } = e.data ?? {};
        switch (type) {
          case "stdout":
            stdoutChunks.push(data ?? "");
            break;
          case "stderr":
            stderrChunks.push(data ?? "");
            break;
          case "exit":
            finish({ success: data === 0 });
            break;
          case "error":
            finish({ success: false, error: data ?? "Unknown error" });
            break;
        }
      };

      w.addEventListener("message", handler);
      w.postMessage({
        type: "run",
        code,
        stdin: input ?? "",
      });
    });

    return await done;
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    result.executionTime = Date.now() - start;
    return result;
  }
}
