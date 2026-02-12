/**
 * Shared types for the multi-language execution runtime.
 * Keep the runtime layer strongly typed.
 */

export type Language = "python" | "cpp" | "java";

export type ErrorCode = 
  | 'COMPILE_ERROR' 
  | 'RUNTIME_ERROR' 
  | 'TIMEOUT' 
  | 'MEMORY_LIMIT'
  | 'SERVICE_UNAVAILABLE';

export interface ExecutionResult {
  success: boolean;
  output: string;
  error: string | null;
  errorCode?: ErrorCode;
  executionTime: number;
}

export const EXECUTION_TIMEOUT_MS = 2000;
export const DEBOUNCE_MS = 300;
