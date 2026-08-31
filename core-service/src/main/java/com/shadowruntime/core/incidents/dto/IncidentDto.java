package com.shadowruntime.core.incidents.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

public class IncidentDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IncidentResponse {
        private Long id;
        private String serviceId;
        private String title;
        private String description;
        private String severity;
        private String status;
        private String triggerMetric;
        private String rootCauseSummary;
        private Long matchedRunbookId;
        private RunbookResponse matchedRunbook;
        private Instant createdAt;
        private Instant resolvedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RunbookResponse {
        private Long id;
        private String title;
        private String targetService;
        private String symptoms;
        private String rootCauseCategory;
        private String stepsMarkdown;
        private String autoFixScript;
        private Instant createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateIncidentRequest {
        private String serviceId;
        private String title;
        private String description;
        private String severity; // LOW, MEDIUM, HIGH, CRITICAL
        private String triggerMetric;
        private String rootCauseSummary;
        private Long matchedRunbookId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRunbookRequest {
        private String title;
        private String targetService;
        private String symptoms;
        private String rootCauseCategory;
        private String stepsMarkdown;
        private String autoFixScript;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateIncidentStatusRequest {
        private String status; // INVESTIGATING, MITIGATED, RESOLVED
        private String rootCauseSummary;
        private Long matchedRunbookId;
    }
}
