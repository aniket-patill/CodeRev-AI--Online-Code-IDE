import { runTestCase } from "./runTestCase";

function normalize(s) {
  if (typeof s !== "string") return "";
  return s.replace(/\r\n/g, "\n").trim();
}

/**
 * Run sample (non-hidden) test cases and return pass/fail per case.
 * @param {string} code - Source code to run
 * @param {string} language - Language key (python, javascript, java, cpp)
 * @param {Array<{ input: string, expectedOutput: string, hidden?: boolean }>} testCases - All test cases
 * @param {boolean} [includeHidden=false] - If true, run all cases (for Submit); otherwise only visible
 * @returns {Promise<Array<{ passed: boolean, input: string, expected: string, actual: string, error?: string }>>}
 */
export async function runTestCases(code, language, testCases, includeHidden = false) {
  const cases = Array.isArray(testCases) ? testCases : [];
  const toRun = includeHidden ? cases : cases.filter((tc) => !tc.hidden);

  const results = [];
  for (let i = 0; i < toRun.length; i++) {
    const tc = toRun[i];
    const input = typeof tc.input === "string" ? tc.input : "";
    const expected = normalize(tc.expectedOutput ?? "");

    const result = await runTestCase(code, language, input);
    const actual = normalize(result.output ?? "");
    const passed = !result.error && actual === expected;

    results.push({
      passed,
      input,
      expected: tc.expectedOutput ?? "",
      actual: result.output ?? "",
      error: result.error,
    });
  }

  return results;
}

/**
 * Run sample test cases only (for "Run" button).
 * @returns {Promise<{ results: Array<...>, passed: number, total: number }>}
 */
export async function runSampleTestCases(code, language, testCases) {
  const results = await runTestCases(code, language, testCases, false);
  const passed = results.filter((r) => r.passed).length;
  return { results, passed, total: results.length };
}
