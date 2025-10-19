package com.dreamvisualizer.speech;

import com.dreamvisualizer.config.OpenAIConfig;
import com.dreamvisualizer.http.OpenAIClient;
import com.fasterxml.jackson.databind.JsonNode;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Layer 1: Converts spoken narration into text suitable for further prompt engineering.
 */
public class SpeechTranscriptionService {

    private final OpenAIConfig config;
    private final OpenAIClient client;

    public SpeechTranscriptionService(OpenAIConfig config, OpenAIClient client) {
        this.config = Objects.requireNonNull(config, "config must not be null");
        this.client = Objects.requireNonNull(client, "client must not be null");
    }

    public SpeechTranscript transcribe(SpeechTranscriptionRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        Path audioPath = request.audioPath();
        if (!Files.isReadable(audioPath)) {
            throw new IllegalArgumentException("Audio file is not readable: " + audioPath);
        }

        MultipartBody.Builder builder = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("model", config.getSpeechModel())
                .addFormDataPart(
                        "file",
                        audioPath.getFileName().toString(),
                        RequestBody.create(
                                audioPath.toFile(),
                                MediaType.parse("application/octet-stream")));

        request.language().ifPresent(language -> builder.addFormDataPart("language", language));
        request.temperature().ifPresent(temp -> builder.addFormDataPart("temperature", Double.toString(temp)));

        JsonNode response = client.postMultipart("audio/transcriptions", builder.build());
        String text = response.path("text").asText("");
        List<SpeechTranscript.Utterance> utterances = parseUtterances(response);
        Instant generatedAt = parseCreated(response);

        return new SpeechTranscript(text, utterances, generatedAt);
    }

    private List<SpeechTranscript.Utterance> parseUtterances(JsonNode response) {
        List<SpeechTranscript.Utterance> utterances = new ArrayList<>();
        JsonNode segmentsNode = response.path("segments");
        if (segmentsNode.isArray()) {
            for (JsonNode segment : segmentsNode) {
                double start = segment.path("start").asDouble(0.0);
                double end = segment.path("end").asDouble(0.0);
                String text = segment.path("text").asText("");
                utterances.add(new SpeechTranscript.Utterance(start, end, text));
            }
        }
        return utterances;
    }

    private Instant parseCreated(JsonNode response) {
        long created = response.path("created").asLong(Instant.now().getEpochSecond());
        return Instant.ofEpochSecond(created);
    }
}
