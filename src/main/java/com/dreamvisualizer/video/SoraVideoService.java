package com.dreamvisualizer.video;

import com.dreamvisualizer.config.OpenAIConfig;
import com.dreamvisualizer.http.OpenAIClient;
import com.dreamvisualizer.http.OpenAIException;
import com.dreamvisualizer.prompt.DreamPromptResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import okhttp3.HttpUrl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * Layer 3: submits the engineered prompt to the OpenAI Sora video API.
 */
public class SoraVideoService {

    private static final Logger LOGGER = LoggerFactory.getLogger(SoraVideoService.class);

    private final OpenAIConfig config;
    private final OpenAIClient client;
    private final Path outputDirectory;

    public SoraVideoService(OpenAIConfig config, OpenAIClient client, Path outputDirectory) {
        this.config = Objects.requireNonNull(config, "config must not be null");
        this.client = Objects.requireNonNull(client, "client must not be null");
        this.outputDirectory = Objects.requireNonNull(outputDirectory, "outputDirectory must not be null");
        try {
            Files.createDirectories(outputDirectory);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to create video output directory " + outputDirectory, e);
        }
    }

    public SoraVideoJob generateVideo(DreamPromptResult promptResult, VideoGenerationOptions options) {
        Objects.requireNonNull(promptResult, "promptResult must not be null");
        Objects.requireNonNull(options, "options must not be null");

        ObjectMapper mapper = client.mapper();
        ObjectNode payload = mapper.createObjectNode();
        payload.put("model", config.getVideoModel());
        payload.put("prompt", buildVideoPrompt(promptResult, options));

        LOGGER.info("Submitting video generation to Sora with model {}", config.getVideoModel());
        JsonNode initialResponse = client.postJson("videos", payload);
        String videoId = initialResponse.path("id").asText(null);
        if (videoId == null || videoId.isBlank()) {
            throw new IllegalStateException("Sora video generation response missing id");
        }

        LOGGER.info("Sora video {} accepted with initial status {}", videoId, initialResponse.path("status").asText("unknown"));
        JsonNode finalState = waitForCompletion(videoId, initialResponse);

        Optional<JsonNode> outputDescriptor = extractVideoOutput(finalState);
        String terminalStatus = finalState.path("status").asText("");
        if (outputDescriptor.isEmpty() && "completed".equalsIgnoreCase(terminalStatus)) {
            outputDescriptor = fetchVideoOutput(videoId);
        }

        SoraVideoJob baseJob = mapToJob(videoId, finalState, outputDescriptor);

        Optional<String> localUrl = Optional.empty();
        if ("completed".equalsIgnoreCase(baseJob.status())) {
            if (outputDescriptor.isPresent()) {
                localUrl = downloadFromOutputDescriptor(videoId, outputDescriptor.get(), options);
            }
            if (localUrl.isEmpty()) {
                localUrl = downloadViaContentEndpoint(videoId, options);
            }
        }

        Optional<String> remoteUrl = outputDescriptor.flatMap(this::extractDownloadUrl);
        Optional<String> effectiveUrl = localUrl.isPresent() ? localUrl : remoteUrl;
        if ("completed".equalsIgnoreCase(baseJob.status()) && effectiveUrl.isEmpty()) {
            LOGGER.warn("Sora video {} completed without an accessible download URL", videoId);
            LOGGER.warn("Final Sora payload for {}: {}", videoId, finalState.toPrettyString());
        }
        return new SoraVideoJob(baseJob.jobId(), baseJob.status(), baseJob.createdAt(), effectiveUrl);
    }

