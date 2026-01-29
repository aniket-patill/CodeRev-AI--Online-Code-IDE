import { NextResponse } from "next/server";
import { runInSandbox } from "@/utils/execution/sandbox";
import { ALLOWED_LANGUAGES } from "@/utils/execution/executionConfig";

export async function POST(req) {
  try {
    const body = await req.json();
    const { code, language, stdin = "" } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'code'" },
        { status: 400 }
      );
    }

    const lang = (language || "javascript").toLowerCase();
    if (!ALLOWED_LANGUAGES.includes(lang)) {
      return NextResponse.json(
        { error: `Unsupported language: ${language}. Allowed: ${ALLOWED_LANGUAGES.join(", ")}` },
        { status: 400 }
      );
    }

    const result = await runInSandbox({
      code,
      language: lang,
      stdin: typeof stdin === "string" ? stdin : "",
    });

    return NextResponse.json({
      stdout: result.stdout,
      stderr: result.stderr,
      exit_code: result.exitCode,
      timed_out: result.timedOut,
    });
  } catch (error) {
    console.error("[execute]", error);
    const message = error.message || "Failed to execute code";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
