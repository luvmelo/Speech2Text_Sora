package com.dreamvisualizer.orchestrator;

import com.dreamvisualizer.prompt.DreamPromptResult;
import com.dreamvisualizer.speech.SpeechTranscript;
import com.dreamvisualizer.video.SoraVideoJob;

/**
 * Aggregates the outputs from the three pipeline layers.
 */
public record DreamVisualizationOutcome(SpeechTranscript transcript,
                                        DreamPromptResult engineeredPrompt,
                                        SoraVideoJob videoJob) {
}
