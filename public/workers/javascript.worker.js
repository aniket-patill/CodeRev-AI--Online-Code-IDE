/**
 * JavaScript Web Worker - Runs JavaScript code in a sandboxed environment.
 * 
 * This worker executes JavaScript code in isolation with custom console handling.
 */

let inputBuffer = null;
let signalArray = null;
let dataArray = null;

const SIGNAL_INDEX = 0;

/**
 * Read input from SharedArrayBuffer (blocking).
 * @returns {string}
 */
function readInput() {
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

    return text.trim();
}

/**
 * Execute JavaScript code with custom console.
 * @param {string} code
 */
function runCode(code) {
    try {
        // Create custom console object
        const customConsole = {
            log: (...args) => {
                const message = args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ');
                self.postMessage({ type: 'stdout', data: message + '\n' });
            },
            error: (...args) => {
                const message = args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ');
                self.postMessage({ type: 'stderr', data: message + '\n' });
            },
            warn: (...args) => {
                const message = args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ');
                self.postMessage({ type: 'stdout', data: '[WARN] ' + message + '\n' });
            },
            info: (...args) => {
                customConsole.log(...args);
            },
        };

        // Create prompt function for input
        const prompt = (message = '') => {
            if (message) {
                self.postMessage({ type: 'stdout', data: message });
            }
            return readInput();
        };

        // Create readline function (Node.js style)
        const readline = prompt;

        // Execute code in a function scope with custom globals
        const wrappedCode = `
      (function(console, prompt, readline) {
        ${code}
      })
    `;

        const fn = eval(wrappedCode);
        const result = fn(customConsole, prompt, readline);

        // Handle async functions
        if (result instanceof Promise) {
            result
                .then(() => self.postMessage({ type: 'exit', data: 0 }))
                .catch((error) => {
                    self.postMessage({ type: 'stderr', data: error.toString() + '\n' });
                    self.postMessage({ type: 'exit', data: 1 });
                });
        } else {
            self.postMessage({ type: 'exit', data: 0 });
        }
    } catch (error) {
        self.postMessage({ type: 'stderr', data: error.toString() + '\n' });
        self.postMessage({ type: 'exit', data: 1 });
    }
}

/**
 * Handle messages from the main thread.
 */
self.onmessage = function (event) {
    const { type, code, inputBuffer: buffer } = event.data;

    switch (type) {
        case 'run':
            if (buffer) {
                inputBuffer = buffer;
                signalArray = new Int32Array(inputBuffer, 0, 1);
                dataArray = new Uint8Array(inputBuffer, 4);
            }
            runCode(code);
            break;
    }
};

// Signal ready
self.postMessage({ type: 'ready' });
