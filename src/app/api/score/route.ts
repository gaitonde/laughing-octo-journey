import { NextRequest, NextResponse } from 'next/server';

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
    const body: RubricScores = await req.json();

    // Validate input
    const requiredFields: (keyof RubricScores)[] = [
      'thesisClarity', 'organization', 'supportEvidence',
      'pacingPausing', 'volumeClarity', 'vocalVariety',
      'grammarSyntax', 'appropriateness', 'wordChoiceRhetoric'
    ];

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] < 1 || body[field] > 5) {
        return NextResponse.json({ error: `Invalid or missing value for ${field}` }, { status: 400 });
      }
    }

    // Calculate scores
    const contentAndStructure = {
      thesisClarity: body.thesisClarity * 4,
      organization: body.organization * 3,
      supportEvidence: body.supportEvidence,
      total: 0
    };
    contentAndStructure.total = contentAndStructure.thesisClarity + contentAndStructure.organization + contentAndStructure.supportEvidence;

    const deliveryAndVocalControl = {
      pacingPausing: body.pacingPausing * 4,
      volumeClarity: body.volumeClarity * 3,
      vocalVariety: body.vocalVariety,
      total: 0
    };
    deliveryAndVocalControl.total = deliveryAndVocalControl.pacingPausing + deliveryAndVocalControl.volumeClarity + deliveryAndVocalControl.vocalVariety;

    const languageUseAndStyle = {
      grammarSyntax: body.grammarSyntax * 2,
      appropriateness: body.appropriateness,
      wordChoiceRhetoric: body.wordChoiceRhetoric,
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
      finalScore: parseFloat((finalScore ?? 0).toFixed(2))
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}