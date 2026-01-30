export const JAVASCRIPT_DRIVER_TEMPLATE = `
const fs = require('fs');
const path = require('path');
const util = require('util');

async function run() {
    let testCases;
    try {
        testCases = JSON.parse(fs.readFileSync('tests.json', 'utf8'));
    } catch (e) {
        console.log(JSON.stringify({
            verdict: "Internal Error",
            stderr: "Failed to load test cases: " + e.message
        }));
        process.exit(1);
    }

    const solutionPath = path.resolve('./solution.js');
    
    // Clear cache to allow re-running in same process if needed (though we exec fresh usually)
    delete require.cache[require.resolve(solutionPath)];
    
    let userMod;
    try {
        userMod = require(solutionPath);
    } catch (e) {
        console.log(JSON.stringify({
            verdict: "Runtime Error",
            stderr: e.stack
        }));
        process.exit(0);
    }

    // Expecting: module.exports = { methodName: function... } or similar
    // LeetCode usually does: var solution = function(args) {...}
    // We will look for the first exported function.
    
    let method = null;
    if (typeof userMod === 'function') {
        method = userMod;
    } else if (typeof userMod === 'object') {
        // Find first func
        const keys = Object.keys(userMod);
        for (const key of keys) {
            if (typeof userMod[key] === 'function') {
                method = userMod[key];
                break;
            }
        }
    }

    if (!method) {
        console.log(JSON.stringify({
            verdict: "Compilation Error",
            stderr: "No exported function found in solution.js"
        }));
        process.exit(0);
    }

    const results = [];
    let overallVerdict = "Accepted";
    let totalTime = 0;

    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const args = testCase.input || [];
        const expected = testCase.expectedOutput;

        const start = process.hrtime();
        
        let actual;
        let stdout = "";
        let stderr = "";
        let verdict = "Accepted";

        // Capture console.log
        const originalLog = console.log;
        const capturedLogs = [];
        console.log = (...args) => capturedLogs.push(util.format(...args));

        try {
            actual = await method(...args);
        } catch (e) {
            verdict = "Runtime Error";
            stderr = e.stack;
            overallVerdict = "Runtime Error";
        } finally {
            console.log = originalLog;
            stdout = capturedLogs.join('\\n');
        }

        const diff = process.hrtime(start);
        const duration = (diff[0] * 1000 + diff[1] / 1e6); // ms
        totalTime += duration;

        if (verdict === "Accepted" && expected !== undefined) {
             // Basic JSON comparison
             if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                 verdict = "Wrong Answer";
                 overallVerdict = "Wrong Answer";
             }
        }

        results.push({
            testCaseId: testCase.id || String(i),
            verdict,
            actualOutput: JSON.stringify(actual),
            expectedOutput: JSON.stringify(expected),
            timeMs: duration,
            stdout,
            stderr
        });

        if (verdict === "Runtime Error") break;
    }

    console.log(JSON.stringify({
        verdict: overallVerdict,
        results,
        timeMs: totalTime
    }));
}

run();
`;
