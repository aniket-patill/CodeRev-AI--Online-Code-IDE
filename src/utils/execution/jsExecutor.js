/**
 * JavaScript execution using Web Workers
 * Runs code in an isolated context with stdin support
 */

const TIMEOUT_MS = 5000;

export async function executeJavaScript(code, stdin = "") {
  return new Promise((resolve) => {
    const startTime = performance.now();

    const workerCode = `
      // Setup stdin simulation
      const inputLines = ${JSON.stringify(stdin)}.split('\\n');
      let inputIndex = 0;
      
      // readline function for input
      function readline() {
        return inputLines[inputIndex++] || '';
      }
      
      // Also support prompt() as readline
      const prompt = readline;
      
      // Capture console output
      const logs = [];
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      
      console.log = (...args) => {
        logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      };
      console.error = (...args) => {
        logs.push('Error: ' + args.map(a => String(a)).join(' '));
      };
      console.warn = (...args) => {
        logs.push('Warning: ' + args.map(a => String(a)).join(' '));
      };
      
      try {
        // Execute the user code
        const result = (function() {
          ${code}
        })();
        
        // If code returns a value, log it
        if (result !== undefined) {
          logs.push(typeof result === 'object' ? JSON.stringify(result) : String(result));
        }
        
        self.postMessage({ 
          stdout: logs.join('\\n'), 
          stderr: '', 
          exitCode: 0,
          success: true
        });
      } catch (error) {
        self.postMessage({ 
          stdout: logs.join('\\n'), 
          stderr: error.toString(), 
          exitCode: 1,
          success: false
        });
      }
    `;

    try {
      const blob = new Blob([workerCode], { type: "application/javascript" });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);

      // Timeout handler
      const timeoutId = setTimeout(() => {
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        const endTime = performance.now();
        resolve({
          stdout: "",
          stderr: "Time Limit Exceeded",
          exitCode: -1,
          timedOut: true,
          runtime: Math.round(endTime - startTime),
          memory: 0,
        });
      }, TIMEOUT_MS);

      worker.onmessage = (e) => {
        clearTimeout(timeoutId);
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        const endTime = performance.now();

        resolve({
          ...e.data,
          timedOut: false,
          runtime: Math.round(endTime - startTime),
          memory: 0, // Can't measure in browser
        });
      };

      worker.onerror = (error) => {
        clearTimeout(timeoutId);
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        const endTime = performance.now();

        resolve({
          stdout: "",
          stderr: error.message || "Worker error",
          exitCode: 1,
          timedOut: false,
          runtime: Math.round(endTime - startTime),
          memory: 0,
        });
      };
    } catch (error) {
      const endTime = performance.now();
      resolve({
        stdout: "",
        stderr: error.message || "Failed to create worker",
        exitCode: 1,
        timedOut: false,
        runtime: Math.round(endTime - startTime),
        memory: 0,
      });
    }
  });
}
