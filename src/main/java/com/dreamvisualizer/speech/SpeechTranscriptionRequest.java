package com.dreamvisualizer.speech;

import java.nio.file.Path;
import java.util.Optional;

/**
 * Options for the speech transcription layer.
 */
public class SpeechTranscriptionRequest {

    private final Path audioPath;
    private final String language;
    private final Double temperature;

    private SpeechTranscriptionRequest(Builder builder) {
        this.audioPath = builder.audioPath;
        this.language = builder.language;
        this.temperature = builder.temperature;
    }

    public Path audioPath() {
        return audioPath;
    }

    public Optional<String> language() {
        return Optional.ofNullable(language);
    }

    public Optional<Double> temperature() {
        return Optional.ofNullable(temperature);
    }

    public static Builder builder(Path audioPath) {
        return new Builder(audioPath);
    }

    public static class Builder {
        private final Path audioPath;
        private String language;
        private Double temperature;

        private Builder(Path audioPath) {
            this.audioPath = audioPath;
        }

        public Builder language(String language) {
            this.language = language;
            return this;
        }

        public Builder temperature(Double temperature) {
            this.temperature = temperature;
            return this;
        }

        public SpeechTranscriptionRequest build() {
            return new SpeechTranscriptionRequest(this);
        }
    }
}
