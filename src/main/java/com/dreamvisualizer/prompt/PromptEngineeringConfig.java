package com.dreamvisualizer.prompt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * Houses the system-level prompt and JSON schema that keeps the GPT layer deterministic.
 */
public final class PromptEngineeringConfig {

    private PromptEngineeringConfig() {
    }

    public static final String DEFAULT_SYSTEM_PROMPT = """
            You are the narrative dramaturg for DreamVisualizer, an internal tool that prepares prompts for the Sora 2 video model.
            The user provides a raw, spoken recollection of a dream. You must transform it into a cinematic yet abstract dreamscape brief.
            
            Goals:
            - Extract clear narrative beats while preserving ambiguity and surreal logic that belongs in a dream.
            - Select concrete visual anchors from the user's description so Sora has reliable guidance.
            - Emphasise hazy, soft-focus visuals, gentle grain, dissolved edges, volumetric light, and subtle camera drift reminiscent of conceptual dream visualisations.
            - Avoid over-specifying; leave room for interpretation yet ensure the core story arc is coherent.
            - If details are missing, infer plausible connective tissue while flagging them as interpretive.
            
            Requirements for sora_prompt:
            - Present tense, second-person or neutral narration.
            - Mention time of day, dominant color palette, sensory texture, and overall pacing.
            - Include 1-2 surreal motifs inspired by the user's recollection.
            - Explicitly request a soft, diffused render quality with slight motion blur and analog grain.
            
            Explicitly avoid:
            - Photorealistic or hyper-sharp callouts.
            - Direct mentions of filming gear or lenses.
            - Horror imagery unless the user explicitly requests it.
            """;

    /**
     * Creates the JSON schema used as response_format in the Responses API call.
     */
    public static ObjectNode defaultResponseFormat(ObjectMapper mapper) {
        ObjectNode format = mapper.createObjectNode();
        format.put("type", "json_schema");
        format.put("name", "dream_prompt");
        format.put("strict", true);

        ObjectNode schema = format.putObject("schema");
        schema.put("type", "object");
        ObjectNode properties = schema.putObject("properties");

        properties.putObject("sora_prompt")
                .put("type", "string")
                .put("description", "Final prompt to send into the Sora video generation API with dreamy, hazy visuals.");

        properties.putObject("narrative_beats")
                .put("type", "array")
                .put("description", "Chronological list of 3-6 short beats covering the dream's arc.")
                .putObject("items")
                .put("type", "string");

        properties.putObject("visual_keywords")
                .put("type", "array")
                .put("description", "Visual anchor keywords distilled from the dream.")
                .putObject("items")
                .put("type", "string");

        properties.putObject("emotional_tone")
                .put("type", "string")
                .put("description", "Short description of the emotional tenor.");

        properties.putObject("color_palette")
                .put("type", "string")
                .put("description", "Dominant color palette phrased as atmospheric guidance.");

        properties.putObject("negative_prompts")
                .put("type", "array")
                .put("description", "Elements Sora should avoid when rendering.")
                .putObject("items")
                .put("type", "string");

        properties.putObject("camera_style")
                .put("type", "string")
                .put("description", "Guidance for camera motion and compositional logic.");

        properties.putObject("motion_style")
                .put("type", "string")
                .put("description", "Overall pacing and motion description.");

        ArrayNode required = schema.putArray("required");
        required.add("sora_prompt");
        required.add("narrative_beats");
        required.add("visual_keywords");
        required.add("emotional_tone");
        required.add("color_palette");
        required.add("negative_prompts");
        required.add("camera_style");
        required.add("motion_style");

        schema.put("additionalProperties", false);
        return format;
    }
}
