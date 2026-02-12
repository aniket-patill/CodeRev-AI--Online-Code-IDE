import { NextResponse } from "next/server";
import { executeCode } from "@/lib/execution-client";

export async function POST(req) {
  try {
    const { code, language, input = "" } = await req.json();

    if (!code || !language) {
      return NextResponse.json(
        { error: "Missing required fields: code, language" },
        { status: 400 }
      );
    }

    console.log(`[Code Execution] Running ${language} code`);

    const result = await executeCode({
      code,
      language,
      input,
      timeout: 5000
    });

    console.log(`[Code Execution] Completed`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[Code Execution] Error:', error);
    return NextResponse.json(
      { error: error.message || "Failed to execute code" },
      { status: 500 }
    );
  }
}
