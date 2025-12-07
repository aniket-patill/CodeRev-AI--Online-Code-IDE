import { NextResponse } from "next/server";
import { fixCode } from "@/utils/gemini";

export async function POST(request) {
  try {
    const { code } = await request.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Valid code string is required" },
        { status: 400 }
      );
    }

    // Try to fix code with AI
    const result = await fixCode(code);

    return NextResponse.json(
      result,
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        }
      }
    );
  } catch (error) {
    console.error("Error in /api/get-errors:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
