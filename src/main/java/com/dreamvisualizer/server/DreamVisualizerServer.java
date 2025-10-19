package com.dreamvisualizer.server;

import com.dreamvisualizer.config.OpenAIConfig;
import com.dreamvisualizer.http.OpenAIClient;
import com.dreamvisualizer.http.OpenAIException;
import com.dreamvisualizer.orchestrator.DreamVisualizationOutcome;
import com.dreamvisualizer.orchestrator.DreamVisualizationPipeline;
import com.dreamvisualizer.prompt.DreamPromptEngineer;
import com.dreamvisualizer.prompt.DreamPromptResult;
import com.dreamvisualizer.speech.SpeechTranscriptionRequest;
import com.dreamvisualizer.speech.SpeechTranscriptionService;
import com.dreamvisualizer.speech.SpeechTranscript;
import com.dreamvisualizer.video.SoraVideoJob;
import com.dreamvisualizer.video.SoraVideoService;
import com.dreamvisualizer.video.VideoGenerationOptions;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.http.UploadedFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Lightweight HTTP server exposing the dream visualisation pipeline for browser clients.
 */
public final class DreamVisualizerServer {

    private static final Logger LOGGER = LoggerFactory.getLogger(DreamVisualizerServer.class);

    private DreamVisualizerServer() {
    }

    public static void main(String[] args) {
        OpenAIConfig openAIConfig = OpenAIConfig.fromEnvironment();
        OpenAIClient openAIClient = new OpenAIClient(openAIConfig);
        SpeechTranscriptionService transcriptionService = new SpeechTranscriptionService(openAIConfig, openAIClient);
        DreamPromptEngineer promptEngineer = new DreamPromptEngineer(openAIConfig, openAIClient);
        Path videoOutputDir = Path.of(Optional.ofNullable(System.getenv("DREAM_VIDEO_DIR")).orElse("generated-videos"));
        SoraVideoService videoService = new SoraVideoService(openAIConfig, openAIClient, videoOutputDir);
        DreamVisualizationPipeline pipeline = new DreamVisualizationPipeline(
                transcriptionService,
                promptEngineer,
                videoService
        );

        int port = Integer.parseInt(Optional.ofNullable(System.getenv("DREAM_SERVER_PORT")).orElse("8080"));

        Javalin app = Javalin.create(cfg -> {
            cfg.showJavalinBanner = false;
            cfg.http.defaultContentType = "application/json";
            cfg.plugins.enableCors(cors -> cors.add(it -> it.anyHost()));
        });

        ObjectMapper mapper = openAIClient.mapper();

        app.post("/dreams", ctx -> {
            Instant started = Instant.now();
            UploadedFile audioFile = ctx.uploadedFile("audio");
            if (audioFile == null) {
                ctx.status(400).json(mapper.createObjectNode()
                        .put("error", "audio file is required"));
                return;
            }

            String language = ctx.formParam("language");
            String transcriptOverride = ctx.formParam("transcript_override");
            VideoGenerationOptions.Builder videoOptions = VideoGenerationOptions.builder()
                    .aspectRatio("16:9")
                    .durationSeconds(5)
                    .format("mp4");

            Path tempFile = Files.createTempFile("dream-narration", determineSuffix(audioFile));
            try {
                persistUploadedFile(audioFile, tempFile);

                long fileSize = Files.size(tempFile);
                LOGGER.info("Received audio file: name='{}', contentType='{}', size={} bytes",
                        audioFile.filename(), audioFile.contentType(), fileSize);

                SpeechTranscriptionRequest.Builder transcriptionRequest = SpeechTranscriptionRequest.builder(tempFile);
                if (language != null && !language.isBlank()) {
                    transcriptionRequest.language(language);
                }

                DreamVisualizationOutcome outcome;
                if (transcriptOverride != null && !transcriptOverride.isBlank()) {
                    LOGGER.info("Using provided transcript override (length={} chars)", transcriptOverride.length());
                    SpeechTranscript transcript = buildTranscriptOverride(transcriptOverride);
                    outcome = pipeline.runWithTranscript(transcript, videoOptions.build());
                } else {
                    DreamVisualizationOutcome outcomeTemp = pipeline.run(transcriptionRequest.build(), videoOptions.build());
                    outcome = outcomeTemp;
                }
                ObjectNode response = mapOutcome(mapper, outcome, Duration.between(started, Instant.now()));

                ctx.json(response);
            } catch (OpenAIException e) {
                LOGGER.error("Pipeline execution failed", e);
                ctx.status(502).json(mapper.createObjectNode()
                        .put("error", "Pipeline execution failed")
                        .put("details", e.getMessage()));
            } catch (Exception e) {
                LOGGER.error("Unexpected server error", e);
                ctx.status(500).json(mapper.createObjectNode()
                        .put("error", "Unexpected server error")
                        .put("details", e.getMessage()));
            } finally {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (IOException ioException) {
                    LOGGER.warn("Failed to delete temp file {}", tempFile, ioException);
                }
            }
        });

        app.get("/health", ctx -> ctx.result("ok"));

        app.get("/videos/{filename}", ctx -> serveVideoFile(ctx.pathParam("filename"), videoOutputDir, ctx));

        app.post("/videos", ctx -> {
            JsonNode body;
            try {
                body = mapper.readTree(ctx.body());
            } catch (IOException e) {
                ctx.status(400).json(mapper.createObjectNode().put("error", "Invalid JSON payload"));
                return;
            }

            JsonNode promptNode = body.path("prompt");
            if (promptNode.isMissingNode()) {
                ctx.status(400).json(mapper.createObjectNode().put("error", "Missing prompt payload"));
                return;
            }

            try {
                DreamPromptResult prompt = parsePromptNode(mapper, promptNode);
                JsonNode optionsNode = body.path("options");
                int requestedDuration = optionsNode.path("duration_seconds").asInt(5);
                if (requestedDuration <= 0) {
                    requestedDuration = 5;
                }
                VideoGenerationOptions.Builder builder = VideoGenerationOptions.builder()
                        .durationSeconds(requestedDuration)
                        .aspectRatio(optionsNode.path("aspect_ratio").asText("16:9"))
                        .format(optionsNode.path("format").asText("mp4"));
                VideoGenerationOptions videoOptions = builder.build();

                SoraVideoJob job = videoService.generateVideo(prompt, videoOptions);
                ObjectNode response = mapper.createObjectNode();
                response.put("job_id", job.jobId());
                response.put("status", job.status());
                response.put("download_url", job.downloadUrl().orElse(null));
                ctx.json(response);
            } catch (Exception e) {
                LOGGER.error("Video generation failed", e);
                ctx.status(502).json(mapper.createObjectNode()
                        .put("error", "Video generation failed")
                        .put("details", e.getMessage()));
            }
        });

        app.start(port);
        LOGGER.info("DreamVisualizerServer listening on port {}", port);
    }

