import AudioRecorder from "@/components/audio-recorder";
import { useState, useEffect } from 'react';
import Scoring from "./scoring";
import { get } from 'idb-keyval';

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
  const [versions, setVersions] = useState<Array<{
    transcript: string | null;
    aiScoringResult: ScoringResult | null;
    audioUrl: string;
    recordingTimestamp: Date;
  }>>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [expandedVersionIndex, setExpandedVersionIndex] = useState<number | null>(null);

  const handleTranscriptionComplete = async (newTranscript: string, newAudioUrl: string) => {
    console.log('YYY newTranscript', newTranscript);
    console.log('YYY ignore newAudioUrl', newAudioUrl);
    console.log('YYY version #???', versions.length);
    const versionNumber = getNextVersionNumber();
    const key = `audio_v${versionNumber}`;
    console.log('YYY in here with key', key);
    const audioBlob = await get(key);
    newAudioUrl = URL.createObjectURL(audioBlob);
    console.log('YYY USE THIS newAudioUrl INSTEAD', newAudioUrl);

    const newVersion = {
      transcript: newTranscript,
      aiScoringResult: null,
      audioUrl: newAudioUrl,
      recordingTimestamp: new Date(),
    };
    setVersions(prevVersions => [newVersion, ...prevVersions]);
    setExpandedVersionIndex(0); // Expand the newest version
    await handleAiScoring(newTranscript, 0);
  };

  const handleAiScoring = async (transcriptText: string, versionIndex: number) => {
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
      setVersions(prevVersions => {
        const newVersions = [...prevVersions];
        newVersions[versionIndex] = {
          ...newVersions[versionIndex],
          aiScoringResult: result,
        };
        return newVersions;
      });
    } catch (error) {
      console.error('AI Scoring error:', error);
    }
  };

  // Add this new function to handle expanding/collapsing versions
  const handleVersionToggle = (index: number) => {
    setExpandedVersionIndex(prevIndex => prevIndex === index ? null : index);
  };

  // Use useEffect to collapse all versions except the most recent when a new recording is added
  useEffect(() => {
    if (versions.length > 0) {
      setShowDebug(false);
      setExpandedVersionIndex(0);
    }
  }, [versions.length]);

  // Add this function to get the next version number
  const getNextVersionNumber = () => versions.length + 1;

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-bold text-gray-800">Vocalize</h1>
        <p className="text-sm text-gray-600 mb-4">
          Pitch Perfect. Confidence Amplified. Speak Up. Stand Out.
        </p>
        <div className="p-4 bg-white rounded-lg shadow">
          <AudioRecorder
            onTranscriptionComplete={handleTranscriptionComplete}
            version={getNextVersionNumber()}
          />
        </div>

        {versions.map((version, index) => (
          <div key={version.recordingTimestamp.toISOString()}>
            {showDebug && version.aiScoringResult && (
              <div className="p-4 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-2">Raw AI Scoring Result (Version {versions.length - index}):</h2>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {JSON.stringify(version.aiScoringResult, null, 2)}
                </pre>
              </div>
            )}
            {version.aiScoringResult && (
              <Scoring
                averageScore={version.aiScoringResult.finalScore}
                definedRound={`AI Evaluation (Version ${versions.length - index})`}
                categories={[
                  {
                    name: 'Content & Structure',
                    score: version.aiScoringResult.contentAndStructure.total,
                    subcategories: [
                      { name: 'Thesis & Message Clarity', score: version.aiScoringResult.contentAndStructure.thesisClarity },
                      { name: 'Organization', score: version.aiScoringResult.contentAndStructure.organization },
                      { name: 'Support & Evidence', score: version.aiScoringResult.contentAndStructure.supportEvidence },
                    ],
                  },
                  {
                    name: 'Delivery & Vocal Control',
                    score: version.aiScoringResult.deliveryAndVocalControl.total,
                    subcategories: [
                      { name: 'Pacing & Pausing', score: version.aiScoringResult.deliveryAndVocalControl.pacingPausing },
                      { name: 'Volume & Clarity', score: version.aiScoringResult.deliveryAndVocalControl.volumeClarity },
                      { name: 'Vocal Variety', score: version.aiScoringResult.deliveryAndVocalControl.vocalVariety },
                    ],
                  },
                  {
                    name: 'Language Use & Style',
                    score: version.aiScoringResult.languageUseAndStyle.total,
                    subcategories: [
                      { name: 'Grammar & Syntax', score: version.aiScoringResult.languageUseAndStyle.grammarSyntax },
                      { name: 'Appropriateness', score: version.aiScoringResult.languageUseAndStyle.appropriateness },
                      { name: 'Word Choice & Rhetoric', score: version.aiScoringResult.languageUseAndStyle.wordChoiceRhetoric },
                    ],
                  },
                ]}
                transcript={version.transcript}
                audioUrl={version.audioUrl}
                recordingTimestamp={version.recordingTimestamp}
                versionNumber={versions.length - index}
                isExpanded={index === expandedVersionIndex}
                onToggle={() => handleVersionToggle(index)} // Add this line
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}