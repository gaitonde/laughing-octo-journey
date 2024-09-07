'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';

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

  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);

  const getRandomScore = () => Math.floor(Math.random() * 5) + 1;

  const [formData, setFormData] = useState({
    thesisClarity: getRandomScore(),
    organization: getRandomScore(),
    supportEvidence: getRandomScore(),
    pacingPausing: getRandomScore(),
    volumeClarity: getRandomScore(),
    vocalVariety: getRandomScore(),
    grammarSyntax: getRandomScore(),
    appropriateness: getRandomScore(),
    wordChoiceRhetoric: getRandomScore(),
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error('Scoring failed');
      }
      const result = await response.json();
      setScoringResult(result);
    } catch (error) {
      console.error('Scoring error:', error);
      setScoringResult(null);
    }
  };

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

  // Helper function to convert Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">3-Second Audio Recorder with Transcription</h1>
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
          {transcript && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold">Transcript:</h2>
              <p>{transcript}</p>
            </div>
          )}
        </>
      )}

      <div className="flex flex-col md:flex-row mt-8 gap-8">
        <div className="w-full md:w-1/2">
          <h2 className="text-xl font-bold mb-4">Speech Scoring Form</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {Object.entries(formData).map(([key, value]) => (
              <div key={key} className="flex items-center">
                <label htmlFor={key} className="w-48">{key}:</label>
                <input
                  type="number"
                  id={key}
                  name={key}
                  value={value}
                  onChange={handleInputChange}
                  min="1"
                  max="5"
                  required
                  className="border rounded px-2 py-1 text-black w-16"
                />
              </div>
            ))}
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
              Submit for Scoring
            </button>
          </form>
        </div>

        <div className="w-full md:w-1/2">
          <h2 className="text-xl font-bold mb-4">Scoring Result</h2>
          {scoringResult ? (
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-black h-full">
              {JSON.stringify(scoringResult, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-500">Submit the form to see results here.</p>
          )}
        </div>
      </div>
    </div>
  );
}
