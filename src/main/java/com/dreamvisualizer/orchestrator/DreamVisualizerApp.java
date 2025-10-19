package com.dreamvisualizer.orchestrator;

import com.dreamvisualizer.config.OpenAIConfig;
import com.dreamvisualizer.http.OpenAIClient;
import com.dreamvisualizer.prompt.DreamPromptEngineer;
import com.dreamvisualizer.speech.SpeechTranscriptionRequest;
import com.dreamvisualizer.speech.SpeechTranscriptionService;
import com.dreamvisualizer.video.SoraVideoService;
import com.dreamvisualizer.video.VideoGenerationOptions;

import java.nio.file.Path;

/**
 * Minimal CLI driver to demonstrate the three-layer dream visualisation workflow.
 */
public final class DreamVisualizerApp {

    private DreamVisualizerApp() {
    }

    public static void main(String[] args) {
        if (args.length == 0) {
            System.err.println("Usage: java -jar tts-sora.jar <path-to-audio> [optional-language-code]");
            System.exit(1);
        }

        Path audioPath = Path.of(args[0]);
        String language = args.length > 1 ? args[1] : null;

        OpenAIConfig openAIConfig = OpenAIConfig.fromEnvironment();
        OpenAIClient openAIClient = new OpenAIClient(openAIConfig);
        SpeechTranscriptionService transcriptionService = new SpeechTranscriptionService(openAIConfig, openAIClient);
        DreamPromptEngineer promptEngineer = new DreamPromptEngineer(openAIConfig, openAIClient);
        Path outputDir = Path.of(System.getProperty("dream.video.dir", "generated-videos"));
        SoraVideoService videoService = new SoraVideoService(openAIConfig, openAIClient, outputDir);

        DreamVisualizationPipeline pipeline = new DreamVisualizationPipeline(
                transcriptionService,
                promptEngineer,
                videoService
        );

        SpeechTranscriptionRequest.Builder transcriptionRequest = SpeechTranscriptionRequest.builder(audioPath);
        if (language != null && !language.isBlank()) {
            transcriptionRequest.language(language);
        }

        VideoGenerationOptions videoOptions = VideoGenerationOptions.builder()
                .aspectRatio("16:9")
                .durationSeconds(5)
                .format("mp4")
                .build();

        DreamVisualizationOutcome outcome = pipeline.run(transcriptionRequest.build(), videoOptions);

        System.out.println("Transcription:");
        System.out.println(outcome.transcript().fullText());
        System.out.println();

        System.out.println("Engineered Sora prompt:");
        System.out.println(outcome.engineeredPrompt().soraPrompt());
        System.out.println();

        System.out.println("Video job submitted: " + outcome.videoJob().jobId());
        System.out.println("Status: " + outcome.videoJob().status());
        outcome.videoJob().downloadUrl().ifPresent(url -> System.out.println("Download (when ready): " + url));
    }
}
