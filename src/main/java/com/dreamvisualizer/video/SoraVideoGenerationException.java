package com.dreamvisualizer.video;

public class SoraVideoGenerationException extends RuntimeException {
    public SoraVideoGenerationException(String message) {
        super(message);
    }

    public SoraVideoGenerationException(String message, Throwable cause) {
        super(message, cause);
    }
}