    private String buildVideoPrompt(DreamPromptResult prompt, VideoGenerationOptions options) {
        StringBuilder builder = new StringBuilder();
        builder.append(prompt.soraPrompt().trim());

        if (!prompt.narrativeBeats().isEmpty()) {
            builder.append("\n\nKey beats:\n");
            prompt.narrativeBeats().forEach(beat -> builder.append("- ").append(beat).append('\n'));
        }

        if (!prompt.visualKeywords().isEmpty()) {
            builder.append("\nVisual anchors: ");
            builder.append(String.join(", ", prompt.visualKeywords()));
            builder.append('\n');
        }

        if (!prompt.negativePrompts().isEmpty()) {
            builder.append("\nAvoid: ");
            builder.append(String.join(", ", prompt.negativePrompts()));
            builder.append('\n');
        }

        if (prompt.emotionalTone() != null && !prompt.emotionalTone().isBlank()) {
            builder.append("\nEmotional tone: ").append(prompt.emotionalTone()).append('\n');
        }
        if (prompt.colorPalette() != null && !prompt.colorPalette().isBlank()) {
            builder.append("Palette: ").append(prompt.colorPalette()).append('\n');
        }
        if (prompt.cameraStyle() != null && !prompt.cameraStyle().isBlank()) {
            builder.append("Camera style: ").append(prompt.cameraStyle()).append('\n');
        }
        if (prompt.motionStyle() != null && !prompt.motionStyle().isBlank()) {
            builder.append("Motion style: ").append(prompt.motionStyle()).append('\n');
        }

        options.durationSeconds().ifPresent(seconds -> builder.append("\nTarget duration: ").append(seconds).append(" seconds\n"));
        options.aspectRatio().ifPresent(ratio -> builder.append("Aspect ratio: ").append(ratio).append('\n'));

        return builder.toString();
    }

    private JsonNode waitForCompletion(String videoId, JsonNode initialState) {
        JsonNode current = initialState;
        String status = current.path("status").asText("");
        int attempts = 0;
        final int maxAttempts = 48; // approx 8 minutes @ 10s interval
        final long delayMillis = 10_000L;

        while (!isTerminalStatus(status) && attempts < maxAttempts) {
            try {
                Thread.sleep(delayMillis);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("Video polling interrupted", e);
            }
            current = client.getJson("videos/" + videoId);
            String nextStatus = current.path("status").asText(status);
            if (!nextStatus.equalsIgnoreCase(status)) {
                LOGGER.info("Sora video {} status → {}", videoId, nextStatus);
            }
            status = nextStatus;
            attempts++;
        }
        if (!isTerminalStatus(status)) {
            LOGGER.warn("Sora video {} polling exhausted after {} attempts; last status {}", videoId, attempts, status);
        } else {
            LOGGER.info("Sora video {} reached terminal status {}", videoId, status);
        }
        return current;
    }

    private boolean isTerminalStatus(String status) {
        if (status == null) {
            return false;
        }
        return switch (status.toLowerCase()) {
            case "completed", "failed", "cancelled" -> true;
            default -> false;
        };
    }

    private SoraVideoJob mapToJob(String videoId, JsonNode video, Optional<JsonNode> asset) {
        String status = video.path("status").asText("processing");
        Instant createdAt = extractCreationInstant(video).orElseGet(Instant::now);
        Optional<String> downloadUrl = asset.flatMap(this::extractDownloadUrl);
        return new SoraVideoJob(videoId, status, createdAt, downloadUrl);
    }

    private Optional<String> downloadFromOutputDescriptor(String videoId, JsonNode descriptor, VideoGenerationOptions options) {
        JsonNode descriptorNode = descriptor;
        Optional<String> download = extractDownloadUrl(descriptorNode);
        String fileId = descriptorNode.path("file_id").asText(null);
        String assetId = descriptorNode.path("asset_id").asText(null);

        Path outputPath = outputDirectory.resolve(sanitiseForFilename(videoId) + "." + determineExtension(descriptorNode, options));

        try {
            if (fileId != null && !fileId.isBlank()) {
                downloadFileContent(fileId, outputPath);
                LOGGER.info("Saved Sora video {} from file {} to {}", videoId, fileId, outputPath);
                return Optional.of("/videos/" + outputPath.getFileName());
            }
            if (assetId != null && !assetId.isBlank()) {
                downloadAssetContent(assetId, outputPath);
                LOGGER.info("Saved Sora video {} from asset {} to {}", videoId, assetId, outputPath);
                return Optional.of("/videos/" + outputPath.getFileName());
            }
            if (download.isPresent()) {
                client.downloadToFile(download.get(), outputPath);
                LOGGER.info("Saved Sora video {} from direct URL to {}", videoId, outputPath);
                return Optional.of("/videos/" + outputPath.getFileName());
            }
        } catch (OpenAIException e) {
            LOGGER.warn("Failed to download Sora video {} from descriptor: {}", videoId, e.getMessage());
            return Optional.empty();
        }

        LOGGER.debug("Output descriptor for {} lacked file_id/asset_id and direct URL", videoId);
        return Optional.empty();
    }

