/**
 * PHP Web Worker - Runs PHP code using php-wasm.
 * 
 * Uses the PHP WebAssembly runtime to execute PHP code in the browser.
 * Loaded from CDN for simplicity.
 */

let php = null;
let inputBuffer = null;
let signalArray = null;
let dataArray = null;

const SIGNAL_INDEX = 0;

/**
 * Initialize PHP-WASM runtime.
 */
async function initPHP() {
    try {
        // Load php-wasm from CDN
        const { PhpWeb } = await import('https://cdn.jsdelivr.net/npm/@aspect-build/aspect-php@0.8.0/+esm');

        php = new PhpWeb();
        await php.init();

        self.postMessage({ type: 'ready' });
    } catch (error) {
        // Fallback: try alternative php-wasm package
        try {
            const phpModule = await import('https://cdn.jsdelivr.net/npm/php-wasm@0.0.8/+esm');
            php = await phpModule.default();
            self.postMessage({ type: 'ready' });
        } catch (fallbackError) {
            self.postMessage({ type: 'error', data: `Failed to initialize PHP: ${error.message}. Fallback also failed: ${fallbackError.message}` });
        }
    }
}

/**
 * Read input from SharedArrayBuffer (blocking).
 * Note: PHP stdin is complex in WASM - this is a simplified implementation.
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
 * Execute PHP code.
 * @param {string} code
 */
async function runCode(code) {
    if (!php) {
        self.postMessage({ type: 'error', data: 'PHP runtime not initialized' });
        return;
    }

    try {
        // Ensure code starts with <?php if not present
        let phpCode = code.trim();
        if (!phpCode.startsWith('<?php') && !phpCode.startsWith('<?')) {
            phpCode = '<?php\n' + phpCode;
        }

        // Execute PHP code
        const result = await php.run(phpCode);

        if (result.stdout) {
            self.postMessage({ type: 'stdout', data: result.stdout });
        }

        if (result.stderr) {
            self.postMessage({ type: 'stderr', data: result.stderr });
        }

        self.postMessage({ type: 'exit', data: result.exitCode || 0 });
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
            if (buffer) {
                inputBuffer = buffer;
                signalArray = new Int32Array(inputBuffer, 0, 1);
                dataArray = new Uint8Array(inputBuffer, 4);
            }
            await runCode(code);
            break;
    }
};

// Initialize when worker loads
initPHP();
