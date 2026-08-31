package com.shadowruntime.core.incidents;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "runbooks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Runbook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String targetService; // e.g. "payment-gateway", "GLOBAL"

    @Column(columnDefinition = "TEXT")
    private String symptoms;

    @Column(nullable = false)
    private String rootCauseCategory; // "CONNECTION_POOL_EXHAUSTION", "TIMEOUT_CASCADE", "MEMORY_LEAK", "UPSTREAM_5XX"

    @Column(columnDefinition = "TEXT", nullable = false)
    private String stepsMarkdown;

    @Column(columnDefinition = "TEXT")
    private String autoFixScript; // bash/cli remediation snippet

    @Builder.Default
    private Instant createdAt = Instant.now();
}
