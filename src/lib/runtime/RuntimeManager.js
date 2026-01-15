/**
 * RuntimeManager - Manages WebAssembly runtime workers for code execution.
 * 
 * Design Pattern: Singleton Factory
 * This module provides a clean interface for running code in isolated Web Workers
 * with support for interactive stdin/stdout via SharedArrayBuffer.
 * 
 * @module RuntimeManager
 */

// Constants for SharedArrayBuffer communication
const INPUT_BUFFER_SIZE = 4096;
const SIGNAL_INDEX = 0; // 0 = no input, 1 = input ready, 2 = input requested

/**
 * @typedef {Object} RuntimeCallbacks
 * @property {function(string): void} onStdout - Called when stdout data is received
 * @property {function(string): void} onStderr - Called when stderr data is received
 * @property {function(): void} onInputRequest - Called when runtime needs input
 * @property {function(number): void} onExit - Called when execution completes
 */

/**
 * Base class for language-specific runtimes.
 * Implements the core Worker communication protocol.
 */
class BaseRuntime {
    /** @type {Worker|null} */
    worker = null;

    /** @type {SharedArrayBuffer|null} */
    inputBuffer = null;

    /** @type {Int32Array|null} */
    signalArray = null;

    /** @type {Uint8Array|null} */
    dataArray = null;

    /** @type {RuntimeCallbacks} */
    callbacks = {
        onStdout: () => { },
        onStderr: () => { },
        onInputRequest: () => { },
        onExit: () => { },
    };

    /** @type {boolean} */
    isReady = false;

    /** @type {boolean} */
    isRunning = false;

    /**
     * @param {RuntimeCallbacks} callbacks
     */
    constructor(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
        this._initSharedBuffers();
    }

    /**
     * Initialize SharedArrayBuffers for stdin communication.
     * @private
     */
    _initSharedBuffers() {
        // Check if SharedArrayBuffer is available (requires COOP/COEP headers)
        if (typeof SharedArrayBuffer !== 'undefined') {
            this.inputBuffer = new SharedArrayBuffer(INPUT_BUFFER_SIZE);
            this.signalArray = new Int32Array(this.inputBuffer, 0, 1);
            this.dataArray = new Uint8Array(this.inputBuffer, 4);
        } else {
            console.warn('SharedArrayBuffer not available. Interactive input will be limited.');
        }
    }

    /**
     * Handle messages from the worker.
     * @param {MessageEvent} event
     * @protected
     */
    _handleMessage(event) {
        const { type, data } = event.data;

        switch (type) {
            case 'ready':
                this.isReady = true;
                break;
            case 'stdout':
                this.callbacks.onStdout(data);
                break;
            case 'stderr':
                this.callbacks.onStderr(data);
                break;
            case 'input_request':
                this.callbacks.onInputRequest();
                break;
            case 'exit':
                this.isRunning = false;
                this.callbacks.onExit(data);
                break;
            case 'error':
                this.callbacks.onStderr(`Error: ${data}\n`);
                this.isRunning = false;
                break;
        }
    }

    /**
     * Run code in the worker.
     * @param {string} code - Source code to execute
     * @returns {Promise<void>}
     */
    async run(code) {
        if (!this.worker) {
            throw new Error('Worker not initialized');
        }

        this.isRunning = true;

        // Reset signal
        if (this.signalArray) {
            Atomics.store(this.signalArray, SIGNAL_INDEX, 0);
        }

        this.worker.postMessage({
            type: 'run',
            code,
            inputBuffer: this.inputBuffer,
        });
    }

    /**
     * Send input to the running program.
     * @param {string} text - Input text (should include newline if needed)
     */
    writeInput(text) {
        if (!this.signalArray || !this.dataArray) {
            console.error('SharedArrayBuffer not available for input');
            return;
        }

        // Encode the input string
        const encoder = new TextEncoder();
        const encoded = encoder.encode(text);

        // Write length and data
        const length = Math.min(encoded.length, this.dataArray.length - 4);
        new DataView(this.inputBuffer).setUint32(4, length, true);
        this.dataArray.set(encoded.subarray(0, length), 4);

        // Signal that input is ready
        Atomics.store(this.signalArray, SIGNAL_INDEX, 1);
        Atomics.notify(this.signalArray, SIGNAL_INDEX);
    }

    /**
     * Terminate the worker.
     */
    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            this.isReady = false;
            this.isRunning = false;
        }
    }

    /**
     * Check if the runtime is ready to execute code.
     * @returns {boolean}
     */
    ready() {
        return this.isReady && !this.isRunning;
    }
}

/**
 * Python runtime using Pyodide in a Web Worker.
 */
class PythonRuntime extends BaseRuntime {
    /**
     * @param {RuntimeCallbacks} callbacks
     */
    constructor(callbacks) {
        super(callbacks);
        this._initWorker();
    }

    /**
     * Initialize the Python worker.
     * @private
     */
    _initWorker() {
        // Worker path relative to public folder
        this.worker = new Worker('/workers/python.worker.js');
        this.worker.onmessage = this._handleMessage.bind(this);
        this.worker.onerror = (error) => {
            console.error('Worker error:', error);
            this.callbacks.onStderr(`Worker error: ${error.message}\n`);
        };
    }
}

/**
 * JavaScript runtime using a sandboxed Web Worker.
 */
class JavaScriptRuntime extends BaseRuntime {
    /**
     * @param {RuntimeCallbacks} callbacks
     */
    constructor(callbacks) {
        super(callbacks);
        this._initWorker();
    }

    /**
     * Initialize the JavaScript worker.
     * @private
     */
    _initWorker() {
        this.worker = new Worker('/workers/javascript.worker.js');
        this.worker.onmessage = this._handleMessage.bind(this);
        this.worker.onerror = (error) => {
            console.error('Worker error:', error);
            this.callbacks.onStderr(`Worker error: ${error.message}\n`);
        };
    }
}

/**
 * Factory function to create language-specific runtimes.
 * @param {string} language - The programming language
 * @param {RuntimeCallbacks} callbacks - Callbacks for runtime events
 * @returns {BaseRuntime|null} - The runtime instance or null if not supported
 */
export function createRuntime(language, callbacks) {
    switch (language.toLowerCase()) {
        case 'python':
            return new PythonRuntime(callbacks);
        case 'javascript':
            return new JavaScriptRuntime(callbacks);
        default:
            return null; // Fallback to Piston API
    }
}

/**
 * Check if a language supports WASM runtime.
 * @param {string} language
 * @returns {boolean}
 */
export function supportsWasmRuntime(language) {
    const supported = ['python', 'javascript'];
    return supported.includes(language.toLowerCase());
}

export { BaseRuntime, PythonRuntime, JavaScriptRuntime };
