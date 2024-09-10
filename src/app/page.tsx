'use client';

import ProgressTracker from "@/components/progress-tracker";
import { useState } from 'react';

export default function Home() {
  const [transcript, setTranscript] = useState<string | null>(null);
  const [aiScoringResult, setAiScoringResult] = useState<ScoringResult | null>(null);

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

  const handleTranscriptionComplete = (newTranscript: string) => {
    setTranscript(newTranscript);
  };

  const handleAiScoring = async () => {
    if (!transcript) {
      alert('Please record audio and generate a transcript first.');
      return;
    }

    try {
      const response = await fetch('/api/ai-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription: transcript }),
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

  return (
    <div className="flex flex-col h-screen">
      {transcript && (
        <div className="p-4">
          <h2 className="text-xl font-semibold">Transcript:</h2>
          <p>{transcript}</p>
          <button
            className="mt-2 bg-green-500 text-white px-4 py-2 rounded"
            onClick={handleAiScoring}
          >
            Score with AI
          </button>
        </div>
      )}
      {aiScoringResult && (
        <div className="mt-4 p-4">
          <h2 className="text-xl font-bold mb-2">AI Scoring Result</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-black">
            {JSON.stringify(aiScoringResult, null, 2)}
          </pre>
        </div>
      )}
      <ProgressTracker />
    </div>
  );
}
