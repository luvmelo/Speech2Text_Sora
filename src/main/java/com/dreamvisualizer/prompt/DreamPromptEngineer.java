package com.dreamvisualizer.prompt;

import com.dreamvisualizer.config.OpenAIConfig;
import com.dreamvisualizer.http.OpenAIClient;
import com.dreamvisualizer.http.OpenAIException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;

/**
 * Layer 2: turns a raw transcription into a structured prompt for Sora.
 */
public class DreamPromptEngineer {

    private final OpenAIConfig config;
    private final OpenAIClient client;

    public DreamPromptEngineer(OpenAIConfig config, OpenAIClient client) {
        this.config = Objects.requireNonNull(config, "config must not be null");
        this.client = Objects.requireNonNull(client, "client must not be null");
    }

    public DreamPromptResult engineerPrompt(String dreamNarrative) {
        Objects.requireNonNull(dreamNarrative, "dreamNarrative must not be null");
        ObjectMapper mapper = client.mapper();

        ObjectNode payload = mapper.createObjectNode();
        payload.put("model", config.getTextModel());

        ArrayNode input = payload.putArray("input");

        ObjectNode systemMessage = input.addObject();
        systemMessage.put("role", "system");
        ArrayNode systemContent = systemMessage.putArray("content");
        systemContent.addObject()
                .put("type", "input_text")
                .put("text", PromptEngineeringConfig.DEFAULT_SYSTEM_PROMPT);

        ObjectNode userMessage = input.addObject();
        userMessage.put("role", "user");
        ArrayNode userContent = userMessage.putArray("content");
        userContent.addObject()
                .put("type", "input_text")
                .put("text", buildUserInstruction(dreamNarrative));

        ObjectNode textNode = payload.putObject("text");
        textNode.set("format", PromptEngineeringConfig.defaultResponseFormat(mapper));

        JsonNode response = client.postJson("responses", payload);
        String jsonPayload = extractJsonOutput(response);

        try {
            JsonNode structured = mapper.readTree(jsonPayload);
            return mapToResult(structured);
        } catch (Exception e) {
            throw new OpenAIException("Failed to parse structured JSON from GPT response: " + jsonPayload, e);
        }
    }

    public DreamPromptResult engineerPrompt(String dreamNarrative, Path breatheImagePath) {
        Objects.requireNonNull(dreamNarrative, "dreamNarrative must not be null");
        Objects.requireNonNull(breatheImagePath, "breatheImagePath must not be null");
        ObjectMapper mapper = client.mapper();

        ObjectNode payload = mapper.createObjectNode();
        payload.put("model", config.getTextModel());

        ArrayNode input = payload.putArray("input");

        ObjectNode systemMessage = input.addObject();
        systemMessage.put("role", "system");
        ArrayNode systemContent = systemMessage.putArray("content");
        systemContent.addObject()
                .put("type", "input_text")
                .put("text", PromptEngineeringConfig.DEFAULT_SYSTEM_PROMPT +
                        "\nYou may also receive an image of a user's night breathing chart. Analyze breathing tempo, rhythm regularity, anomalies, and inferred mood/arousal. Use these to tune cinematography, pacing, motion intensity, camera movement, and music/sound descriptors in the final prompt. Keep safety and uncertainty in mind; if ambiguous, describe gently.");

        ObjectNode userMessage = input.addObject();
        userMessage.put("role", "user");
        ArrayNode userContent = userMessage.putArray("content");
        userContent.addObject()
                .put("type", "input_text")
                .put("text", buildUserInstructionWithBreathe(dreamNarrative));

        // Add image as base64 data URL per Responses multimodal input spec
        try {
            byte[] bytes = Files.readAllBytes(breatheImagePath);
            String base64 = Base64.getEncoder().encodeToString(bytes);
            ObjectNode imageNode = userContent.addObject();
            imageNode.put("type", "input_image");
            imageNode.put("image_url", "data:image/png;base64," + base64);
        } catch (Exception e) {
            throw new OpenAIException("Failed to read breathe image file", e);
        }

        ObjectNode textNode = payload.putObject("text");
        textNode.set("format", PromptEngineeringConfig.defaultResponseFormat(mapper));

        JsonNode response = client.postJson("responses", payload);
        String jsonPayload = extractJsonOutput(response);

        try {
            JsonNode structured = mapper.readTree(jsonPayload);
            return mapToResult(structured);
        } catch (Exception e) {
            throw new OpenAIException("Failed to parse structured JSON from GPT response: " + jsonPayload, e);
        }
    }

    private String buildUserInstruction(String narrative) {
        return """
                USER DREAM NARRATIVE:
                """ + narrative.trim() + """

                ----
                Instructions:
                1. Extract the underlying story arc, even if fragmented.
                2. Identify concrete symbols, locations, or motifs. Retain surreal transitions or emotional pivots.
                3. Craft a concise sora_prompt grounded in those beats, emphasising hazy dream cinematography.
                4. Populate all JSON fields; use "none" only when the user explicitly states the absence of detail.
                """;
    }

    private String buildUserInstructionWithBreathe(String narrative) {
        return """
                USER DREAM NARRATIVE:
                """ + narrative.trim() + """

                ----
                Additional context:
                - Attached image: user's night breathing chart. Analyze for tempo (bpm), variability, regularity, and notable patterns (e.g., apnea-like pauses, spikes). Summarize as short phrases.
                
                Instructions:
                1. Extract the underlying story arc, even if fragmented.
                2. Identify concrete symbols, locations, or motifs. Retain surreal transitions or emotional pivots.
                3. Craft a concise sora_prompt grounded in those beats, emphasising hazy dream cinematography.
                4. Incorporate breathing analysis to modulate style variables. Examples:
                   - Rapid/irregular breathing → handheld camera, jittery cuts, kinetic motion, harsher textures.
                   - Slow/regular breathing → steady dolly, long takes, soft motion, calmer palette.
                   - Variable breathing → alternating pacing, shifting focal lengths.
                5. Populate all JSON fields; use "none" only when the user explicitly states the absence of detail.
                """;
    }

    private String extractJsonOutput(JsonNode response) {
        JsonNode output = response.path("output");
        if (!output.isArray()) {
            throw new OpenAIException("Unexpected response payload: missing output array");
        }
        for (JsonNode item : output) {
            JsonNode content = item.path("content");
            if (content.isArray()) {
                for (JsonNode block : content) {
                    if ("output_text".equals(block.path("type").asText())) {
                        String text = block.path("text").asText();
                        if (text != null && !text.isBlank()) {
                            return text.trim();
                        }
                    }
                }
            }
        }
        throw new OpenAIException("No JSON text found in responses output");
    }

    private DreamPromptResult mapToResult(JsonNode node) {
        String soraPrompt = node.path("sora_prompt").asText("");
        List<String> beats = toStringList(node.path("narrative_beats"));
        List<String> visuals = toStringList(node.path("visual_keywords"));
        String emotionalTone = node.path("emotional_tone").asText("");
        String colorPalette = node.path("color_palette").asText("");
        List<String> negatives = toStringList(node.path("negative_prompts"));
        String cameraStyle = node.path("camera_style").asText("");
        String motionStyle = node.path("motion_style").asText("");
        return new DreamPromptResult(soraPrompt, beats, visuals, emotionalTone, colorPalette, negatives, cameraStyle, motionStyle);
    }

    private List<String> toStringList(JsonNode node) {
        List<String> items = new ArrayList<>();
        if (node.isArray()) {
            for (JsonNode n : node) {
                String value = n.asText();
                if (value != null && !value.isBlank()) {
                    items.add(value.trim());
                }
            }
        }
        return items;
    }
}
