package com.dreamvisualizer.config;

import okhttp3.HttpUrl;

import java.time.Duration;
import java.util.Optional;

/**
 * Centralized configuration for OpenAI integration.
 */
public class OpenAIConfig {

    private static final String DEFAULT_BASE_URL = "https://api.openai.com/v1";
    private static final String DEFAULT_SPEECH_MODEL = "gpt-4o-transcribe";
    private static final String DEFAULT_TEXT_MODEL = "gpt-5-mini";
    private static final String DEFAULT_VIDEO_MODEL = "sora-2";

    private final String apiKey;
    private final HttpUrl baseUrl;
    private final String speechModel;
    private final String textModel;
    private final String videoModel;
    private final String project;
    private final Duration requestTimeout;

    private OpenAIConfig(Builder builder) {
        this.apiKey = builder.apiKey;
        this.baseUrl = builder.baseUrl;
        this.speechModel = builder.speechModel;
        this.textModel = builder.textModel;
        this.videoModel = builder.videoModel;
        this.project = builder.project;
        this.requestTimeout = builder.requestTimeout;
    }

    public static OpenAIConfig fromEnvironment() {
        Builder builder = new Builder();
        builder.apiKey = Optional.ofNullable(System.getenv("OPENAI_API_KEY"))
                .orElseThrow(() -> new IllegalStateException("OPENAI_API_KEY env var must be set"));
        builder.baseUrl = HttpUrl.parse(
                Optional.ofNullable(System.getenv("OPENAI_BASE_URL")).orElse(DEFAULT_BASE_URL));
        builder.speechModel = Optional.ofNullable(System.getenv("OPENAI_AUDIO_MODEL")).orElse(DEFAULT_SPEECH_MODEL);
        builder.textModel = Optional.ofNullable(System.getenv("OPENAI_TEXT_MODEL")).orElse(DEFAULT_TEXT_MODEL);
        builder.videoModel = Optional.ofNullable(System.getenv("OPENAI_VIDEO_MODEL")).orElse(DEFAULT_VIDEO_MODEL);
        builder.project = Optional.ofNullable(System.getenv("OPENAI_PROJECT")).orElse(null);
        builder.requestTimeout = Optional.ofNullable(System.getenv("OPENAI_REQUEST_TIMEOUT_SECONDS"))
                .map(Integer::parseInt)
                .map(Duration::ofSeconds)
                .orElse(Duration.ofSeconds(120));
        return builder.build();
    }

    public String getApiKey() {
        return apiKey;
    }

    public HttpUrl getBaseUrl() {
        return baseUrl;
    }

    public String getSpeechModel() {
        return speechModel;
    }

    public String getTextModel() {
        return textModel;
    }

    public String getVideoModel() {
        return videoModel;
    }

    public Optional<String> getProject() {
        return Optional.ofNullable(project).filter(p -> !p.isBlank());
    }

    public Duration getRequestTimeout() {
        return requestTimeout;
    }

    public static class Builder {
        private String apiKey;
        private HttpUrl baseUrl = HttpUrl.parse(DEFAULT_BASE_URL);
        private String speechModel = DEFAULT_SPEECH_MODEL;
        private String textModel = DEFAULT_TEXT_MODEL;
        private String videoModel = DEFAULT_VIDEO_MODEL;
        private String project;
        private Duration requestTimeout = Duration.ofSeconds(120);

        public Builder apiKey(String apiKey) {
            this.apiKey = apiKey;
            return this;
        }

        public Builder baseUrl(String baseUrl) {
            this.baseUrl = HttpUrl.parse(baseUrl);
            return this;
        }

        public Builder speechModel(String speechModel) {
            this.speechModel = speechModel;
            return this;
        }

        public Builder textModel(String textModel) {
            this.textModel = textModel;
            return this;
        }

        public Builder videoModel(String videoModel) {
            this.videoModel = videoModel;
            return this;
        }

        public Builder project(String project) {
            this.project = project;
            return this;
        }

        public Builder requestTimeout(Duration duration) {
            this.requestTimeout = duration;
            return this;
        }

        public OpenAIConfig build() {
            if (apiKey == null || apiKey.isBlank()) {
                throw new IllegalStateException("API key must not be blank");
            }
            if (baseUrl == null) {
                throw new IllegalStateException("Base URL must be provided");
            }
            return new OpenAIConfig(this);
        }
    }
}
