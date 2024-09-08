'use client';

import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
        setTranscript(transcription);
      } catch (error) {
        console.error('Transcription error:', error);
        setTranscript('Transcription failed');
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
    }, 10000);
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

  // Helper function to convert Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const [aiScoringResult, setAiScoringResult] = useState<ScoringResult | null>(null);

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
    <div className="h-screen p-4 flex flex-col">
      <h1 className="text-2xl font-bold mb-4">10-Second Audio Recorder with Transcription</h1>
      <div className="flex flex-grow overflow-hidden">
        <div className="w-1/2 pr-4 overflow-y-auto">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={startRecording}
            disabled={isRecording}
          >
            {isRecording ? 'Recording...' : 'Record'}
          </button>
          {audioUrl && (
            <>
              <audio className="mt-4 block" controls src={audioUrl} />
              <a
                className="mt-2 inline-block text-blue-500"
                href={audioUrl}
                download="recording.webm"
              >
                Download Recording
              </a>
            </>
          )}
        </div>
        <div className="w-1/2 pl-4 overflow-y-auto">
          {transcript && (
            <div className="mt-4">
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
            <div className="mt-4">
              <h2 className="text-xl font-bold mb-2">AI Scoring Result</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-black">
                {JSON.stringify(aiScoringResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
