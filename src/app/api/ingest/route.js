
import { NextResponse } from 'next/server';
import { parseLeetCodeList, scheduleLearningPath } from '@/lib/dsa-engine';

export async function POST(req) {
    try {
        const body = await req.json();
        const { url, type } = body;

        if (!url && !body.content) {
            return NextResponse.json({ error: "URL or Content required" }, { status: 400 });
        }

        let extractedProblems = [];

        // 1. Ingest
        if (type === 'link') {
            // For now, we only support LeetCode-style logic, but this is extensible
            extractedProblems = await parseLeetCodeList(url);
        } else if (type === 'pdf') {
            // PDF Parsing would go here (e.g. using pdf-parse library)
            // For now, returning a sample set for PDF demos
            extractedProblems = [
                { title: "Knapsack Problem", difficulty: "Medium", slug: "knapsack" },
                { title: "N-Queens", difficulty: "Hard", slug: "n-queens" }
            ];
        } else {
            // Manual text
            // Parsing logic for pasted text...
        }

        // 2. Intelligence / Orchestration
        const learningPath = scheduleLearningPath(extractedProblems);

        // 3. Response
        return NextResponse.json({
            success: true,
            data: learningPath,
            meta: {
                source: url,
                problemCount: extractedProblems.length
            }
        });

    } catch (error) {
        console.error("Ingestion Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
