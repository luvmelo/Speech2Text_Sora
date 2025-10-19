package com.dreamvisualizer.http;

/**
 * Wraps any checked or runtime errors originating from upstream AI HTTP interactions.
 */
public class OpenAIException extends RuntimeException {

    public OpenAIException(String message) {
        super(message);
    }

    public OpenAIException(String message, Throwable cause) {
        super(message, cause);
    }
}