    private static void persistUploadedFile(UploadedFile uploadedFile, Path destination) throws IOException {
        try (InputStream in = uploadedFile.content();
             OutputStream out = Files.newOutputStream(destination)) {
            in.transferTo(out);
        }
    }

    private static String determineSuffix(UploadedFile uploadedFile) {
        String filename = Optional.ofNullable(uploadedFile.filename()).orElse("");
        if (filename.contains(".")) {
            return filename.substring(filename.lastIndexOf('.'));
        }
        String contentType = Optional.ofNullable(uploadedFile.contentType()).orElse("");
        if (contentType.contains("webm")) {
            return ".webm";
        }
        if (contentType.contains("mp4")) {
            return ".m4a";
        }
        if (contentType.contains("mp3")) {
            return ".mp3";
        }
        if (contentType.contains("wav")) {
            return ".wav";
        }
        if (contentType.contains("ogg")) {
            return ".ogg";
        }
        if (contentType.contains("flac")) {
            return ".flac";
        }
        return ".bin";
    }

    private static SpeechTranscript buildTranscriptOverride(String text) {
        double duration = Math.max(1.0, text.split("\\s+").length * 0.6);
        SpeechTranscript.Utterance utterance = new SpeechTranscript.Utterance(0.0, duration, text);
        return new SpeechTranscript(text, List.of(utterance), Instant.now());
    }

