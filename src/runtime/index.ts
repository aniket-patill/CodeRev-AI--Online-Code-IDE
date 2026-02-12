/**
 * Multi-language execution runtime.
 * Use executeCode(language, code, input?) for Python, C++, and Java.
 */

export {
  executeCode,
  EXECUTION_TIMEOUT_MS,
  DEBOUNCE_MS,
} from "./executeCode";
export type { ExecutionResult, Language } from "./execution.types";
