import { NextResponse } from 'next/server';
import { SpeechClient } from '@google-cloud/speech';

export async function POST(inRequest: Request) {
  const { audio } = await inRequest.json();

  // Remove the data URL prefix
  const base64Audio = audio.split(',')[1];

  const client = new SpeechClient();

  const config = {
    encoding: 'WEBM_OPUS',
    sampleRateHertz: 48000,
    languageCode: 'en-US',
  };

  const request = {
    audio: { content: base64Audio },
    config: config,
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [response] = await client.recognize(request as any);
    const transcription = response.results
      ?.map(result => result.alternatives?.[0].transcript)
      .join('\n') || 'No transcription available';

    return NextResponse.json({ transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}