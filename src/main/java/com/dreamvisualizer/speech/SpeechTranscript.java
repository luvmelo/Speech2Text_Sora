package com.dreamvisualizer.speech;

import java.time.Instant;
import java.util.List;

/**
 * Domain-level representation of a transcription.
 */
public record SpeechTranscript(String fullText,
                               List<Utterance> utterances,
                               Instant generatedAt) {

    public record Utterance(double startSeconds, double endSeconds, String text) {
    }
}
