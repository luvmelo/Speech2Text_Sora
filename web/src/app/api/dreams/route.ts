import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const RECORDS_DIR = 'dream-records';
const LOCAL_AUDIO_FILENAME = 'dream-latest.webm';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as File;
    const duration = formData.get('duration') as string | null;
    const language = (formData.get('language') as string | null) ?? undefined;
    const breatheImage = formData.get('breathe_image') as File | null;

    if (!audio) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    const fileName = audio.name || LOCAL_AUDIO_FILENAME;
    const mimeType = audio.type || 'audio/webm';
    const buffer = Buffer.from(await audio.arrayBuffer());

    // Persist the latest recording locally (overwrites each run)
    const recordsPath = join(process.cwd(), RECORDS_DIR);
    await mkdir(recordsPath, { recursive: true });
    await writeFile(join(recordsPath, LOCAL_AUDIO_FILENAME), buffer);

    // Create FormData for backend request
    const backendFormData = new FormData();
    backendFormData.append(
      'audio',
      new Blob([buffer], { type: mimeType }),
      fileName,
    );
    if (duration) {
      backendFormData.append('duration', duration);
    }
    if (language) {
      backendFormData.append('language', language);
    }
    if (breatheImage) {
      const imgArrayBuf = await breatheImage.arrayBuffer();
      const imgMime = breatheImage.type || 'image/png';
      backendFormData.append('breathe_image', new Blob([Buffer.from(imgArrayBuf)], { type: imgMime }), breatheImage.name || `breathe-${Date.now()}.png`);
    }

    // Call Java backend with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    let response;
    try {
      response = await fetch(`${BACKEND_URL}/dreams`, {
        method: 'POST',
        body: backendFormData,
        signal: controller.signal,
        cache: 'no-store',
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Backend connection error:', fetchError);
      throw new Error(
        'Cannot connect to backend server. Please ensure the Java backend is running on port 8080. ' +
        'Run: ./start-backend.sh'
      );
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.details || 'Backend request failed');
    }

    const data = await response.json();

    // Save transcript and prompt to JSON file
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      const record = {
        timestamp: new Date().toISOString(),
        transcript: data.transcript,
        prompt: data.prompt,
        video: data.video,
        elapsed_ms: data.elapsed_ms
      };

      const filename = `dream-${timestamp}.json`;
      const filepath = join(recordsPath, filename);
      await writeFile(filepath, JSON.stringify(record, null, 2), 'utf-8');

      console.log(`✅ Saved dream record to: ${filename}`);
    } catch (saveError) {
      console.error('Failed to save dream record:', saveError);
      // Don't fail the request if saving fails
    }

    // Return the response from Java backend
    return NextResponse.json({
      transcript: data.transcript,
      prompt: data.prompt,
      video: {
        job_id: data.video?.job_id || `dream-${Date.now()}`,
        status: data.video?.status || 'skipped',
        download_url: data.video?.download_url
      },
      elapsed_ms: data.elapsed_ms
    });
  } catch (error) {
    console.error('Dreams API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process dream recording',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
