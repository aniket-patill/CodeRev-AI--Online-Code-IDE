/**
 * Proxy to C++ compile service (emcc Docker container).
 * Forwards code and returns WASM binary. No compilation in Next.js.
 */

import { NextResponse } from "next/server";

const COMPILE_SERVICE_URL =
  process.env.CPP_COMPILE_SERVICE_URL || "http://localhost:4002/compile";

export async function POST(req) {
  try {
    const body = await req.json();
    const { code } = body || {};

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid code" },
        { status: 400 }
      );
    }

    const res = await fetch(COMPILE_SERVICE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: text || `Compile failed: ${res.status}` },
        { status: res.status }
      );
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      const wasmBase64 = data.wasm || data.binary;
      if (wasmBase64) {
        const buf = Buffer.from(wasmBase64, "base64");
        return new NextResponse(buf, {
          headers: { "Content-Type": "application/wasm" },
        });
      }
    }

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: { "Content-Type": "application/wasm" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err.message || "C++ compile service unavailable",
      },
      { status: 502 }
    );
  }
}
