import AudioRecorder from "@/components/audio-recorder";
import { useEffect, useState } from 'react';
import Scoring from "./scoring";

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

export default function ProgressTracker() {
  const [transcript, setTranscript] = useState<string | null>(null);
  const [aiScoringResult, setAiScoringResult] = useState<ScoringResult | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    setShowDebug(true);
    setShowDebug(false);
  }, [showDebug]);

  const handleTranscriptionComplete = async (newTranscript: string, newAudioUrl: string) => {
    setTranscript(newTranscript);
    setAudioUrl(newAudioUrl);
    await handleAiScoring(newTranscript);
  };

  const handleAiScoring = async (transcriptText: string) => {
    if (!transcriptText) {
      console.error('No transcript available for scoring.');
      return;
    }

    try {
      const response = await fetch('/api/ai-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription: transcriptText }),
      });
      if (!response.ok) {
        throw new Error('AI Scoring failed');
      }
      const result = await response.json();
      setAiScoringResult(result);
    } catch (error) {
      console.error('AI Scoring error:', error);
      setAiScoringResult(null);
    }
  };

  const evaluationData = aiScoringResult ? {
    averageScore: aiScoringResult.finalScore,
    definedRound: 'AI Evaluation',
    categories: [
      {
        name: 'Content & Structure',
        score: aiScoringResult.contentAndStructure.total,
        subcategories: [
          { name: 'Thesis & Message Clarity', score: aiScoringResult.contentAndStructure.thesisClarity },
          { name: 'Organization', score: aiScoringResult.contentAndStructure.organization },
          { name: 'Support & Evidence', score: aiScoringResult.contentAndStructure.supportEvidence },
        ],
      },
      {
        name: 'Delivery & Vocal Control',
        score: aiScoringResult.deliveryAndVocalControl.total,
        subcategories: [
          { name: 'Pacing & Pausing', score: aiScoringResult.deliveryAndVocalControl.pacingPausing },
          { name: 'Volume & Clarity', score: aiScoringResult.deliveryAndVocalControl.volumeClarity },
          { name: 'Vocal Variety', score: aiScoringResult.deliveryAndVocalControl.vocalVariety },
        ],
      },
      {
        name: 'Language Use & Style',
        score: aiScoringResult.languageUseAndStyle.total,
        subcategories: [
          { name: 'Grammar & Syntax', score: aiScoringResult.languageUseAndStyle.grammarSyntax },
          { name: 'Appropriateness', score: aiScoringResult.languageUseAndStyle.appropriateness },
          { name: 'Word Choice & Rhetoric', score: aiScoringResult.languageUseAndStyle.wordChoiceRhetoric },
        ],
      },
    ],
    transcript: transcript,
    audioUrl: audioUrl,
    recordingTimestamp: new Date(),
  } : null;

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-bold text-gray-800">Vocalize</h1>
        <p className="text-sm text-gray-600 mb-4">
        Pitch Perfect. Confidence Amplified. Speak Up. Stand Out.
        </p>
        <div className="p-4 bg-white rounded-lg shadow">
          <AudioRecorder onTranscriptionComplete={handleTranscriptionComplete} />
        </div>

        {showDebug && aiScoringResult && (
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Raw AI Scoring Result:</h2>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(aiScoringResult, null, 2)}
            </pre>
          </div>
        )}
        {evaluationData && (
          <div>
            <Scoring {...evaluationData} />
          </div>
        )}
      </div>
    </div>
  )
}