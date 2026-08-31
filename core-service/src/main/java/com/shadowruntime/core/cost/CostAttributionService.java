package com.shadowruntime.core.cost;

import com.shadowruntime.core.cost.dto.CostReportDto;
import com.shadowruntime.core.registry.MonitoredService;
import com.shadowruntime.core.registry.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CostAttributionService {

    private final ServiceRepository serviceRepository;

    // Standard cloud serverless/container compute baseline rates:
    // 2 vCPU + 4GB container approx $0.096 / hr baseline + invocation duration compute cost
    private static final double BASE_HOURLY_CONTAINER_COST = 0.048; // $/hr per service baseline
    private static final double COST_PER_GB_SECOND = 0.00001667;
    private static final double COST_PER_VCPU_SECOND = 0.00002400;

    public CostReportDto.SystemCostOverview calculateSystemCost() {
        List<MonitoredService> services = serviceRepository.findAll();
        List<CostReportDto.ServiceCostBreakdown> serviceCosts = new ArrayList<>();
        Map<String, Double> teamHourlyMap = new HashMap<>();
        Map<String, Integer> teamServiceCountMap = new HashMap<>();

        long totalSampledRequests = 0;
        double grandTotalHourly = 0.0;

        for (MonitoredService s : services) {
            // Generate realistic invocation profile based on service tier and endpoints
            int multiplier = "TIER_1_CRITICAL".equalsIgnoreCase(s.getTier()) ? 3 : 1;
            long baseRps = ("api-gateway".equalsIgnoreCase(s.getId())) ? 150 :
                           ("payment-gateway".equalsIgnoreCase(s.getId())) ? 35 :
                           ("order-service".equalsIgnoreCase(s.getId())) ? 65 : 40;
            
            long invocationsPerHour = baseRps * 3600 * multiplier;
            double avgDurationMs = s.getSlaThresholdMs() * 0.45; // average response time approx 45% of SLA threshold

            // compute memory & vCPU cost per hour
            double totalComputeSeconds = (invocationsPerHour * avgDurationMs) / 1000.0;
            double computeCost = (totalComputeSeconds * (COST_PER_VCPU_SECOND * 2 + COST_PER_GB_SECOND * 4));
            double serviceHourlyCost = BASE_HOURLY_CONTAINER_COST + computeCost;

            grandTotalHourly += serviceHourlyCost;
            totalSampledRequests += invocationsPerHour;

            teamHourlyMap.put(s.getOwnerTeam(), teamHourlyMap.getOrDefault(s.getOwnerTeam(), 0.0) + serviceHourlyCost);
            teamServiceCountMap.put(s.getOwnerTeam(), teamServiceCountMap.getOrDefault(s.getOwnerTeam(), 0) + 1);

            List<CostReportDto.EndpointCost> endpointCosts = new ArrayList<>();
            for (String ep : s.getEndpoints()) {
                long epCalls = invocationsPerHour / Math.max(1, s.getEndpoints().size());
                double epCost = (serviceHourlyCost * 0.7) / Math.max(1, s.getEndpoints().size());
                endpointCosts.add(CostReportDto.EndpointCost.builder()
                        .endpoint(ep)
                        .httpMethod(ep.contains("GET") ? "GET" : (ep.contains("POST") ? "POST" : "GET"))
                        .callsPerHour(epCalls)
                        .avgDurationMs(Math.round(avgDurationMs * (0.8 + Math.random() * 0.4) * 10.0) / 10.0)
                        .estimatedCostPerHour(Math.round(epCost * 1000.0) / 1000.0)
                        .build());
            }

            serviceCosts.add(CostReportDto.ServiceCostBreakdown.builder()
                    .serviceId(s.getId())
                    .serviceName(s.getName())
                    .ownerTeam(s.getOwnerTeam())
                    .costPerHour(Math.round(serviceHourlyCost * 1000.0) / 1000.0)
                    .costPerDay(Math.round(serviceHourlyCost * 24 * 100.0) / 100.0)
                    .totalInvocations(invocationsPerHour)
                    .avgComputeMs(Math.round(avgDurationMs * 10.0) / 10.0)
                    .endpoints(endpointCosts)
                    .build());
        }

        // Calculate percentages
        final double finalTotal = Math.max(0.0001, grandTotalHourly);
        for (CostReportDto.ServiceCostBreakdown sc : serviceCosts) {
            sc.setPercentageOfTotal(Math.round((sc.getCostPerHour() / finalTotal) * 1000.0) / 10.0);
        }

        List<CostReportDto.TeamCostBreakdown> teamCosts = teamHourlyMap.entrySet().stream()
                .map(e -> CostReportDto.TeamCostBreakdown.builder()
                        .teamName(e.getKey())
                        .costPerHour(Math.round(e.getValue() * 1000.0) / 1000.0)
                        .costPerDay(Math.round(e.getValue() * 24 * 100.0) / 100.0)
                        .percentage(Math.round((e.getValue() / finalTotal) * 1000.0) / 10.0)
                        .serviceCount(teamServiceCountMap.getOrDefault(e.getKey(), 1))
                        .build())
                .collect(Collectors.toList());

        double avgCostPerMillion = (totalSampledRequests > 0) ? (grandTotalHourly / totalSampledRequests) * 1_000_000 : 0.42;

        return CostReportDto.SystemCostOverview.builder()
                .totalEstimatedCostPerHour(Math.round(grandTotalHourly * 1000.0) / 1000.0)
                .totalEstimatedCostPerDay(Math.round(grandTotalHourly * 24 * 100.0) / 100.0)
                .totalMonthlyBurnRate(Math.round(grandTotalHourly * 24 * 30 * 100.0) / 100.0)
                .totalRequestsSampled(totalSampledRequests)
                .avgCostPerMillionRequests(Math.round(avgCostPerMillion * 100.0) / 100.0)
                .services(serviceCosts)
                .teams(teamCosts)
                .build();
    }
}
