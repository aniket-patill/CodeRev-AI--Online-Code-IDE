/**
 * Unified Browser Executor
 * Routes code execution to the appropriate executor based on language
 * No Docker required - runs entirely in browser or via Judge0 API
 */

import { executeJavaScript } from "./jsExecutor";
import { executePython } from "./pythonExecutor";
import { executeWithJudge0, isLanguageSupported } from "./judge0Executor";

// Languages that can run in browser
const BROWSER_LANGUAGES = ["javascript", "python"];

// Languages that need Judge0 API
const JUDGE0_LANGUAGES = ["java", "cpp", "c", "typescript", "go", "rust", "ruby", "php", "csharp", "kotlin", "swift"];

/**
 * Execute code with automatic executor selection
 * @param {Object} options
 * @param {string} options.code - Source code to execute
 * @param {string} options.language - Programming language
 * @param {string} [options.stdin] - Standard input
 * @param {string} [options.judge0ApiKey] - Optional Judge0 API key for Java/C++
 * @returns {Promise<ExecutionResult>}
 */
export async function executeCode({ code, language, stdin = "", judge0ApiKey = null }) {
    const lang = language.toLowerCase();

    // Validate input
    if (!code || typeof code !== "string") {
        return {
            stdout: "",
            stderr: "No code provided",
            exitCode: 1,
            timedOut: false,
            runtime: 0,
            memory: 0,
        };
    }

    // Route to appropriate executor
    if (lang === "javascript" || lang === "js") {
        return executeJavaScript(code, stdin);
    }

    if (lang === "python" || lang === "py") {
        return executePython(code, stdin);
    }

    // For compiled languages, use Judge0
    if (JUDGE0_LANGUAGES.includes(lang) || isLanguageSupported(lang)) {
        return executeWithJudge0(code, lang, stdin, judge0ApiKey);
    }

    // Unsupported language
    return {
        stdout: "",
        stderr: `Unsupported language: ${language}. Supported: ${[...BROWSER_LANGUAGES, ...JUDGE0_LANGUAGES].join(", ")}`,
        exitCode: 1,
        timedOut: false,
        runtime: 0,
        memory: 0,
    };
}

/**
 * Check if a language is supported
 */
export function isSupportedLanguage(language) {
    const lang = language.toLowerCase();
    return (
        BROWSER_LANGUAGES.includes(lang) ||
        JUDGE0_LANGUAGES.includes(lang) ||
        lang === "js" ||
        lang === "py"
    );
}

/**
 * Get execution mode for a language
 */
export function getExecutionMode(language) {
    const lang = language.toLowerCase();
    if (BROWSER_LANGUAGES.includes(lang) || lang === "js" || lang === "py") {
        return "browser";
    }
    if (JUDGE0_LANGUAGES.includes(lang)) {
        return "judge0";
    }
    return "unsupported";
}

/**
 * Run a single test case and compare output
 */
export async function runSingleTestCase({ code, language, testCase, judge0ApiKey = null }) {
    const { input, expectedOutput } = testCase;

    const result = await executeCode({
        code,
        language,
        stdin: input || "",
        judge0ApiKey,
    });

    // Normalize outputs for comparison
    const normalize = (str) => (str || "").trim().replace(/\r\n/g, "\n");
    const actualOutput = normalize(result.stdout);
    const expected = normalize(expectedOutput || "");

    const passed = !result.stderr && result.exitCode === 0 && actualOutput === expected;

    return {
        passed,
        input: input || "",
        expected: expectedOutput || "",
        actual: result.stdout || "",
        error: result.stderr || null,
        runtime: result.runtime,
        memory: result.memory,
        timedOut: result.timedOut,
        status: getStatus(result, actualOutput, expected),
    };
}

/**
 * Get LeetCode-style status
 */
function getStatus(result, actual, expected) {
    if (result.timedOut) return "Time Limit Exceeded";
    if (result.stderr && result.stderr.includes("Compilation")) return "Compilation Error";
    if (result.stderr) return "Runtime Error";
    if (result.exitCode !== 0) return "Runtime Error";
    if (actual === expected) return "Accepted";
    return "Wrong Answer";
}

/**
 * Run all test cases for a question
 */
export async function runAllTestCases({ code, language, testCases, judge0ApiKey = null, includeHidden = false }) {
    const cases = Array.isArray(testCases) ? testCases : [];
    const toRun = includeHidden ? cases : cases.filter((tc) => !tc.hidden);

    const results = [];
    let totalRuntime = 0;
    let maxMemory = 0;

    for (const testCase of toRun) {
        const result = await runSingleTestCase({
            code,
            language,
            testCase,
            judge0ApiKey,
        });
        results.push(result);
        totalRuntime += result.runtime || 0;
        maxMemory = Math.max(maxMemory, result.memory || 0);
    }

    const passed = results.filter((r) => r.passed).length;
    const total = results.length;
    const allPassed = passed === total;

    // Determine overall status
    let overallStatus = "Accepted";
    if (!allPassed) {
        const firstFailed = results.find((r) => !r.passed);
        overallStatus = firstFailed?.status || "Wrong Answer";
    }

    return {
        results,
        passed,
        total,
        allPassed,
        status: overallStatus,
        runtime: totalRuntime,
        memory: maxMemory,
    };
}
