package com.shadowruntime.core.cost.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

public class CostReportDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SystemCostOverview {
        private Double totalEstimatedCostPerHour;
        private Double totalEstimatedCostPerDay;
        private Double totalMonthlyBurnRate;
        private Long totalRequestsSampled;
        private Double avgCostPerMillionRequests;
        private List<ServiceCostBreakdown> services;
        private List<TeamCostBreakdown> teams;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ServiceCostBreakdown {
        private String serviceId;
        private String serviceName;
        private String ownerTeam;
        private Double costPerHour;
        private Double costPerDay;
        private Double percentageOfTotal;
        private Long totalInvocations;
        private Double avgComputeMs;
        private List<EndpointCost> endpoints;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EndpointCost {
        private String endpoint;
        private String httpMethod;
        private Long callsPerHour;
        private Double avgDurationMs;
        private Double estimatedCostPerHour;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TeamCostBreakdown {
        private String teamName;
        private Double costPerHour;
        private Double costPerDay;
        private Double percentage;
        private Integer serviceCount;
    }
}
