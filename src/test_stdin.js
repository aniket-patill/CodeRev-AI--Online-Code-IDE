const axios = require('axios');

async function test() {
    // Simulating what should happen when a user submits a solution for "two sum" or simple addition
    const userCode = `
def solve(num1, num2):
    return num1 + num2
`;

    // This is the driver code that SHOULD be appended by the system
    const driverCode = `
import sys
import json

try:
    # Read all from stdin
    input_str = sys.stdin.read()
    
    # Parse JSON input
    data = json.loads(input_str)
    
    # Call user function
    result = solve(data['num1'], data['num2'])
    
    # Print result to stdout
    print(result)
except Exception as e:
    print(f"Error: {e}")
`;

    const fullCode = userCode + "\n" + driverCode;
    const inputPayload = JSON.stringify({ "num1": 1, "num2": 2 });

    console.log("Testing Python execution with STDIN...");
    try {
        const response = await axios.post('http://localhost:4000/execute', {
            language: 'python',
            code: fullCode,
            input: inputPayload,
            timeout: 5000
        }, {
            headers: { 'x-api-key': 'testkey' }
        });

        console.log("\nResponse:", response.data);

        if (response.data.output && response.data.output.trim() === '3') {
            console.log("✅ SUCCESS: Output matched expected '3'");
        } else {
            console.log("❌ FAILURE: Output did not match. Got:", response.data.output);
        }

    } catch (e) {
        console.error("Request failed:", e.message);
        if (e.response) console.error("Data:", e.response.data);
    }
}

test();
