/**
 * Java runner: calls the Java Execution Service (Docker container).
 * Next.js only proxies; no execution in the app.
 */

import type { ExecutionResult } from "./execution.types";
import { EXECUTION_TIMEOUT_MS } from "./execution.types";

const JAVA_SERVICE_URL =
  typeof window !== "undefined"
    ? "/api/runtime/java"
    : process.env.JAVA_EXECUTION_SERVICE_URL ?? "http://localhost:4001/execute";

export async function runJava(
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
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      EXECUTION_TIMEOUT_MS + 500
    );

    const res = await fetch(JAVA_SERVICE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, input: input ?? "" }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    result.executionTime = Date.now() - start;

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      result.error = body.error ?? body.message ?? `HTTP ${res.status}`;
      return result;
    }

    result.success = body.success ?? false;
    result.output = body.output ?? "";
    result.error = body.error ?? null;
    if (body.executionTime != null) {
      result.executionTime = body.executionTime;
    }
  } catch (err) {
    result.error =
      err instanceof Error ? err.message : String(err);
    result.executionTime = Date.now() - start;
  }

  return result;
}
