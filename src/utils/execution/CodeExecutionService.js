
// Javascript Worker Code as a string to allow Blob creation
const JS_WORKER_CODE = `
self.onmessage = async (e) => {
    const { code } = e.data;
    const logs = [];
    
    // Capture console.log
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = (...args) => {
        logs.push(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
    };
    
    console.error = (...args) => {
        logs.push("Error: " + args.map(arg => String(arg)).join(' '));
    };

    console.warn = (...args) => {
         logs.push("Warning: " + args.map(arg => String(arg)).join(' '));
    };

    try {
        // Execute code
        // We use a Function constructor for basic isolation
        // For real security, this should be in an iframe or sandboxed further, 
        // but a Worker provides main-thread isolation (no DOM access).
        
        const result = new Function(code)();
        
        // If the code returns a value, log it too
        if (result !== undefined) {
             logs.push(String(result));
        }
        
        self.postMessage({ output: logs.join('\\n'), type: 'success' });
    } catch (error) {
        self.postMessage({ output: error.toString(), type: 'error' });
    }
};
`;

export class CodeExecutionService {
    /**
     * Executes code based on language
     * @param {string} code 
     * @param {string} language 
     * @returns {Promise<{output: string, error?: string}>}
     */
    static async execute(code, language) {
        if (language === 'javascript') {
            return this.executeJavascript(code);
        } else if (language === 'python') {
            // Placeholder for Python implementation
            // In a full implementation, we would load Pyodide here
            return { output: "Python execution environment initializing...\n[Pyodide integration pending in next update]", type: 'info' };
        }

        return { output: `Language ${language} not supported for live execution yet.` };
    }

    static executeJavascript(code) {
        return new Promise((resolve, reject) => {
            const blob = new Blob([JS_WORKER_CODE], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(blob);
            const worker = new Worker(workerUrl);

            // Timeout after 5 seconds to prevent infinite loops
            const timeoutId = setTimeout(() => {
                worker.terminate();
                URL.revokeObjectURL(workerUrl);
                resolve({ output: "Error: Execution timed out (Possible infinite loop)", error: "Timeout" });
            }, 5000);

            worker.onmessage = (e) => {
                clearTimeout(timeoutId);
                worker.terminate();
                URL.revokeObjectURL(workerUrl);

                if (e.data.type === 'error') {
                    resolve({ output: e.data.output, error: e.data.output });
                } else {
                    resolve({ output: e.data.output });
                }
            };

            worker.onerror = (e) => {
                clearTimeout(timeoutId);
                worker.terminate();
                URL.revokeObjectURL(workerUrl);
                resolve({ output: "Worker Error: " + e.message, error: e.message });
            };

            worker.postMessage({ code });
        });
    }
}
