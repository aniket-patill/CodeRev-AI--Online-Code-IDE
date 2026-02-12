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
/** Pre-fed stdin lines (when provided in run message). Consumed by input(). */
let stdinLines = [];

const SIGNAL_INDEX = 0;

/**
 * Initialize Pyodide runtime.
 */
async function initPyodide() {
    try {
        pyodide = await loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.2/full/',
            stdout: (text) => {
                for (let i = 0; i < text.length; i++) {
                    self.postMessage({ type: 'stdout', data: text[i] });
                }
            },
            stderr: (text) => {
                for (let i = 0; i < text.length; i++) {
                    self.postMessage({ type: 'stderr', data: text[i] });
                }
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
 * Read input: from pre-fed stdin lines if available, else SharedArrayBuffer.
 * @returns {string}
 */
function readInput() {
    if (stdinLines.length > 0) {
        return stdinLines.shift() + '\n';
    }
    if (!signalArray || !dataArray) {
        return '';
    }
    self.postMessage({ type: 'input_request' });
    Atomics.store(signalArray, SIGNAL_INDEX, 2);
    while (Atomics.load(signalArray, SIGNAL_INDEX) !== 1) {
        Atomics.wait(signalArray, SIGNAL_INDEX, 2, 100);
    }
    const length = new DataView(inputBuffer).getUint32(4, true);
    const decoder = new TextDecoder();
    const text = decoder.decode(dataArray.subarray(4, 4 + length));
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
    const { type, code, inputBuffer: buffer, stdin } = event.data;

    switch (type) {
        case 'run':
            stdinLines = typeof stdin === 'string' && stdin.length > 0
                ? stdin.split('\n').map(function (line) { return line; })
                : [];
            if (buffer) {
                inputBuffer = buffer;
                signalArray = new Int32Array(inputBuffer, 0, 1);
                dataArray = new Uint8Array(inputBuffer, 4);
            }
            await runCode(code);
            break;
        case 'init':
            break;
    }
};

// Initialize when worker loads
initPyodide();
