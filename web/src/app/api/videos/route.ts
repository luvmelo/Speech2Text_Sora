import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const response = await fetch(`${BACKEND_URL}/videos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const message = errorPayload.details || errorPayload.error || "Video generation failed";
      return NextResponse.json({ error: "Video generation failed", message }, { status: response.status });
    }

    const result = await response.json();
    const downloadPath = result.download_url as string | null;
    const absoluteUrl = downloadPath ? new URL(downloadPath, BACKEND_URL).toString() : null;

    return NextResponse.json({
      job_id: result.job_id,
      status: result.status,
      download_url: absoluteUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to generate video",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
