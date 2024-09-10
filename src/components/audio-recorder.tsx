import React, { useState, useRef, useEffect } from 'react';
import Scoring from './scoring';

interface AudioRecorderProps {
  onTranscriptionComplete: (transcript: string) => void;
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

export default function AudioRecorder({ onTranscriptionComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [aiScoringResult, setAiScoringResult] = useState<ScoringResult | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm; codecs=opus' });

    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm; codecs=opus' });
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      try {
        const transcription = await getTranscription(audioBlob);
        setTranscript(transcription); // Update the transcript state
        onTranscriptionComplete(transcription);
      } catch (error) {
        console.error('Transcription error:', error);
        setTranscript('Transcription failed'); // Update the transcript state even on error
        onTranscriptionComplete('Transcription failed');
      }
    };

    audioChunksRef.current = [];
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);

    setTimeout(() => {
      mediaRecorder.stop();
      stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }, 3000);
  };

  const getTranscription = async (audioBlob: Blob): Promise<string> => {
    const audioBase64 = await blobToBase64(audioBlob);

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: audioBase64 }),
    });

    if (!response.ok) {
      throw new Error('Transcription failed');
    }

    const data = await response.json();
    return data.transcription;
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
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
      const result: ScoringResult = await response.json();
      setAiScoringResult(result);
    } catch (error) {
      console.error('AI Scoring error:', error);
      setAiScoringResult(null);
    }
  };

  const scoringData = aiScoringResult ? {
    averageScore: aiScoringResult.finalScore,
    definedRound: 'AI Evaluation',
    categories: [
      {
        name: 'Content & Structure',
        score: aiScoringResult.contentAndStructure.total,
        weight: 1,
        subcategories: [
          { name: 'Thesis Clarity', score: aiScoringResult.contentAndStructure.thesisClarity, weight: 1 },
          { name: 'Organization', score: aiScoringResult.contentAndStructure.organization, weight: 1 },
          { name: 'Support & Evidence', score: aiScoringResult.contentAndStructure.supportEvidence, weight: 1 },
        ],
      },
      {
        name: 'Delivery & Vocal Control',
        score: aiScoringResult.deliveryAndVocalControl.total,
        weight: 1,
        subcategories: [
          { name: 'Pacing & Pausing', score: aiScoringResult.deliveryAndVocalControl.pacingPausing, weight: 1 },
          { name: 'Volume & Clarity', score: aiScoringResult.deliveryAndVocalControl.volumeClarity, weight: 1 },
          { name: 'Vocal Variety', score: aiScoringResult.deliveryAndVocalControl.vocalVariety, weight: 1 },
        ],
      },
      {
        name: 'Language Use & Style',
        score: aiScoringResult.languageUseAndStyle.total,
        weight: 1,
        subcategories: [
          { name: 'Grammar & Syntax', score: aiScoringResult.languageUseAndStyle.grammarSyntax, weight: 1 },
          { name: 'Appropriateness', score: aiScoringResult.languageUseAndStyle.appropriateness, weight: 1 },
          { name: 'Word Choice & Rhetoric', score: aiScoringResult.languageUseAndStyle.wordChoiceRhetoric, weight: 1 },
        ],
      },
    ],
  } : null;

  return (
    <div>
      <button
        className="bg-purple-600 text-white px-4 py-2 rounded"
        onClick={startRecording}
        disabled={isRecording}
      >
        {isRecording ? 'Recording...' : 'Record'}
      </button>
      {audioUrl && (
        <>
          <audio className="mt-4 block" controls src={audioUrl} />
{/*
          <a
            className="mt-2 inline-block text-blue-500"
            href={audioUrl}
            download="recording.webm"
          >
            Download Recording
          </a>
           */}
        </>
      )}
      {transcript && (
        <div className="mt-4">
          {/* <h2 className="text-xl font-semibold">Transcript:</h2> */}
          {/* <p>{transcript}</p> */}
{/*
          <button
            className="mt-2 bg-green-500 text-white px-4 py-2 rounded"
            onClick={handleAiScoring}
          >
            Score with AI
          </button>
           */}
        </div>
      )}
      {scoringData && <Scoring {...scoringData} />}
    </div>
  );
}