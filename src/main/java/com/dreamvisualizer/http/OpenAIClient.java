package com.dreamvisualizer.http;

import com.dreamvisualizer.config.OpenAIConfig;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Map;
import java.util.Objects;

/**
 * Low-level HTTP client that talks to the OpenAI REST APIs.
 */
public class OpenAIClient {

    private final OpenAIConfig config;
    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;

    public OpenAIClient(OpenAIConfig config) {
        this.config = Objects.requireNonNull(config, "config must not be null");
        this.objectMapper = new ObjectMapper();
        Duration timeout = config.getRequestTimeout();
        this.httpClient = new OkHttpClient.Builder()
                .callTimeout(timeout)
                .connectTimeout(timeout)
                .readTimeout(timeout)
                .writeTimeout(timeout)
                .build();
    }

    public JsonNode postJson(String pathSegments, Object payload) {
        try {
            RequestBody body = RequestBody.create(
                    objectMapper.writeValueAsBytes(payload),
                    MediaType.parse("application/json"));
            HttpUrl url = config.getBaseUrl().newBuilder()
                    .addPathSegments(pathSegments)
                    .build();
            Request.Builder builder = new Request.Builder()
                    .url(url)
                    .post(body);
            applyDefaultHeaders(builder);
            builder.header("Content-Type", "application/json");
            Request request = builder.build();
            return execute(request);
        } catch (JsonProcessingException e) {
            throw new OpenAIException("Failed to serialise JSON payload", e);
        }
    }

    public JsonNode getJson(String pathSegments) {
        HttpUrl url = config.getBaseUrl().newBuilder()
                .addPathSegments(pathSegments)
                .build();
        Request.Builder builder = new Request.Builder()
                .url(url)
                .get();
        applyDefaultHeaders(builder);
        Request request = builder.build();
        return execute(request);
    }

    public JsonNode getJson(String pathSegments, Map<String, String> queryParams) {
        HttpUrl.Builder builder = config.getBaseUrl().newBuilder()
                .addPathSegments(pathSegments);
        if (queryParams != null) {
            queryParams.forEach(builder::addQueryParameter);
        }
        HttpUrl url = builder.build();
        Request.Builder requestBuilder = new Request.Builder()
                .url(url)
                .get();
        applyDefaultHeaders(requestBuilder);
        Request request = requestBuilder.build();
        return execute(request);
    }

    public void downloadToFile(String url, Path destination) {
        Request.Builder builder = new Request.Builder()
                .url(url)
                .get();
        if (url.startsWith(config.getBaseUrl().scheme() + "://" + config.getBaseUrl().host())) {
            applyDefaultHeaders(builder);
        }
        Request request = builder.build();
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "";
                throw new OpenAIException("Failed to download asset (" + response.code() + "): " + errorBody);
            }
            if (response.body() == null) {
                throw new OpenAIException("Download returned an empty body");
            }
            Files.createDirectories(destination.getParent());
            Files.write(destination, response.body().bytes());
        } catch (IOException e) {
            throw new OpenAIException("Failed to download video asset", e);
        }
    }

    public JsonNode postMultipart(String pathSegments, MultipartBody body) {
        HttpUrl url = config.getBaseUrl().newBuilder()
                .addPathSegments(pathSegments)
                .build();
        Request.Builder builder = new Request.Builder()
                .url(url)
                .post(body);
        applyDefaultHeaders(builder);
        Request request = builder.build();
        return execute(request);
    }

    public JsonNode uploadAudioForTranscription(Path audioPath, String model, String language) {
        if (!Files.isReadable(audioPath)) {
            throw new IllegalArgumentException("Audio path must point to a readable file: " + audioPath);
        }

        MultipartBody.Builder builder = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("model", model)
                .addFormDataPart(
                        "file",
                        audioPath.getFileName().toString(),
                        RequestBody.create(audioPath.toFile(), MediaType.parse(detectMimeType(audioPath))));
        if (language != null && !language.isBlank()) {
            builder.addFormDataPart("language", language);
        }

        MultipartBody body = builder.build();
        return postMultipart("audio/transcriptions", body);
    }

    private String detectMimeType(Path audioPath) {
        try {
            String mime = Files.probeContentType(audioPath);
            return mime != null ? mime : "audio/mpeg";
        } catch (IOException e) {
            return "audio/mpeg";
        }
    }

    private JsonNode execute(Request request) {
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "";
                throw new OpenAIException("OpenAI API call failed with status "
                        + response.code() + ": " + errorBody);
            }
            if (response.body() == null) {
                throw new OpenAIException("OpenAI API call returned an empty body");
            }
            String responseBody = response.body().string();
            return objectMapper.readTree(responseBody);
        } catch (IOException e) {
            throw new OpenAIException("HTTP call to OpenAI failed", e);
        }
    }

    public ObjectMapper mapper() {
        return objectMapper;
    }

    private void applyDefaultHeaders(Request.Builder builder) {
        builder.header("Authorization", "Bearer " + config.getApiKey());
        config.getProject().ifPresent(project -> builder.header("OpenAI-Project", project));
    }
}
