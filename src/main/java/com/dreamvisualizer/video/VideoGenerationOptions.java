package com.dreamvisualizer.video;

import java.util.Optional;

/**
 * Optional knobs when requesting a Sora video generation.
 */
public class VideoGenerationOptions {

    private final Integer durationSeconds;
    private final String aspectRatio;
    private final Integer seed;
    private final String format;

    private VideoGenerationOptions(Builder builder) {
        this.durationSeconds = builder.durationSeconds;
        this.aspectRatio = builder.aspectRatio;
        this.seed = builder.seed;
        this.format = builder.format;
    }

    public Optional<Integer> durationSeconds() {
        return Optional.ofNullable(durationSeconds);
    }

    public Optional<String> aspectRatio() {
        return Optional.ofNullable(aspectRatio);
    }

    public Optional<Integer> seed() {
        return Optional.ofNullable(seed);
    }

    public Optional<String> format() {
        return Optional.ofNullable(format);
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Integer durationSeconds;
        private String aspectRatio;
        private Integer seed;
        private String format;

        public Builder durationSeconds(Integer durationSeconds) {
            this.durationSeconds = durationSeconds;
            return this;
        }

        public Builder aspectRatio(String aspectRatio) {
            this.aspectRatio = aspectRatio;
            return this;
        }

        public Builder seed(Integer seed) {
            this.seed = seed;
            return this;
        }

        public Builder format(String format) {
            this.format = format;
            return this;
        }

        public VideoGenerationOptions build() {
            return new VideoGenerationOptions(this);
        }
    }
}
