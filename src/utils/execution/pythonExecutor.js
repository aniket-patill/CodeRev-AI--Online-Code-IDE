/**
 * Python execution using Pyodide (WebAssembly Python)
 * Runs Python code in the browser without server dependencies
 */

let pyodideInstance = null;
let pyodideLoading = null;

const TIMEOUT_MS = 10000;
const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/";

/**
 * Initialize Pyodide (lazy loading)
 */
async function initPyodide() {
    if (pyodideInstance) return pyodideInstance;

    if (pyodideLoading) return pyodideLoading;

    pyodideLoading = (async () => {
        try {
            // Load Pyodide from CDN to avoid webpack/node polyfill issues (node:child_process)
            const scriptUrl = `${PYODIDE_CDN}pyodide.js`;

            if (!window.loadPyodide) {
                await new Promise((resolve, reject) => {
                    // Check if script is already added
                    if (document.querySelector(`script[src="${scriptUrl}"]`)) {
                        // If script exists but loadPyodide not ready, poll for it
                        const checkInterval = setInterval(() => {
                            if (window.loadPyodide) {
                                clearInterval(checkInterval);
                                resolve();
                            }
                        }, 100);
                        // Add timeout for safety
                        setTimeout(() => {
                            clearInterval(checkInterval);
                            if (!window.loadPyodide) reject(new Error("Pyodide script load timeout"));
                        }, 10000);
                        return;
                    }

                    const script = document.createElement("script");
                    script.src = scriptUrl;
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error("Failed to load Pyodide script"));
                    document.head.appendChild(script);
                });
            }

            pyodideInstance = await window.loadPyodide({
                indexURL: PYODIDE_CDN,
            });
            return pyodideInstance;
        } catch (error) {
            console.error("Failed to load Pyodide:", error);
            throw new Error("Failed to initialize Python runtime");
        }
    })();

    return pyodideLoading;
}

/**
 * Execute Python code with stdin support
 */
export async function executePython(code, stdin = "") {
    const startTime = performance.now();

    try {
        const pyodide = await Promise.race([
            initPyodide(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Pyodide load timeout")), 30000)
            ),
        ]);

        // Setup stdin and stdout capture
        const setupCode = `
import sys
from io import StringIO

# Setup stdin
_input_data = '''${stdin.replace(/'/g, "\\'")}'''
_input_lines = _input_data.split('\\n')
_input_index = 0

def _custom_input(prompt=''):
    global _input_index
    if _input_index < len(_input_lines):
        result = _input_lines[_input_index]
        _input_index += 1
        return result
    return ''

# Override input function
input = _custom_input

# Capture stdout
_stdout_capture = StringIO()
_stderr_capture = StringIO()
_original_stdout = sys.stdout
_original_stderr = sys.stderr
sys.stdout = _stdout_capture
sys.stderr = _stderr_capture
`;

        // Cleanup code to get outputs
        const cleanupCode = `
sys.stdout = _original_stdout
sys.stderr = _original_stderr
(_stdout_capture.getvalue(), _stderr_capture.getvalue())
`;

        // Run setup
        pyodide.runPython(setupCode);

        // Execute user code with timeout
        let stdout = "";
        let stderr = "";
        let exitCode = 0;
        let timedOut = false;

        try {
            await Promise.race([
                (async () => {
                    pyodide.runPython(code);
                })(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("TIMEOUT")), TIMEOUT_MS)
                ),
            ]);

            // Get outputs
            const [out, err] = pyodide.runPython(cleanupCode).toJs();
            stdout = out || "";
            stderr = err || "";
        } catch (error) {
            if (error.message === "TIMEOUT") {
                timedOut = true;
                stderr = "Time Limit Exceeded";
                exitCode = -1;
            } else {
                // Try to get outputs even on error
                try {
                    const [out, err] = pyodide.runPython(cleanupCode).toJs();
                    stdout = out || "";
                    stderr = err || error.message || String(error);
                } catch {
                    stderr = error.message || String(error);
                }
                exitCode = 1;
            }
        }

        const endTime = performance.now();

        return {
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode,
            timedOut,
            runtime: Math.round(endTime - startTime),
            memory: 0,
        };
    } catch (error) {
        const endTime = performance.now();
        return {
            stdout: "",
            stderr: error.message || "Python execution failed",
            exitCode: 1,
            timedOut: false,
            runtime: Math.round(endTime - startTime),
            memory: 0,
        };
    }
}

/**
 * Check if Pyodide is loaded
 */
export function isPyodideReady() {
    return pyodideInstance !== null;
}

/**
 * Preload Pyodide for faster first execution
 */
export async function preloadPyodide() {
    try {
        await initPyodide();
        return true;
    } catch {
        return false;
    }
}
