package com.dreamvisualizer.orchestrator;

import com.dreamvisualizer.prompt.DreamPromptEngineer;
import com.dreamvisualizer.prompt.DreamPromptResult;
import com.dreamvisualizer.speech.SpeechTranscriptionRequest;
import com.dreamvisualizer.speech.SpeechTranscriptionService;
import com.dreamvisualizer.speech.SpeechTranscript;
import com.dreamvisualizer.video.SoraVideoJob;
import com.dreamvisualizer.video.SoraVideoService;
import com.dreamvisualizer.video.VideoGenerationOptions;

import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
import java.nio.file.Path;

/**
 * High-level pipeline that stitches together transcription, prompt engineering, and video generation.
 */
public class DreamVisualizationPipeline {

    private final SpeechTranscriptionService transcriptionService;
    private final DreamPromptEngineer promptEngineer;
    private final SoraVideoService videoService;
    private final boolean skipVideoGeneration;

    public DreamVisualizationPipeline(SpeechTranscriptionService transcriptionService,
                                      DreamPromptEngineer promptEngineer,
                                      SoraVideoService videoService) {
        this.transcriptionService = Objects.requireNonNull(transcriptionService, "transcriptionService must not be null");
        this.promptEngineer = Objects.requireNonNull(promptEngineer, "promptEngineer must not be null");
        this.videoService = Objects.requireNonNull(videoService, "videoService must not be null");
        this.skipVideoGeneration = Boolean.parseBoolean(
            Optional.ofNullable(System.getenv("SKIP_VIDEO_GENERATION")).orElse("false")
        );
    }

    public DreamVisualizationOutcome run(SpeechTranscriptionRequest transcriptionRequest,
                                         VideoGenerationOptions videoOptions) {
        Objects.requireNonNull(transcriptionRequest, "transcriptionRequest must not be null");
        Objects.requireNonNull(videoOptions, "videoOptions must not be null");

        SpeechTranscript transcript = transcriptionService.transcribe(transcriptionRequest);
        return runWithTranscript(transcript, videoOptions);
    }

    public DreamVisualizationOutcome run(SpeechTranscriptionRequest transcriptionRequest,
                                         VideoGenerationOptions videoOptions,
                                         Optional<Path> breatheImage) {
        Objects.requireNonNull(transcriptionRequest, "transcriptionRequest must not be null");
        Objects.requireNonNull(videoOptions, "videoOptions must not be null");

        SpeechTranscript transcript = transcriptionService.transcribe(transcriptionRequest);
        return runWithTranscript(transcript, videoOptions, breatheImage);
    }

    public DreamVisualizationOutcome runWithTranscript(SpeechTranscript transcript,
                                                       VideoGenerationOptions videoOptions) {
        Objects.requireNonNull(transcript, "transcript must not be null");
        Objects.requireNonNull(videoOptions, "videoOptions must not be null");

        DreamPromptResult engineeredPrompt = promptEngineer.engineerPrompt(transcript.fullText());
        
        SoraVideoJob videoJob;
        if (skipVideoGeneration) {
            // Create a placeholder job when video generation is skipped
            videoJob = new SoraVideoJob(
                "skipped-" + System.currentTimeMillis(),
                "skipped",
                Instant.now(),
                Optional.empty()
            );
        } else {
            videoJob = videoService.generateVideo(engineeredPrompt, videoOptions);
        }

        return new DreamVisualizationOutcome(transcript, engineeredPrompt, videoJob);
    }

    public DreamVisualizationOutcome runWithTranscript(SpeechTranscript transcript,
                                                       VideoGenerationOptions videoOptions,
                                                       Optional<Path> breatheImage) {
        Objects.requireNonNull(transcript, "transcript must not be null");
        Objects.requireNonNull(videoOptions, "videoOptions must not be null");

        DreamPromptResult engineeredPrompt = breatheImage != null && breatheImage.isPresent()
            ? promptEngineer.engineerPrompt(transcript.fullText(), breatheImage.get())
            : promptEngineer.engineerPrompt(transcript.fullText());
        
        SoraVideoJob videoJob;
        if (skipVideoGeneration) {
            videoJob = new SoraVideoJob(
                "skipped-" + System.currentTimeMillis(),
                "skipped",
                Instant.now(),
                Optional.empty()
            );
        } else {
            videoJob = videoService.generateVideo(engineeredPrompt, videoOptions);
        }

        return new DreamVisualizationOutcome(transcript, engineeredPrompt, videoJob);
    }
}
