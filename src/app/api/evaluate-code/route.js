import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize Groq client (OpenAI-compatible)
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const EVALUATION_PROMPT = `You are an expert code reviewer and evaluator for coding tests.
Analyze the submitted code and provide a detailed evaluation.

PROBLEM:
Title: {problemTitle}
Description: {problemDescription}

SUBMITTED CODE:
\`\`\`{language}
{code}
\`\`\`

TEST RESULTS:
- Testcases Passed: {testcasesPassed} / {totalTestcases}

EVALUATION CRITERIA:
1. **Code Approach** (0-30 points): How well does the solution approach the problem?
   - Is the algorithm correct and efficient?
   - Is it a brute force or optimal approach?
   
2. **Time Complexity** (0-25 points): What is the time complexity?
   - O(1): 25 points
   - O(log n): 23 points
   - O(n): 20 points
   - O(n log n): 17 points
   - O(n²): 10 points
   - O(2^n) or worse: 5 points
   
3. **Space Complexity** (0-25 points): What is the space complexity?
   - O(1): 25 points
   - O(log n): 22 points
   - O(n): 18 points
   - O(n²) or worse: 10 points
   
4. **Code Quality** (0-20 points): Code readability, style, and best practices
   - Variable naming, comments, structure

RESPONSE FORMAT:
Return a valid JSON object with this exact structure:
{
  "approachScore": <number 0-30>,
  "timeComplexityScore": <number 0-25>,
  "spaceComplexityScore": <number 0-25>,
  "codeQualityScore": <number 0-20>,
  "totalAIScore": <number 0-100>,
  "timeComplexity": "<O notation>",
  "spaceComplexity": "<O notation>",
  "approachSummary": "<brief summary of the approach>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "feedback": "<detailed feedback paragraph>"
}

Be fair but rigorous. If code doesn't pass all testcases, factor that into the approach score.
RESPOND WITH JSON ONLY. No markdown formatting.`;

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      code,
      language = 'python',
      problemTitle = 'Unknown Problem',
      problemDescription = '',
      testcasesPassed = 0,
      totalTestcases = 0,
    } = body;

    if (!code || !code.trim()) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      console.log('[AI Evaluator] GROQ_API_KEY not configured, returning default scores');
      // Return a default score if AI is not configured
      return NextResponse.json({
        approachScore: Math.round((testcasesPassed / Math.max(totalTestcases, 1)) * 30),
        timeComplexityScore: 15,
        spaceComplexityScore: 15,
        codeQualityScore: 10,
        totalAIScore: Math.round((testcasesPassed / Math.max(totalTestcases, 1)) * 30) + 40,
        timeComplexity: 'Unknown',
        spaceComplexity: 'Unknown',
        approachSummary: 'AI evaluation not available',
        strengths: ['Code submitted successfully'],
        improvements: ['Enable AI evaluation for detailed feedback'],
        feedback: 'AI evaluation is not configured. Score based on testcases passed.',
        aiEvaluated: false,
      });
    }

    const prompt = EVALUATION_PROMPT
      .replace('{problemTitle}', problemTitle)
      .replace('{problemDescription}', problemDescription.substring(0, 500))
      .replace('{language}', language)
      .replace('{code}', code.substring(0, 3000)) // Limit code length
      .replace('{testcasesPassed}', testcasesPassed.toString())
      .replace('{totalTestcases}', totalTestcases.toString());

    console.log('[AI Evaluator] Starting code evaluation...');

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert code reviewer. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    // Extract JSON from response
    let evaluation;
    try {
      // Try to parse directly
      evaluation = JSON.parse(responseText);
    } catch {
      // Try to extract JSON from markdown code block
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try to find JSON object in the text
        const objectMatch = responseText.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          evaluation = JSON.parse(objectMatch[0]);
        } else {
          throw new Error('Could not extract JSON from response');
        }
      }
    }

    // Ensure all required fields and valid scores
    const result = {
      approachScore: Math.min(30, Math.max(0, evaluation.approachScore || 0)),
      timeComplexityScore: Math.min(25, Math.max(0, evaluation.timeComplexityScore || 0)),
      spaceComplexityScore: Math.min(25, Math.max(0, evaluation.spaceComplexityScore || 0)),
      codeQualityScore: Math.min(20, Math.max(0, evaluation.codeQualityScore || 0)),
      totalAIScore: 0,
      timeComplexity: evaluation.timeComplexity || 'Unknown',
      spaceComplexity: evaluation.spaceComplexity || 'Unknown',
      approachSummary: evaluation.approachSummary || '',
      strengths: evaluation.strengths || [],
      improvements: evaluation.improvements || [],
      feedback: evaluation.feedback || '',
      aiEvaluated: true,
    };
    
    // Calculate total
    result.totalAIScore = result.approachScore + result.timeComplexityScore + 
                          result.spaceComplexityScore + result.codeQualityScore;

    console.log('[AI Evaluator] Evaluation complete. Score:', result.totalAIScore);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[AI Evaluator] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to evaluate code',
        approachScore: 0,
        timeComplexityScore: 0,
        spaceComplexityScore: 0,
        codeQualityScore: 0,
        totalAIScore: 0,
        aiEvaluated: false,
      },
      { status: 500 }
    );
  }
}
