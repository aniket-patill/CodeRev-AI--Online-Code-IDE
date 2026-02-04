import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, addDoc, Timestamp, getDoc, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';

export async function POST(request, { params }) {
  try {
    const { testId } = await params;
    const body = await request.json();
    const {
      userId,
      userName,
      code,
      language,
      executionResults,
      score,
      testcasesPassed,
      totalTestcases,
      timeTaken, // in seconds
      participantId, // The participant doc ID in the subcollection
      problemTitle,
      problemDescription,
    } = body;

    // Validate required fields
    if (!code || !executionResults || score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify test exists
    const testRef = doc(db, 'tests', testId);
    const testSnap = await getDoc(testRef);

    if (!testSnap.exists()) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    const testData = testSnap.data();

    // Run AI evaluation in the background
    let aiEvaluation = null;
    try {
      const evalResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/evaluate-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: language || 'python',
          problemTitle: problemTitle || testData.questions?.[0]?.title || 'Problem',
          problemDescription: problemDescription || testData.questions?.[0]?.description || '',
          testcasesPassed,
          totalTestcases,
        }),
      });

      if (evalResponse.ok) {
        aiEvaluation = await evalResponse.json();
        console.log('[Submission] AI Evaluation score:', aiEvaluation.totalAIScore);
      }
    } catch (evalErr) {
      console.error('[Submission] AI Evaluation failed:', evalErr);
      // Continue without AI evaluation
    }

    // Create submission with AI evaluation
    const submissionData = {
      testId,
      userId,
      userName: userName || 'Anonymous',
      code,
      language: language || 'python',
      executionResults,
      score,
      testcasesPassed,
      totalTestcases,
      timeTaken: timeTaken || 0,
      submittedAt: Timestamp.now(),
      // AI Evaluation data
      aiEvaluation: aiEvaluation || null,
      aiScore: aiEvaluation?.totalAIScore || 0,
    };

    const submissionRef = await addDoc(
      collection(db, 'test_submissions'),
      submissionData
    );

    // Update participant status in test subcollection
    if (participantId) {
      try {
        const participantRef = doc(db, `tests/${testId}/participants`, participantId);
        await updateDoc(participantRef, {
          status: 'submitted',
          score,
          testcasesPassed,
          totalTestcases,
          timeTaken: timeTaken || 0,
          submittedAt: Timestamp.now(),
          // AI scores for leaderboard
          aiScore: aiEvaluation?.totalAIScore || 0,
          aiEvaluation: aiEvaluation ? {
            approachScore: aiEvaluation.approachScore,
            timeComplexityScore: aiEvaluation.timeComplexityScore,
            spaceComplexityScore: aiEvaluation.spaceComplexityScore,
            codeQualityScore: aiEvaluation.codeQualityScore,
            timeComplexity: aiEvaluation.timeComplexity,
            spaceComplexity: aiEvaluation.spaceComplexity,
          } : null,
        });
        console.log(`[Submission] Updated participant ${participantId} with AI score: ${aiEvaluation?.totalAIScore || 0}`);
      } catch (updateErr) {
        console.error('[Submission] Failed to update participant status:', updateErr);
        // Continue - submission was still created
      }
    }

    console.log(`[Submission] Created submission ${submissionRef.id} for test ${testId}`);

    return NextResponse.json({
      success: true,
      submissionId: submissionRef.id,
      score,
      testcasesPassed,
      totalTestcases,
      aiScore: aiEvaluation?.totalAIScore || 0,
      aiEvaluation: aiEvaluation || null,
    });

  } catch (error) {
    console.error('[Submission] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit test' },
      { status: 500 }
    );
  }
}
