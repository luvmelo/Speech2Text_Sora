package com.dreamvisualizer.video;

import java.time.Instant;
import java.util.Optional;

/**
 * Domain representation of a Sora generation job.
 */
public record SoraVideoJob(String jobId,
                           String status,
                           Instant createdAt,
                           Optional<String> downloadUrl) {
}
