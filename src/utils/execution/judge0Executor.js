/**
 * Judge0 API Executor for Java, C++, C, and other compiled languages
 * Uses the public Judge0 API (RapidAPI) for code execution
 * 
 * Free tier: 50 requests/day
 * For production, use your own Judge0 instance or upgrade plan
 */

// Judge0 Language IDs
const LANGUAGE_IDS = {
    java: 62,      // Java (OpenJDK 13.0.1)
    cpp: 54,       // C++ (GCC 9.2.0)
    c: 50,         // C (GCC 9.2.0)
    python: 71,    // Python (3.8.1)
    javascript: 63, // JavaScript (Node.js 12.14.0)
    typescript: 74, // TypeScript (3.7.4)
    go: 60,        // Go (1.13.5)
    rust: 73,      // Rust (1.40.0)
    ruby: 72,      // Ruby (2.7.0)
    php: 68,       // PHP (7.4.1)
    csharp: 51,    // C# (Mono 6.6.0.161)
    kotlin: 78,    // Kotlin (1.3.70)
    swift: 83,     // Swift (5.2.3)
};

// Judge0 API configuration
// Using public CE (Community Edition) API
const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com";
const RAPIDAPI_HOST = "judge0-ce.p.rapidapi.com";

// Fallback to free public Judge0 if no API key
const JUDGE0_PUBLIC_URL = "https://ce.judge0.com";

/**
 * Execute code using Judge0 API
 */
export async function executeWithJudge0(code, language, stdin = "", apiKey = null) {
    const startTime = performance.now();

    const languageId = LANGUAGE_IDS[language.toLowerCase()];
    if (!languageId) {
        return {
            stdout: "",
            stderr: `Unsupported language: ${language}`,
            exitCode: 1,
            timedOut: false,
            runtime: 0,
            memory: 0,
        };
    }

    try {
        // Determine which API to use
        const useRapidAPI = apiKey && apiKey.trim() !== "";
        const baseUrl = useRapidAPI ? JUDGE0_API_URL : JUDGE0_PUBLIC_URL;

        // Prepare headers
        const headers = {
            "Content-Type": "application/json",
        };

        if (useRapidAPI) {
            headers["X-RapidAPI-Key"] = apiKey;
            headers["X-RapidAPI-Host"] = RAPIDAPI_HOST;
        }

        // Create submission
        const submissionResponse = await fetch(`${baseUrl}/submissions?base64_encoded=true&wait=true`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                language_id: languageId,
                source_code: btoa(unescape(encodeURIComponent(code))),
                stdin: btoa(unescape(encodeURIComponent(stdin))),
                cpu_time_limit: 5,      // 5 seconds
                memory_limit: 256000,   // 256 MB
            }),
        });

        if (!submissionResponse.ok) {
            const errorText = await submissionResponse.text();
            throw new Error(`Judge0 API error: ${submissionResponse.status} - ${errorText}`);
        }

        const result = await submissionResponse.json();
        const endTime = performance.now();

        // Decode outputs
        const stdout = result.stdout ? decodeURIComponent(escape(atob(result.stdout))) : "";
        const stderr = result.stderr ? decodeURIComponent(escape(atob(result.stderr))) : "";
        const compileOutput = result.compile_output
            ? decodeURIComponent(escape(atob(result.compile_output)))
            : "";

        // Determine status
        const statusId = result.status?.id;
        let exitCode = 0;
        let timedOut = false;
        let finalStderr = stderr || compileOutput;

        switch (statusId) {
            case 1: // In Queue
            case 2: // Processing
                finalStderr = "Execution pending...";
                break;
            case 3: // Accepted
                exitCode = 0;
                break;
            case 4: // Wrong Answer
                exitCode = 0;
                break;
            case 5: // Time Limit Exceeded
                timedOut = true;
                exitCode = -1;
                finalStderr = "Time Limit Exceeded";
                break;
            case 6: // Compilation Error
                exitCode = 1;
                finalStderr = compileOutput || "Compilation Error";
                break;
            case 7: // Runtime Error (SIGSEGV)
            case 8: // Runtime Error (SIGXFSZ)
            case 9: // Runtime Error (SIGFPE)
            case 10: // Runtime Error (SIGABRT)
            case 11: // Runtime Error (NZEC)
            case 12: // Runtime Error (Other)
                exitCode = 1;
                finalStderr = stderr || result.status?.description || "Runtime Error";
                break;
            case 13: // Internal Error
            case 14: // Exec Format Error
                exitCode = 1;
                finalStderr = result.status?.description || "Execution Error";
                break;
            default:
                if (stderr || compileOutput) {
                    exitCode = 1;
                }
        }

        return {
            stdout: stdout.trim(),
            stderr: finalStderr.trim(),
            exitCode,
            timedOut,
            runtime: result.time ? Math.round(parseFloat(result.time) * 1000) : Math.round(endTime - startTime),
            memory: result.memory ? Math.round(result.memory / 1024) : 0, // Convert to KB
            status: result.status?.description,
        };
    } catch (error) {
        const endTime = performance.now();
        return {
            stdout: "",
            stderr: error.message || "Judge0 execution failed",
            exitCode: 1,
            timedOut: false,
            runtime: Math.round(endTime - startTime),
            memory: 0,
        };
    }
}

/**
 * Get supported languages
 */
export function getSupportedLanguages() {
    return Object.keys(LANGUAGE_IDS);
}

/**
 * Check if language is supported by Judge0
 */
export function isLanguageSupported(language) {
    return language.toLowerCase() in LANGUAGE_IDS;
}
