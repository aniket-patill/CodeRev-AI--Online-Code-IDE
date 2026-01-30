import { judgeRun } from "@/lib/judge/client";

/**
 * Run all test cases for each question and compute score.
 * @param {Array<{ id?: number, title?: string, points?: number, testCases?: Array<{ input: string, expectedOutput: string, hidden?: boolean }> }>} questions - Questions with test cases
 * @param {Record<string, string>} files - Map of filename -> code (participant's code per file)
 * @param {Array<{ name: string, language?: string }>} fileList - Ordered list of files (matches question order when 1:1)
 * @returns {Promise<{ resultsByQuestion: Array<{ passed: number, total: number, score: number, results: Array<...> }>, totalPassed: number, totalCases: number, totalScore: number }>}
 */
export async function runAllTestCasesAndScore(questions, filesMap, fileList = []) {
  const resultsByQuestion = [];
  let totalPassed = 0;
  let totalCases = 0;
  let totalScore = 0;

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const testCases = question.testCases || [];
    if (testCases.length === 0) {
      resultsByQuestion.push({ passed: 0, total: 0, score: 0, results: [] });
      continue;
    }

    const file = fileList[i] || fileList[0];
    const fileName = file?.name || Object.keys(filesMap || {})[i] || Object.keys(filesMap || {})[0];
    const code = (filesMap || {})[fileName] || "";

    const lang = (file?.language || "javascript").toLowerCase();

    let results = [];
    try {
      const formattedCases = testCases.map(tc => ({
        id: tc.id || String(Math.random()),
        input: Array.isArray(tc.input) ? tc.input : [tc.input],
        expectedOutput: tc.expectedOutput
      }));

      // Use guest/default if context not available, but usually this runs in browser context
      const userId = "guest";
      const sessionId = "submit-session";

      const executionResult = await judgeRun(code, lang, formattedCases, userId, sessionId);

      if (executionResult.testCaseResults) {
        results = executionResult.testCaseResults.map(r => ({
          passed: r.verdict === "Accepted",
          actual: r.actualOutput,
          expected: r.expectedOutput,
          error: r.stderr,
          input: "" // We don't have easy access to original input in the return mapped by ID easily without extra logic, but it's okay for score calculation
        }));
      }
    } catch (e) {
      console.error("Judge run failed:", e);
      // Fail all
      results = testCases.map(() => ({ passed: false, error: "Execution Failed" }));
    }

    const passed = results.filter((r) => r.passed).length;
    const total = testCases.length; // Use original total in case judge droppped some? Should match.
    const points = typeof question.points === "number" ? question.points : 10;
    const score = total > 0 ? (passed / total) * points : 0;

    totalPassed += passed;
    totalCases += total;
    totalScore += score;

    resultsByQuestion.push({ passed, total, score, results });
  }

  return {
    resultsByQuestion,
    totalPassed,
    totalCases,
    totalScore,
  };
}