    private static ObjectNode mapOutcome(ObjectMapper mapper,
                                         DreamVisualizationOutcome outcome,
                                         Duration pipelineDuration) {
        ObjectNode root = mapper.createObjectNode();

        ObjectNode transcriptNode = root.putObject("transcript");
        transcriptNode.put("text", outcome.transcript().fullText());
        transcriptNode.put("generated_at", outcome.transcript().generatedAt().toString());
        ArrayNode segments = transcriptNode.putArray("segments");
        outcome.transcript().utterances().forEach(segment -> {
            ObjectNode node = segments.addObject();
            node.put("start", segment.startSeconds());
            node.put("end", segment.endSeconds());
            node.put("text", segment.text());
        });

        ObjectNode promptNode = root.putObject("prompt");
        promptNode.put("sora_prompt", outcome.engineeredPrompt().soraPrompt());
        appendArray(promptNode.putArray("narrative_beats"), outcome.engineeredPrompt().narrativeBeats());
        appendArray(promptNode.putArray("visual_keywords"), outcome.engineeredPrompt().visualKeywords());
        promptNode.put("emotional_tone", outcome.engineeredPrompt().emotionalTone());
        promptNode.put("color_palette", outcome.engineeredPrompt().colorPalette());
        appendArray(promptNode.putArray("negative_prompts"), outcome.engineeredPrompt().negativePrompts());
        promptNode.put("camera_style", outcome.engineeredPrompt().cameraStyle());
        promptNode.put("motion_style", outcome.engineeredPrompt().motionStyle());

        ObjectNode videoNode = root.putObject("video");
        videoNode.put("job_id", outcome.videoJob().jobId());
        videoNode.put("status", outcome.videoJob().status());
        outcome.videoJob().downloadUrl().ifPresent(url -> videoNode.put("download_url", url));

        root.put("elapsed_ms", pipelineDuration.toMillis());
        return root;
    }

    private static DreamPromptResult parsePromptNode(ObjectMapper mapper, JsonNode node) {
        String soraPrompt = node.path("sora_prompt").asText("");
        List<String> narrativeBeats = readArrayOfStrings(node.path("narrative_beats"));
        List<String> visualKeywords = readArrayOfStrings(node.path("visual_keywords"));
        String emotionalTone = node.path("emotional_tone").asText("");
        String colorPalette = node.path("color_palette").asText("");
        List<String> negativePrompts = readArrayOfStrings(node.path("negative_prompts"));
        String cameraStyle = node.path("camera_style").asText("");
        String motionStyle = node.path("motion_style").asText("");
        return new DreamPromptResult(soraPrompt, narrativeBeats, visualKeywords, emotionalTone, colorPalette, negativePrompts, cameraStyle, motionStyle);
    }

    private static List<String> readArrayOfStrings(JsonNode node) {
        if (!node.isArray()) {
            return List.of();
        }
        List<String> values = new ArrayList<>();
        node.forEach(item -> {
            String value = item.asText(null);
            if (value != null && !value.isBlank()) {
                values.add(value.trim());
            }
        });
        return values;
    }

    private static void serveVideoFile(String filename, Path videoDirectory, Context ctx) {
        if (filename.contains("..")) {
            ctx.status(400).result("Invalid filename");
            return;
        }
        Path resolved = videoDirectory.resolve(filename).normalize();
        if (!resolved.startsWith(videoDirectory)) {
            ctx.status(400).result("Invalid filename");
            return;
        }
        if (!Files.exists(resolved)) {
            ctx.status(404).result("Video not found");
            return;
        }
        try {
            String contentType = Files.probeContentType(resolved);
            if (contentType == null) {
                contentType = "video/mp4";
            }
            ctx.contentType(contentType);
            ctx.header("Cache-Control", "no-store");
            ctx.result(Files.newInputStream(resolved));
        } catch (IOException e) {
            LOGGER.error("Failed to stream video {}", resolved, e);
            ctx.status(500).result("Failed to stream video");
        }
    }

    private static void appendArray(ArrayNode node, List<String> values) {
        values.forEach(node::add);
    }
}
