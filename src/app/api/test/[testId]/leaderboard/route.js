import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export async function GET(request, { params }) {
  try {
    const { testId } = await params;
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit')) || 50;
    const offsetParam = parseInt(searchParams.get('offset')) || 0;

    // Query submissions for this test
    const submissionsRef = collection(db, 'test_submissions');
    const q = query(
      submissionsRef,
      where('testId', '==', testId),
      orderBy('score', 'desc'),
      orderBy('timeTaken', 'asc'),
      orderBy('submittedAt', 'asc'),
      limit(limitParam)
    );

    const querySnapshot = await getDocs(q);
    
    // Group by user (keep only best submission per user)
    const userBestSubmissions = {};
    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const userId = data.userId;

      if (!userBestSubmissions[userId]) {
        userBestSubmissions[userId] = {
          id: doc.id,
          ...data,
        };
      } else {
        // Compare scores, if equal compare time
        const existing = userBestSubmissions[userId];
        if (
          data.score > existing.score ||
          (data.score === existing.score && data.timeTaken < existing.timeTaken)
        ) {
          userBestSubmissions[userId] = {
            id: doc.id,
            ...data,
          };
        }
      }
    });

    // Convert to array and add ranks
    const leaderboard = Object.values(userBestSubmissions)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.timeTaken !== b.timeTaken) return a.timeTaken - b.timeTaken;
        return a.submittedAt.toMillis() - b.submittedAt.toMillis();
      })
      .map((entry, index) => ({
        rank: index + 1,
        userId: entry.userId,
        userName: entry.userName,
        score: entry.score,
        testcasesPassed: entry.testcasesPassed,
        totalTestcases: entry.totalTestcases,
        timeTaken: entry.timeTaken,
        submittedAt: entry.submittedAt,
      }));

    // Calculate statistics
    const totalParticipants = leaderboard.length;
    const avgScore = totalParticipants > 0
      ? leaderboard.reduce((sum, entry) => sum + entry.score, 0) / totalParticipants
      : 0;
    const passedCount = leaderboard.filter(
      entry => entry.testcasesPassed === entry.totalTestcases
    ).length;

    console.log(`[Leaderboard] Fetched ${totalParticipants} entries for test ${testId}`);

    return NextResponse.json({
      leaderboard,
      stats: {
        totalParticipants,
        averageScore: Math.round(avgScore * 10) / 10,
        passRate: totalParticipants > 0
          ? Math.round((passedCount / totalParticipants) * 100)
          : 0,
      },
    });

  } catch (error) {
    console.error('[Leaderboard] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
