/**
 * Code execution utility for running student code via Piston API
 * Replacement for local execution to support production environments without local compilers
 */

import axios from 'axios';
import { LANGUAGE_VERSIONS } from '../constants'; // Ensure this path is correct relative to src/lib/

// Piston API Configuration
const PISTON_API_URL = "https://emkc.org/api/v2/piston";

// Map internal language names to Piston API names
const PISTON_LANGUAGE_MAP = {
  python: 'python',
  javascript: 'javascript',
  java: 'java',
  cpp: 'c++',
  c: 'c',
  csharp: 'csharp',
  php: 'php',
};

// Map file extensions for Piston
const FILE_EXTENSIONS = {
  python: 'py',
  javascript: 'js',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  csharp: 'cs',
  php: 'php',
};

// Files that need specific naming (e.g., Java needs class name match)
const FILE_NAMES = {
  java: 'Solution.java', // Assuming class is public class Solution
};

/**
 * Execute a single testcase using Piston
 */
async function executeTestcaseInPiston(code, language, testcase, timeout) {
  const pistonLang = PISTON_LANGUAGE_MAP[language] || language;
  const version = LANGUAGE_VERSIONS[language] || '*';

  // Determine filename
  let fileName = `main.${FILE_EXTENSIONS[language] || 'txt'}`;

  if (language === 'java') {
    const match = code.match(/public\s+class\s+(\w+)/);
    if (match && match[1]) {
      fileName = `${match[1]}.java`;
    } else {
      fileName = 'Solution.java'; // Fallback
    }
  } else if (FILE_NAMES[language]) {
    fileName = FILE_NAMES[language];
  }

  try {
    const response = await axios.post(`${PISTON_API_URL}/execute`, {
      language: pistonLang,
      version: version,
      files: [
        {
          name: fileName,
          content: code
        }
      ],
      stdin: testcase.input || "",
      run_timeout: Math.min(timeout, 5000), // Limit per run
      compile_timeout: 10000,
    });

    const { run, compile } = response.data;

    // Check for compilation error first
    if (compile && compile.code !== 0) {
      return {
        passed: false,
        actualOutput: '',
        expectedOutput: testcase.expected_output,
        executionTime: 0,
        memoryUsed: 0,
        error: compile.stderr || compile.output || "Compilation Error",
        details: compile
      };
    }

    // Check for runtime error
    if (run.code !== 0 && run.signal !== 'SIGTERM') { // SIGTERM might be timeout?
      return {
        passed: false,
        actualOutput: run.stdout || '',
        expectedOutput: testcase.expected_output,
        executionTime: 0,
        memoryUsed: 0,
        error: run.stderr || run.output || "Runtime Error",
        details: run
      };
    }

    const actualOutput = (run.stdout || "").trim();
    const expectedOutput = (testcase.expected_output || "").trim();

    // Comparison logic
    let passed = false;
    try {
      // Try semantic JSON comparison
      const actualJson = JSON.parse(actualOutput);
      const expectedJson = JSON.parse(expectedOutput);
      passed = JSON.stringify(actualJson) === JSON.stringify(expectedJson);
    } catch {
      // Fallback to string comparison
      // Normalize newlines
      passed = actualOutput.replace(/\r\n/g, "\n") === expectedOutput.replace(/\r\n/g, "\n");
    }

    return {
      passed,
      actualOutput,
      expectedOutput,
      executionTime: 0, // Piston doesn't always provide precise execution time in easy format
      memoryUsed: 0,
      error: run.stderr ? run.stderr : null,
    };

  } catch (error) {
    console.error("Piston API Error:", error.message);
    if (error.response) {
      console.error("Piston API Response Data:", JSON.stringify(error.response.data));
    }
    return {
      passed: false,
      actualOutput: '',
      expectedOutput: testcase.expected_output,
      executionTime: 0,
      memoryUsed: 0,
      error: `Execution Service Error: ${error.message}${error.response && error.response.data ? ' - ' + JSON.stringify(error.response.data) : ''}`,
    };
  }
}


/**
 * Execute code against multiple testcases (Sequential to avoid rate limits)
 */
export async function executeCode(code, language, testcases, options = {}) {
  const {
    timeout = 10000,
  } = options;

  const results = [];
  let runtimeError = null;

  // Run sequentially to be polite to the public API
  for (let i = 0; i < testcases.length; i++) {
    const testcase = testcases[i];
    const result = await executeTestcaseInPiston(code, language, testcase, timeout);

    if (result.error && !runtimeError) {
      runtimeError = result.error;
    }

    results.push({
      testcaseIndex: i,
      input: testcase.input,
      ...result
    });

    // Optional: Add small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Calculate summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  // Execution time is approximate (network latency included if measured, currently 0)
  const avgTime = 0;

  return {
    results,
    summary: {
      passed,
      failed,
      total: results.length,
      avgExecutionTime: avgTime,
      maxMemory: 0,
    },
    runtimeError,
  };
}
