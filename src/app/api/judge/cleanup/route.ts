import { NextResponse } from "next/server";
import { SessionManager } from "@/lib/judge/SessionManager";

export async function POST() {
    try {
        await SessionManager.cleanupInactiveSessions();
        return NextResponse.json({ status: "cleaned" });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
