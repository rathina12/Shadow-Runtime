package com.shadowruntime.core.incidents;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "incidents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String serviceId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String severity; // "LOW", "MEDIUM", "HIGH", "CRITICAL"

    @Column(nullable = false)
    private String status; // "OPEN", "INVESTIGATING", "MITIGATED", "RESOLVED"

    private String triggerMetric; // e.g. "p99_latency_spike_1450ms", "http_500_error_rate_12.4%"

    @Column(columnDefinition = "TEXT")
    private String rootCauseSummary;

    private Long matchedRunbookId;

    @Builder.Default
    private Instant createdAt = Instant.now();

    private Instant resolvedAt;
}
