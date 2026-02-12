/**
 * Unified multi-language execution entry point.
 * Routes to Python (Pyodide), C++ (WASM), or Java (backend), with 2s timeout and debounce.
 */

import type { ExecutionResult, Language } from "./execution.types";
import { DEBOUNCE_MS, EXECUTION_TIMEOUT_MS } from "./execution.types";
import { runPython } from "./pythonRunner";
import { runCpp } from "./cppRunner";
import { runJava } from "./javaRunner";

function normalizeLanguage(lang: string): Language | null {
  const s = lang.toLowerCase().trim();
  if (s === "python" || s === "py") return "python";
  if (s === "cpp" || s === "c++" || s === "c") return "cpp";
  if (s === "java") return "java";
  return null;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const debounceResolvers: Array<(r: ExecutionResult) => void> = [];
let pending: { language: Language; code: string; input?: string } | null = null;

function runOne(
  lang: Language,
  code: string,
  input?: string
): Promise<ExecutionResult> {
  const start = Date.now();
  const fallback: ExecutionResult = {
    success: false,
    output: "",
    error: null,
    executionTime: 0,
  };

  const timeoutPromise = new Promise<ExecutionResult>((resolve) => {
    setTimeout(
      () =>
        resolve({
          success: false,
          output: "",
          error: "Execution timed out",
          errorCode: 'TIMEOUT',
          executionTime: EXECUTION_TIMEOUT_MS,
        }),
      EXECUTION_TIMEOUT_MS + 500
    );
  });

  let runnerPromise: Promise<ExecutionResult>;
  switch (lang) {
    case "python":
      runnerPromise = runPython(code, input);
      break;
    case "cpp":
      runnerPromise = runCpp(code, input);
      break;
    case "java":
      runnerPromise = runJava(code, input);
      break;
    default:
      fallback.error = `Unsupported language: ${lang}`;
      fallback.executionTime = Date.now() - start;
      return Promise.resolve(fallback);
  }

  return Promise.race([runnerPromise, timeoutPromise]).then((result) => {
    result.executionTime = result.executionTime ?? Date.now() - start;
    return result;
  }).catch((err) => {
    fallback.error = err instanceof Error ? err.message : String(err);
    fallback.executionTime = Date.now() - start;
    return fallback;
  });
}

/**
 * Execute code in the given language. Returns a structured result.
 * Enforces 2s timeout, debounces rapid calls (runs latest only), never throws.
 */
export async function executeCode(
  language: string,
  code: string,
  input?: string
): Promise<ExecutionResult> {
  const start = Date.now();
  const fallback: ExecutionResult = {
    success: false,
    output: "",
    error: null,
    executionTime: 0,
  };

  const lang = normalizeLanguage(language);
  if (!lang) {
    fallback.error = `Unsupported language: ${language}`;
    fallback.executionTime = Date.now() - start;
    return fallback;
  }

  if (DEBOUNCE_MS <= 0) {
    return runOne(lang, code, input);
  }

  pending = { language: lang, code, input };

  return new Promise<ExecutionResult>((resolve) => {
    debounceResolvers.push(resolve);
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      debounceTimer = null;
      const p = pending;
      pending = null;
      const res = p
        ? await runOne(p.language, p.code, p.input)
        : { ...fallback, error: "Debounced", executionTime: Date.now() - start };
      const resolvers = debounceResolvers.splice(0, debounceResolvers.length);
      resolvers.forEach((r) => r(res));
    }, DEBOUNCE_MS);
  });
}

export type { ExecutionResult, Language };
export { EXECUTION_TIMEOUT_MS, DEBOUNCE_MS } from "./execution.types";