    private Optional<String> downloadViaContentEndpoint(String videoId, VideoGenerationOptions options) {
        Path outputPath = outputDirectory.resolve(sanitiseForFilename(videoId) + "." + extensionFromOptions(options));
        try {
            downloadVideoContent(videoId, outputPath);
            LOGGER.info("Saved Sora video {} via content endpoint to {}", videoId, outputPath);
            return Optional.of("/videos/" + outputPath.getFileName());
        } catch (OpenAIException e) {
            LOGGER.warn("Failed to download Sora video {} via content endpoint: {}", videoId, e.getMessage());
            return Optional.empty();
        }
    }

    private Optional<JsonNode> extractVideoOutput(JsonNode video) {
        JsonNode output = video.path("output");
        if (output.isArray()) {
            for (JsonNode item : output) {
                if ("video".equalsIgnoreCase(item.path("type").asText(""))) {
                    return Optional.of(item);
                }
            }
            if (output.size() > 0) {
                return Optional.of(output.get(0));
            }
        } else if (output.isObject()) {
            return Optional.of(output);
        }
        LOGGER.debug("No video output present for {}", video.path("id").asText("unknown"));
        return Optional.empty();
    }

    private Optional<JsonNode> fetchVideoOutput(String videoId) {
        try {
            JsonNode response = client.getJson("videos/" + videoId);
            Optional<JsonNode> output = extractVideoOutput(response);
            if (output.isPresent()) {
                LOGGER.info("Retrieved video output metadata for {}", videoId);
                return output;
            }
            response = client.getJson("videos/" + videoId, Map.of("include", "output"));
            output = extractVideoOutput(response);
            output.ifPresent(o -> LOGGER.info("Retrieved video output with include=output for {}", videoId));
            return output;
        } catch (OpenAIException e) {
            LOGGER.warn("Failed to retrieve Sora video output for {}: {}", videoId, e.getMessage());
            return Optional.empty();
        }
    }

    private void downloadAssetContent(String assetId, Path destination) {
        HttpUrl url = config.getBaseUrl().newBuilder()
                .addPathSegment("assets")
                .addPathSegment(assetId)
                .addPathSegment("content")
                .build();
        client.downloadToFile(url.toString(), destination);
    }

    private void downloadFileContent(String fileId, Path destination) {
        HttpUrl url = config.getBaseUrl().newBuilder()
                .addPathSegment("files")
                .addPathSegment(fileId)
                .addPathSegment("content")
                .build();
        client.downloadToFile(url.toString(), destination);
    }

    private void downloadVideoContent(String videoId, Path destination) {
        HttpUrl url = config.getBaseUrl().newBuilder()
                .addPathSegment("videos")
                .addPathSegment(videoId)
                .addPathSegment("content")
                .build();
        client.downloadToFile(url.toString(), destination);
    }

    private Optional<String> extractDownloadUrl(JsonNode asset) {
        String[] directFields = {"download_url", "url", "content_url", "uri"};
        for (String field : directFields) {
            String value = asset.path(field).asText(null);
            if (value != null && !value.isBlank()) {
                return Optional.of(value);
            }
        }
        if (asset.hasNonNull("file")) {
            Optional<String> nested = extractDownloadUrl(asset.path("file"));
            if (nested.isPresent()) {
                return nested;
            }
        }
        JsonNode data = asset.path("data");
        if (data.isArray()) {
            for (JsonNode entry : data) {
                Optional<String> nested = extractDownloadUrl(entry);
                if (nested.isPresent()) {
                    return nested;
                }
            }
        }
        JsonNode sources = asset.path("sources");
        if (sources.isArray()) {
            for (JsonNode entry : sources) {
                Optional<String> nested = extractDownloadUrl(entry);
                if (nested.isPresent()) {
                    return nested;
                }
            }
        } else if (sources.isObject()) {
            Optional<String> nested = extractDownloadUrl(sources);
            if (nested.isPresent()) {
                return nested;
            }
        }
        JsonNode formats = asset.path("formats");
        if (formats.isArray()) {
            for (JsonNode entry : formats) {
                Optional<String> nested = extractDownloadUrl(entry);
                if (nested.isPresent()) {
                    return nested;
                }
            }
        }
        JsonNode media = asset.path("media");
        if (media.isArray()) {
            for (JsonNode entry : media) {
                Optional<String> nested = extractDownloadUrl(entry);
                if (nested.isPresent()) {
                    return nested;
                }
            }
        } else if (media.isObject()) {
            Optional<String> nested = extractDownloadUrl(media);
            if (nested.isPresent()) {
                return nested;
            }
        }
        return Optional.empty();
    }

