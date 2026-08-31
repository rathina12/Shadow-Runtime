package com.shadowruntime.core.registry;

import com.shadowruntime.core.registry.dto.ServiceDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/services")
@RequiredArgsConstructor
@Tag(name = "Service Registry", description = "Endpoints for managing monitored microservices and dependency topology")
public class ServiceRegistryController {

    private final ServiceRegistryService serviceRegistryService;

    @GetMapping
    @Operation(summary = "List all monitored microservices", description = "Returns registered services with health states, SLA targets, and endpoints")
    public ResponseEntity<List<ServiceDto.ServiceDetail>> getAllServices() {
        return ResponseEntity.ok(serviceRegistryService.getAllServices());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get service details by ID", description = "Returns a single service including upstream and downstream dependency relations")
    public ResponseEntity<ServiceDto.ServiceDetail> getServiceById(@PathVariable String id) {
        return ResponseEntity.ok(serviceRegistryService.getServiceById(id));
    }

    @GetMapping("/topology")
    @Operation(summary = "Get full system architecture topology", description = "Returns all services and directed dependency graph edges")
    public ResponseEntity<ServiceDto.TopologyResponse> getTopology() {
        return ResponseEntity.ok(serviceRegistryService.getTopology());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_ENGINEER')")
    @Operation(summary = "Register a new microservice", description = "Adds a new microservice definition to the registry")
    public ResponseEntity<ServiceDto.ServiceDetail> createService(@RequestBody ServiceDto.CreateServiceRequest request) {
        return ResponseEntity.ok(serviceRegistryService.createService(request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_ENGINEER')")
    @Operation(summary = "Update service health status", description = "Changes health status (HEALTHY, DEGRADED, CRITICAL, OFFLINE)")
    public ResponseEntity<ServiceDto.ServiceDetail> updateStatus(
            @PathVariable String id,
            @RequestBody ServiceDto.UpdateStatusRequest request
    ) {
        return ResponseEntity.ok(serviceRegistryService.updateServiceStatus(id, request.getStatus()));
    }
}
