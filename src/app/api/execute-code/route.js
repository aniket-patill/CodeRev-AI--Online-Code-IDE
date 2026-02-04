import { NextResponse } from 'next/server';
import { executeCode } from '@/lib/code-executor';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      code,
      language,
      testcases,
      timeout = 10000, // 10 seconds
      memoryLimit = 256, // MB
    } = body;

    // Validate required fields
    if (!code || !language || !testcases || !Array.isArray(testcases)) {
      return NextResponse.json(
        { error: 'Missing required fields: code, language, testcases' },
        { status: 400 }
      );
    }

    // Validate testcases structure
    for (const tc of testcases) {
      if (!tc.input || tc.expected_output === undefined) {
        return NextResponse.json(
          { error: 'Each testcase must have input and expected_output' },
          { status: 400 }
        );
      }
    }

    console.log(`[Code Execution] Running ${language} code with ${testcases.length} testcases`);

    // Execute code
    const result = await executeCode(code, language, testcases, {
      timeout: Math.min(timeout, 30000), // Cap at 30 seconds
      memoryLimit: Math.min(memoryLimit, 512), // Cap at 512 MB
    });

    console.log(`[Code Execution] Completed: ${result.summary.passed}/${result.summary.total} passed`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[Code Execution] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute code' },
      { status: 500 }
    );
  }
}