    private String determineExtension(JsonNode asset, VideoGenerationOptions options) {
        String format = options.format().orElse(null);
        if (format == null || format.isBlank()) {
            format = asset.path("format").asText(null);
        }
        if ((format == null || format.isBlank()) && asset.hasNonNull("content_type")) {
            String mime = asset.path("content_type").asText();
            if (mime != null && mime.startsWith("video/")) {
                format = mime.substring("video/".length());
            }
        }
        if ((format == null || format.isBlank()) && asset.hasNonNull("mime_type")) {
            String mime = asset.path("mime_type").asText();
            if (mime != null && mime.startsWith("video/")) {
                format = mime.substring("video/".length());
            }
        }
        if (format == null || format.isBlank()) {
            String url = asset.path("download_url").asText(null);
            if (url != null && url.contains(".")) {
                String candidate = url.substring(url.lastIndexOf('.') + 1);
                int queryIdx = candidate.indexOf('?');
                if (queryIdx >= 0) {
                    candidate = candidate.substring(0, queryIdx);
                }
                if (!candidate.isBlank()) {
                    format = candidate;
                }
            }
        }
        if ((format == null || format.isBlank()) && asset.hasNonNull("file_extension")) {
            format = asset.path("file_extension").asText();
        }
        if (format == null || format.isBlank()) {
            String filename = asset.path("filename").asText(null);
            if (filename == null || filename.isBlank()) {
                filename = asset.path("name").asText(null);
            }
            if (filename != null && filename.contains(".")) {
                String candidate = filename.substring(filename.lastIndexOf('.') + 1);
                if (!candidate.isBlank()) {
                    format = candidate;
                }
            }
        }
        if (format == null || format.isBlank()) {
            format = "mp4";
        }
        if (format.startsWith("video/")) {
            format = format.substring("video/".length());
        }
        return format;
    }

    private String extensionFromOptions(VideoGenerationOptions options) {
        String format = options.format().orElse("mp4");
        if (format == null || format.isBlank()) {
            format = "mp4";
        }
        if (format.startsWith("video/")) {
            format = format.substring("video/".length());
        }
        if (format.startsWith(".")) {
            format = format.substring(1);
        }
        return format;
    }

    private Optional<Instant> extractCreationInstant(JsonNode video) {
        Instant createdAt = parseInstant(video.path("created_at"));
        if (createdAt != null) {
            return Optional.of(createdAt);
        }
        Instant queuedAt = parseInstant(video.path("queued_at"));
        if (queuedAt != null) {
            return Optional.of(queuedAt);
        }
        Instant startedAt = parseInstant(video.path("started_at"));
        if (startedAt != null) {
            return Optional.of(startedAt);
        }
        return Optional.empty();
    }

    private Instant parseInstant(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        if (node.isNumber()) {
            long value = node.asLong();
            if (String.valueOf(Math.abs(value)).length() > 11) {
                return Instant.ofEpochMilli(value);
            }
            return Instant.ofEpochSecond(value);
        }
        String value = node.asText(null);
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(value);
        } catch (DateTimeParseException ignored) {
            try {
                return OffsetDateTime.parse(value).toInstant();
            } catch (DateTimeParseException e) {
                return null;
            }
        }
    }

    private String sanitiseForFilename(String value) {
        return value.replaceAll("[^a-zA-Z0-9-_\\.]", "_");
    }
}
