import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

export async function GET(request: NextRequest) {
  try {
    // Try to get the latest video from the backend server first
    const backendResponse = await fetch(`${BACKEND_URL}/videos/latest`, {
      method: "GET",
      cache: "no-store",
    }).catch(() => null);

    if (backendResponse?.ok) {
      const data = await backendResponse.json();
      return NextResponse.json(data);
    }

    // Fallback: Check local generated-videos directory
    const generatedVideosDir = path.join(process.cwd(), "..", "generated-videos");
    
    if (!fs.existsSync(generatedVideosDir)) {
      return NextResponse.json({ error: "No videos directory found" }, { status: 404 });
    }

    const files = fs.readdirSync(generatedVideosDir);
    const videoFiles = files.filter(file => 
      file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.mov')
    );

    if (videoFiles.length === 0) {
      return NextResponse.json({ error: "No videos found" }, { status: 404 });
    }

    // Get file stats and sort by modification time
    const filesWithStats = videoFiles.map(file => {
      const filePath = path.join(generatedVideosDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        mtime: stats.mtime,
      };
    });

    // Sort by modification time (newest first)
    filesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    const latestVideo = filesWithStats[0];

    return NextResponse.json({
      filename: latestVideo.name,
      url: `/videos/${latestVideo.name}`,
      modified: latestVideo.mtime.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching latest video:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch latest video",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

