'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
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
    </div>
  );
}
