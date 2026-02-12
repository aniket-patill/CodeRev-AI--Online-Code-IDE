/**
 * C++ runner: sends code to compile API (emcc container), then runs WASM in worker.
 * 2s timeout, optional WASM cache by code hash.
 */

import type { ExecutionResult } from "./execution.types";
import { EXECUTION_TIMEOUT_MS } from "./execution.types";

const COMPILE_API = "/api/compile/cpp";

async function idbSet(key: string, value: ArrayBuffer): Promise<void> {
  const db = await idbOpen();
  const tx = db.transaction(["wasm"], "readwrite");
  const store = tx.objectStore("wasm");
  await store.put({ key, value });
}

async function idbGet(key: string): Promise<ArrayBuffer | undefined> {
  const db = await idbOpen();
  const tx = db.transaction(["wasm"], "readonly");
  const store = tx.objectStore("wasm");
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result?.value);
    request.onerror = () => reject(request.error);
  });
}

function idbOpen(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("WasmCache", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("wasm", { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function hashCode(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return String(h);
}

export async function runCpp(
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
const codeKey = hashCode(code);
    let wasm: ArrayBuffer | undefined = await idbGet(`wasm:${codeKey}`);

    if (!wasm) {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        EXECUTION_TIMEOUT_MS + 5000
      );
      const res = await fetch(COMPILE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const text = await res.text();
        result.error = text || `Compile failed: ${res.status}`;
        result.errorCode = 'COMPILE_ERROR';
        result.executionTime = Date.now() - start;
        return result;
      }

const buffer = await res.arrayBuffer();
      wasm = buffer.slice(0);
      await idbSet(`wasm:${codeKey}`, wasm);
    }

    const w = new Worker("/workers/cpp.worker.js");
    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];

    const done = new Promise<ExecutionResult>((resolve) => {
      const finish = (success: boolean, errorMsg: string | null) => {
        clearTimeout(timeoutId);
        w.removeEventListener("message", handler);
        w.terminate();
        resolve({
          success: success,
          output: stdoutChunks.join(""),
          error: errorMsg ?? (stderrChunks.length > 0 ? stderrChunks.join("") : null),
          executionTime: Date.now() - start,
        });
      };

      const timeoutId = setTimeout(() => {
        w.terminate();
        resolve({
          success: false,
          output: stdoutChunks.join(""),
          error: "Execution timed out",
          errorCode: 'TIMEOUT',
          executionTime: Date.now() - start,
        });
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
            finish(data === 0, null);
            break;
          case "error":
            finish(false, data ?? "Unknown error");
            break;
        }
      };

      w.addEventListener("message", handler);
      const toSend = wasm!.slice(0);
      w.postMessage({ type: "run", wasm: toSend, input: input ?? "" }, [toSend]);
    });

    return await done;
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    result.executionTime = Date.now() - start;
  }

  result.executionTime = result.executionTime || Date.now() - start;
  return result;
}
