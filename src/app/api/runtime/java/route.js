/**
 * Proxy to Java Execution Service (Docker container).
 * No execution in Next.js; forwards to JAVA_EXECUTION_SERVICE_URL.
 */

import { NextResponse } from "next/server";

const JAVA_SERVICE_URL =
  process.env.JAVA_EXECUTION_SERVICE_URL || "http://localhost:4001/execute";

export async function POST(req) {
  try {
    const body = await req.json();
    const { code, input } = body || {};

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid code" },
        { status: 400 }
      );
    }

    const res = await fetch(JAVA_SERVICE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, input: input ?? "" }),
      signal: AbortSignal.timeout(5000),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          output: "",
          error: data.error || data.message || `Service error: ${res.status}`,
          executionTime: 0,
        },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: data.success ?? false,
      output: data.output ?? "",
      error: data.error ?? null,
      executionTime: data.executionTime ?? 0,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        output: "",
        error: err.message || "Java execution service unavailable",
        executionTime: 0,
      },
      { status: 502 }
    );
  }
}
