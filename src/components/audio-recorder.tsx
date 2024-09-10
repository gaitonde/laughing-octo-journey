import { useEffect, useRef, useState } from 'react';
interface AudioRecorderProps {
  onTranscriptionComplete: (transcript: string, audioUrl: string) => void;
}

type RecorderState = 'Ready' | 'Recording' | 'Transcribing';

export default function AudioRecorder({ onTranscriptionComplete }: AudioRecorderProps) {
  const [recorderState, setRecorderState] = useState<RecorderState>('Ready');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [timeLimit, setTimeLimit] = useState(5);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let stopTimeout: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;

    if (recorderState === 'Recording') {
      stopTimeout = setTimeout(() => {
        stopRecording();
      }, timeLimit * 1000);

      intervalId = setInterval(() => {
        setRecordingTime((prevTime) => {
          if (prevTime >= timeLimit) {
            clearInterval(intervalId);
            return timeLimit;
          }
          return prevTime + 1;
        });
      }, 1000);
    }

    return () => {
      clearTimeout(stopTimeout);
      clearInterval(intervalId);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [recorderState, timeLimit, audioUrl]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm; codecs=opus' });

    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      setRecorderState('Transcribing');
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm; codecs=opus' });
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      try {
        const transcription = await getTranscription(audioBlob);
        onTranscriptionComplete(transcription, url);
      } catch (error) {
        console.error('Transcription error:', error);
        onTranscriptionComplete('Transcription failed', url);
      } finally {
        setRecorderState('Ready');
        setRecordingTime(0);
      }
    };

    audioChunksRef.current = [];
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setRecorderState('Recording');
    setRecordingTime(0);

    // Remove the timerRef.current setup from here
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recorderState === 'Recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setRecorderState('Transcribing');
    }
  };

  const handleRecordClick = () => {
    if (recorderState === 'Ready') {
      startRecording();
    } else if (recorderState === 'Recording') {
      stopRecording();
    }
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

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <button
          className={`px-4 py-2 rounded ${
            recorderState === 'Recording' ? 'bg-red-600' : 'bg-orange-600'
          } text-white`}
          onClick={handleRecordClick}
          disabled={recorderState === 'Transcribing'}
        >
          {recorderState === 'Ready' ? 'Record' : recorderState === 'Recording' ? 'Stop' : 'Transcribing...'}
        </button>
        <div className="flex items-center space-x-2">
          <label htmlFor="timeLimit" className="text-sm font-medium text-gray-700">
            Time Limit (seconds):
          </label>
          <input
            type="number"
            id="timeLimit"
            value={timeLimit}
            onChange={(e) => setTimeLimit(Math.max(1, parseInt(e.target.value)))}
            className="w-16 px-2 py-1 border rounded-md"
            min="1"
            disabled={recorderState !== 'Ready'}
          />
        </div>
      </div>
      {recorderState === 'Recording' && (
        <div className="text-sm text-gray-600">
          Recording: {recordingTime}s / {timeLimit}s
        </div>
      )}
    </div>
  );
}