package com.shadowruntime.core.registry;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "monitored_services")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonitoredService {

    @Id
    private String id; // e.g., "auth-service", "payment-gateway"

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private String tier; // e.g. "TIER_1_CRITICAL", "TIER_2_CORE", "TIER_3_AUX"

    @Column(nullable = false)
    private String status; // "HEALTHY", "DEGRADED", "CRITICAL", "OFFLINE"

    private String healthCheckUrl;

    @Column(nullable = false)
    private Integer slaThresholdMs; // e.g. 200ms

    @Column(nullable = false)
    private String ownerTeam;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "service_endpoints", joinColumns = @JoinColumn(name = "service_id"))
    @Column(name = "endpoint")
    @Builder.Default
    private List<String> endpoints = new ArrayList<>();

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Instant updatedAt = Instant.now();
}
