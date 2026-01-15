/**
 * Python Web Worker - Runs Python code using Pyodide.
 * 
 * This worker loads Pyodide and executes Python code in isolation.
 * It supports streaming stdout/stderr and interactive stdin via SharedArrayBuffer.
 */

// Import Pyodide from CDN
importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.js');

let pyodide = null;
let inputBuffer = null;
let signalArray = null;
let dataArray = null;

const SIGNAL_INDEX = 0;

/**
 * Initialize Pyodide runtime.
 */
async function initPyodide() {
    try {
        pyodide = await loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.2/full/',
            stdout: (text) => {
                self.postMessage({ type: 'stdout', data: text + '\n' });
            },
            stderr: (text) => {
                self.postMessage({ type: 'stderr', data: text + '\n' });
            },
        });

        // Set up custom stdin handling
        pyodide.setStdin({
            stdin: () => {
                return readInput();
            }
        });

        self.postMessage({ type: 'ready' });
    } catch (error) {
        self.postMessage({ type: 'error', data: error.message });
    }
}

/**
 * Read input from SharedArrayBuffer (blocking).
 * @returns {string}
 */
function readInput() {
    if (!signalArray || !dataArray) {
        // Fallback: return empty string if SharedArrayBuffer not available
        return '';
    }

    // Signal that we need input
    self.postMessage({ type: 'input_request' });

    // Wait for input (blocking)
    Atomics.store(signalArray, SIGNAL_INDEX, 2); // 2 = requesting input

    // Wait until signal becomes 1 (input ready)
    while (Atomics.load(signalArray, SIGNAL_INDEX) !== 1) {
        Atomics.wait(signalArray, SIGNAL_INDEX, 2, 100);
    }

    // Read the input data
    const length = new DataView(inputBuffer).getUint32(4, true);
    const decoder = new TextDecoder();
    const text = decoder.decode(dataArray.subarray(4, 4 + length));

    // Reset signal
    Atomics.store(signalArray, SIGNAL_INDEX, 0);

    return text;
}

/**
 * Execute Python code.
 * @param {string} code
 */
async function runCode(code) {
    if (!pyodide) {
        self.postMessage({ type: 'error', data: 'Pyodide not initialized' });
        return;
    }

    try {
        await pyodide.runPythonAsync(code);
        self.postMessage({ type: 'exit', data: 0 });
    } catch (error) {
        self.postMessage({ type: 'stderr', data: error.toString() + '\n' });
        self.postMessage({ type: 'exit', data: 1 });
    }
}

/**
 * Handle messages from the main thread.
 */
self.onmessage = async function (event) {
    const { type, code, inputBuffer: buffer } = event.data;

    switch (type) {
        case 'run':
            // Store input buffer reference
            if (buffer) {
                inputBuffer = buffer;
                signalArray = new Int32Array(inputBuffer, 0, 1);
                dataArray = new Uint8Array(inputBuffer, 4);
            }
            await runCode(code);
            break;
        case 'init':
            // Already initializing on load
            break;
    }
};

// Initialize when worker loads
initPyodide();
