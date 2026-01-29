import { runTestCases } from "./runTestCases";

/**
 * Run all test cases for each question and compute score.
 * @param {Array<{ id?: number, title?: string, points?: number, testCases?: Array<{ input: string, expectedOutput: string, hidden?: boolean }> }>} questions - Questions with test cases
 * @param {Record<string, string>} files - Map of filename -> code (participant's code per file)
 * @param {Array<{ name: string, language?: string }>} fileList - Ordered list of files (matches question order when 1:1)
 * @returns {Promise<{ resultsByQuestion: Array<{ passed: number, total: number, score: number, results: Array<...> }>, totalPassed: number, totalCases: number, totalScore: number }>}
 */
export async function runAllTestCasesAndScore(questions, files, fileList = []) {
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
    const fileName = file?.name || Object.keys(files || {})[i] || Object.keys(files || {})[0];
    const code = (files || {})[fileName] || (files || {})[Object.keys(files || {})[0]] || "";

    const lang = (file?.language || "javascript").toLowerCase();
    const results = await runTestCases(code, lang, testCases, true);

    const passed = results.filter((r) => r.passed).length;
    const total = results.length;
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
