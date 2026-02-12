export async function executeCode(payload) {
  const runnerUrl = process.env.RUNNER_URL || "http://localhost:3000/execute";

  const response = await fetch(runnerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.RUNNER_API_KEY || ""}`,
      "x-api-key": process.env.RUNNER_API_KEY || ""
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Execution service unavailable");
  }

  return await response.json();
}

export async function executeMultiple(code, language, testcases, options = {}) {
  const { timeout = 10000 } = options;
  const results = [];

  for (let i = 0; i < testcases.length; i++) {
    const testcase = testcases[i];
    const result = await executeCode({
      code,
      language,
      input: testcase.input || "",
      timeout: Math.min(timeout, 5000)
    });

    const actualOutput = (result.output || "").trim();
    const expectedOutput = (testcase.expected_output || "").trim();

    let passed = false;
    try {
      const actualJson = JSON.parse(actualOutput);
      const expectedJson = JSON.parse(expectedOutput);
      passed = JSON.stringify(actualJson) === JSON.stringify(expectedJson);
    } catch {
      passed = actualOutput.replace(/\r\n/g, "\n") === expectedOutput.replace(/\r\n/g, "\n");
    }

    results.push({
      testcaseIndex: i,
      input: testcase.input,
      passed,
      actualOutput,
      expectedOutput,
      error: result.error || null,
      executionTime: result.executionTime || 0
    });
  }

  const passed = results.filter(r => r.passed).length;

  return {
    results,
    summary: {
      passed,
      failed: results.length - passed,
      total: results.length,
      avgExecutionTime: results.reduce((sum, r) => sum + r.executionTime, 0) / results.length || 0
    }
  };
}
