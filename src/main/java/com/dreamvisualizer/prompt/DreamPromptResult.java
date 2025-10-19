package com.dreamvisualizer.prompt;

import java.util.List;

public record DreamPromptResult(
        String soraPrompt,
        List<String> narrativeBeats,
        List<String> visualKeywords,
        String emotionalTone,
        String colorPalette,
        List<String> negativePrompts,
        String cameraStyle,
        String motionStyle
) {
}
