/**
 * Code execution utility for running student code locally
 * Ported from CodeTest-AI's sandbox.py (local execution only, no Docker)
 */

import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// Language configurations
const LANGUAGE_CONFIG = {
  python: {
    extension: '.py',
    command: 'python',
    args: (filePath) => [filePath],
  },
  javascript: {
    extension: '.js',
    command: 'node',
    args: (filePath) => [filePath],
  },
  java: {
    extension: '.java',
    command: 'java',
    args: (filePath) => [filePath],
    needsCompile: true,
    compileCommand: 'javac',
  },
};

/**
 * Create a temporary file with the code
 */
function createTempFile(code, language) {
  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const tempDir = tmpdir();
  const fileName = `code_${Date.now()}_${Math.random().toString(36).substring(7)}${config.extension}`;
  const filePath = join(tempDir, fileName);

  writeFileSync(filePath, code, 'utf-8');
  return filePath;
}

/**
 * Execute code with a single testcase
 */
export async function executeTestcase(code, language, testcase, options = {}) {
  const {
    timeout = 10000, // 10 seconds default
    memoryLimit = 256, // MB (not enforced in local execution)
  } = options;

  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    return {
      passed: false,
      actualOutput: '',
      expectedOutput: testcase.expected_output,
      executionTime: 0,
      memoryUsed: 0,
      error: `Unsupported language: ${language}`,
    };
  }

  let filePath = null;

  try {
    // Create temporary file
    filePath = createTempFile(code, language);

    // Execute the code
    const startTime = Date.now();
    const result = await runCode(
      config.command,
      config.args(filePath),
      testcase.input,
      timeout
    );
    const executionTime = Date.now() - startTime;

    // Compare output
    const actualOutput = result.stdout.trim();
    const expectedOutput = testcase.expected_output.trim();
    
    let passed = false;
    
    // Try semantic JSON comparison first
    try {
      const actualJson = JSON.parse(actualOutput);
      const expectedJson = JSON.parse(expectedOutput);
      passed = JSON.stringify(actualJson) === JSON.stringify(expectedJson);
    } catch {
      // Fallback to string comparison
      passed = actualOutput === expectedOutput;
    }

    return {
      passed,
      actualOutput,
      expectedOutput,
      executionTime,
      memoryUsed: 0, // Cannot measure accurately without Docker
      error: result.error || (result.exitCode !== 0 ? result.stderr : null),
    };

  } catch (error) {
    return {
      passed: false,
      actualOutput: '',
      expectedOutput: testcase.expected_output,
      executionTime: 0,
      memoryUsed: 0,
      error: error.message,
    };
  } finally {
    // Cleanup temp file
    if (filePath && existsSync(filePath)) {
      try {
        unlinkSync(filePath);
      } catch (err) {
        console.error('Failed to cleanup temp file:', err);
      }
    }
  }
}

/**
 * Run code in a subprocess with timeout
 */
function runCode(command, args, input, timeout) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args);
    
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    // Set timeout
    const timeoutId = setTimeout(() => {
      timedOut = true;
      process.kill();
      reject(new Error('Time limit exceeded'));
    }, timeout);

    // Collect stdout
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    // Collect stderr
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Handle process completion
    process.on('close', (exitCode) => {
      clearTimeout(timeoutId);
      
      if (timedOut) {
        return;
      }

      resolve({
        stdout,
        stderr,
        exitCode,
        error: exitCode !== 0 ? stderr : null,
      });
    });

    // Handle process errors
    process.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });

    // Send input to stdin
    if (input) {
      process.stdin.write(input);
      process.stdin.end();
    }
  });
}

/**
 * Execute code against multiple testcases
 */
export async function executeCode(code, language, testcases, options = {}) {
  const results = [];
  let runtimeError = null;

  for (let i = 0; i < testcases.length; i++) {
    const testcase = testcases[i];
    const result = await executeTestcase(code, language, testcase, options);
    
    results.push({
      testcaseIndex: i,
      input: testcase.input, // Include input for display
      ...result,
    });

    // Capture first runtime error
    if (result.error && !runtimeError) {
      runtimeError = result.error;
    }
  }

  // Calculate summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  const avgTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;
  const maxMemory = Math.max(...results.map(r => r.memoryUsed));

  return {
    results,
    summary: {
      passed,
      failed,
      total: results.length,
      avgExecutionTime: Math.round(avgTime),
      maxMemory: Math.round(maxMemory),
    },
    runtimeError,
  };
}
