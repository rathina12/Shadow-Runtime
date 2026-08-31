package com.shadowruntime.core.registry.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.List;

public class ServiceDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ServiceDetail {
        private String id;
        private String name;
        private String description;
        private String tier;
        private String status;
        private String healthCheckUrl;
        private Integer slaThresholdMs;
        private String ownerTeam;
        private List<String> endpoints;
        private List<DependencyDetail> upstreamDependencies;
        private List<DependencyDetail> downstreamDependencies;
        private Instant createdAt;
        private Instant updatedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DependencyDetail {
        private Long id;
        private String sourceServiceId;
        private String targetServiceId;
        private String protocol;
        private Integer avgLatencyMs;
        private Boolean isCritical;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopologyResponse {
        private List<ServiceDetail> services;
        private List<DependencyDetail> edges;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateServiceRequest {
        private String id;
        private String name;
        private String description;
        private String tier;
        private String status;
        private String healthCheckUrl;
        private Integer slaThresholdMs;
        private String ownerTeam;
        private List<String> endpoints;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateStatusRequest {
        private String status; // HEALTHY, DEGRADED, CRITICAL, OFFLINE
    }
}
