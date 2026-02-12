import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize Groq client (OpenAI-compatible)
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const GENERATION_PROMPT = `You are an expert coding interview question generator.
Your task is to generate a coding problem in strict JSON format.

Topic: "{topic}"
Difficulty: {difficulty}

INSTRUCTIONS:
1. Create a function name based on the problem title by converting it to snake_case
2. For example: "Two Sum" becomes "two_sum", "Search Insert Position" becomes "search_insert_position"
3. Use this function name consistently in both starter_code and driver_code

RESPONSE FORMAT:
You MUST return a VALID JSON OBJECT. Do not include any markdown formatting outside the JSON. Do not include prologue or epilogue text.

JSON Structure:
{{
  "title": "Problem Title",
  "description": "Problem description in Markdown.",
  "difficulty": "{difficulty}",
  "testcases": [
    {{
      "input": "{{\\"nums\\": [1, 2], \\"target\\": 3}}",
      "expected_output": "3",
      "is_hidden": false
    }}
  ],
  "code_snippets": {{
    "python": {{
      "starter_code": "def function_name(params):\\\\n    pass",
      "driver_code": "import sys\\\\nimport json\\\\nif __name__ == '__main__':\\\\n    data = json.loads(sys.stdin.read())\\\\n    print(function_name(data['param1'], data['param2']))"
    }},
    "javascript": {{
      "starter_code": "function functionName(params) {{\\\\n    // Your code here\\\\n}}",
      "driver_code": "const input = require('fs').readFileSync(0, 'utf-8');\\\\nconst data = JSON.parse(input);\\\\nconsole.log(functionName(data.param1, data.param2));"
    }},
    "java": {{
      "starter_code": "public class Solution {{\\\\n    public int functionName(int[] params) {{\\\\n        // Your code here\\\\n        return 0;\\\\n    }}\\\\n}}",
      "driver_code": "import java.util.*;\\\\npublic class Main {{\\\\n    public static void main(String[] args) {{\\\\n        Scanner scanner = new Scanner(System.in);\\\\n        // Parse input and call Solution.functionName\\\\n    }}\\\\n}}"
    }},
    "cpp": {{
      "starter_code": "class Solution {{\\\\npublic:\\\\n    int functionName(vector<int>& params) {{\\\\n        // Your code here\\\\n        return 0;\\\\n    }}\\\\n}};",
      "driver_code": "#include <iostream>\\\\n#include <vector>\\\\nusing namespace std;\\\\nint main() {{\\\\n    // Parse input and call Solution.functionName\\\\n    return 0;\\\\n}}"
    }}
  }}
}}

REQUIREMENTS:
1.  **JSON ONLY**: The response must be a valid JSON object.
2.  **Function Naming**: Create a snake_case function name from the problem title
3.  **Consistency**: Use the same function name in both starter_code and driver_code
4.  **Testcases**: Generate {testcase_count} testcases. Input must be a JSON object string.
5.  **Starter Code**: MUST be INCOMPLETE placeholder code. Only include function signature with \`pass\` or a comment like \`// Your code here\`. DO NOT include any algorithm implementation, loops, conditionals, or solution logic.
6.  **Driver Code**: ONLY parse JSON/input, call the named function, print result. NO algorithm logic.
7.  **Parameters**: Ensure starter code parameters match testcase structure.
8.  **Languages**: Provide Python, JavaScript, Java, and C++ code snippets.

CRITICAL: The starter_code must NOT contain the solution. It should only have the function signature and a placeholder.`;

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt, difficulty = 'medium', testcaseCount = 5 } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const formattedPrompt = GENERATION_PROMPT
          .replace(/{topic}/g, prompt)
          .replace(/{difficulty}/g, difficulty)
          .replace(/{testcase_count}/g, testcaseCount);

        console.log(`[AI Generation] Attempt ${attempt + 1}/${maxRetries}: "${prompt}"`);

        const response = await groq.chat.completions.create({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: formattedPrompt }],
          temperature: 0.7,
          max_tokens: 4096,
        });

        let rawResponse = response.choices[0]?.message?.content || '';
        rawResponse = rawResponse.trim();

        if (!rawResponse) {
          throw new Error('AI response was empty');
        }

        // Clean markdown code blocks if present
        if (rawResponse.includes('```json')) {
          const match = rawResponse.match(/```json\s*(.*?)\s*```/s);
          if (match) rawResponse = match[1];
        } else if (rawResponse.includes('```')) {
          const match = rawResponse.match(/```\s*(.*?)\s*```/s);
          if (match) rawResponse = match[1];
        }

        const result = JSON.parse(rawResponse);

        // Validate the response structure
        if (!result.title || !result.description || !result.testcases || !result.code_snippets) {
          throw new Error('Invalid response structure from AI');
        }

        // Ensure both Python and JavaScript snippets exist for tests
        const snippets = result.code_snippets;
        if (!snippets.python) {
          snippets.python = {
            starter_code: '# Write your solution here\n',
            driver_code: 'import sys\nimport json\nif __name__ == \'__main__\':\n    data = json.loads(sys.stdin.read())\n    pass  # call your function and print result\n',
          };
        }
        if (!snippets.javascript) {
          snippets.javascript = {
            starter_code: '// Write your solution here\n',
            driver_code: 'const input = require(\'fs\').readFileSync(0, \'utf-8\');\nconst data = JSON.parse(input);\n// call your function and console.log result\n',
          };
        }
        if (!snippets.java) {
          snippets.java = {
            starter_code: 'public class Solution {\n    // Implement your method here\n}\n',
            driver_code: '// Driver code not generated\n',
          };
        }
        if (!snippets.cpp) {
          snippets.cpp = {
            starter_code: '// Write your solution here\n',
            driver_code: '// Driver code not generated\n',
          };
        }
        result.code_snippets = snippets;

        console.log(`[AI Generation] Success on attempt ${attempt + 1}`);

        return NextResponse.json(result);

      } catch (err) {
        console.error(`[AI Generation] Attempt ${attempt + 1} failed:`, err.message);
        lastError = err;

        if (attempt < maxRetries - 1) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // All retries failed
    throw lastError || new Error('Failed to generate question after multiple attempts');

  } catch (error) {
    console.error('[AI Generation] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate question' },
      { status: 500 }
    );
  }
}
