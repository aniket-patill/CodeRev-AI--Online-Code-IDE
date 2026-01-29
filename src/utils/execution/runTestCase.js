/**
 * Run a single test case by sending code + stdin to the execution API (Docker sandbox).
 * @param {string} code - Source code to run
 * @param {string} language - Language key (python, javascript, java, cpp)
 * @param {string} [input=''] - Standard input for the process
 * @returns {Promise<{ output: string, error?: string }>}
 */
export async function runTestCase(code, language, input = "") {
  try {
    const url = "/api/execute";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        language: (language || "javascript").toLowerCase(),
        stdin: typeof input === "string" ? input : "",
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        output: data.stderr || data.error || res.statusText,
        error: data.error || `Execution failed (${res.status})`,
      };
    }

    const stdout = data.stdout ?? "";
    const stderr = data.stderr ?? "";
    const output = [stdout, stderr].filter(Boolean).join("\n").trim() || "";
    const hasError = data.exit_code !== 0 || data.timed_out;

    return {
      output: output || "(no output)",
      ...(hasError && {
        error: data.timed_out
          ? "Execution timed out"
          : stderr || `Exit code ${data.exit_code}`,
      }),
    };
  } catch (err) {
    return {
      output: "",
      error: err.message || "Execution service unavailable",
    };
  }
}
