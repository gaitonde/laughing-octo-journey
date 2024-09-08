import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RubricScores {
  thesisClarity: number;
  organization: number;
  supportEvidence: number;
  pacingPausing: number;
  volumeClarity: number;
  vocalVariety: number;
  grammarSyntax: number;
  appropriateness: number;
  wordChoiceRhetoric: number;
}

interface ScoringResult {
  contentAndStructure: {
    thesisClarity: number;
    organization: number;
    supportEvidence: number;
    total: number;
  };
  deliveryAndVocalControl: {
    pacingPausing: number;
    volumeClarity: number;
    vocalVariety: number;
    total: number;
  };
  languageUseAndStyle: {
    grammarSyntax: number;
    appropriateness: number;
    wordChoiceRhetoric: number;
    total: number;
  };
  finalScore: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transcription } = body;

    if (!transcription) {
      return NextResponse.json({ error: 'Transcription is required' }, { status: 400 });
    }

    const prompt = `
      Act as an expert public English speaking coach. Evaluate the following transcript and provide a score on a scale of 1-5 for each of these categories:

      1. Thesis Clarity
      2. Organization
      3. Support/Evidence
      4. Pacing/Pausing
      5. Volume/Clarity
      6. Vocal Variety
      7. Grammar/Syntax
      8. Appropriateness
      9. Word Choice/Rhetoric

      Provide only the numerical scores for each category, separated by commas, in the order listed above. Do not include any other text in your response.

      Transcript:
      ${transcription}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const aiScores = response.choices[0].message.content?.split(',').map(Number);

    if (!aiScores || aiScores.length !== 9) {
      throw new Error('Invalid AI response');
    }

    const rubricScores: RubricScores = {
      thesisClarity: aiScores[0],
      organization: aiScores[1],
      supportEvidence: aiScores[2],
      pacingPausing: aiScores[3],
      volumeClarity: aiScores[4],
      vocalVariety: aiScores[5],
      grammarSyntax: aiScores[6],
      appropriateness: aiScores[7],
      wordChoiceRhetoric: aiScores[8],
    };

    // Calculate scores
    const contentAndStructure = {
      thesisClarity: rubricScores.thesisClarity * 4,
      organization: rubricScores.organization * 3,
      supportEvidence: rubricScores.supportEvidence,
      total: 0
    };
    contentAndStructure.total = contentAndStructure.thesisClarity + contentAndStructure.organization + contentAndStructure.supportEvidence;

    const deliveryAndVocalControl = {
      pacingPausing: rubricScores.pacingPausing * 4,
      volumeClarity: rubricScores.volumeClarity * 3,
      vocalVariety: rubricScores.vocalVariety,
      total: 0
    };
    deliveryAndVocalControl.total = deliveryAndVocalControl.pacingPausing + deliveryAndVocalControl.volumeClarity + deliveryAndVocalControl.vocalVariety;

    const languageUseAndStyle = {
      grammarSyntax: rubricScores.grammarSyntax * 2,
      appropriateness: rubricScores.appropriateness,
      wordChoiceRhetoric: rubricScores.wordChoiceRhetoric,
      total: 0
    };
    languageUseAndStyle.total = languageUseAndStyle.grammarSyntax + languageUseAndStyle.appropriateness + languageUseAndStyle.wordChoiceRhetoric;

    const finalScore = (
      (contentAndStructure.total / 40) * 0.4 +
      (deliveryAndVocalControl.total / 40) * 0.4 +
      (languageUseAndStyle.total / 20) * 0.2
    ) * 100;

    const result: ScoringResult = {
      contentAndStructure,
      deliveryAndVocalControl,
      languageUseAndStyle,
      finalScore: parseFloat(finalScore.toFixed(2))
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}