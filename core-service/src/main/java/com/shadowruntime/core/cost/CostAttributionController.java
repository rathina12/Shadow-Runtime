package com.shadowruntime.core.cost;

import com.shadowruntime.core.cost.dto.CostReportDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cost")
@RequiredArgsConstructor
@Tag(name = "Cost Attribution", description = "Endpoints for resource compute cost attribution per endpoint, service, and engineering team")
public class CostAttributionController {

    private final CostAttributionService costAttributionService;

    @GetMapping("/overview")
    @Operation(summary = "Get system compute cost attribution breakdown", description = "Calculates hourly/daily/monthly infrastructure cost by telemetry trace execution duration")
    public ResponseEntity<CostReportDto.SystemCostOverview> getCostOverview() {
        return ResponseEntity.ok(costAttributionService.calculateSystemCost());
    }
}
