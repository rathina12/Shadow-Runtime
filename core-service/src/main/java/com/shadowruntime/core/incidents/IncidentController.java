package com.shadowruntime.core.incidents;

import com.shadowruntime.core.incidents.dto.IncidentDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Incidents & Runbooks", description = "Endpoints for incident detection tracking, root-cause recording, and runbook matching")
public class IncidentController {

    private final IncidentService incidentService;

    @GetMapping("/incidents")
    @Operation(summary = "List all incidents", description = "Returns full chronological list of recorded system incidents")
    public ResponseEntity<List<IncidentDto.IncidentResponse>> getAllIncidents() {
        return ResponseEntity.ok(incidentService.getAllIncidents());
    }

    @GetMapping("/incidents/active")
    @Operation(summary = "List active incidents", description = "Returns only unresolved incidents (OPEN / INVESTIGATING / MITIGATED)")
    public ResponseEntity<List<IncidentDto.IncidentResponse>> getActiveIncidents() {
        return ResponseEntity.ok(incidentService.getActiveIncidents());
    }

    @GetMapping("/incidents/{id}")
    @Operation(summary = "Get incident by ID", description = "Returns detailed incident record including associated runbook and root-cause breakdown")
    public ResponseEntity<IncidentDto.IncidentResponse> getIncidentById(@PathVariable Long id) {
        return ResponseEntity.ok(incidentService.getIncidentById(id));
    }

    @PostMapping("/incidents")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_ENGINEER')")
    @Operation(summary = "Create an incident record", description = "Registers a newly triggered incident and automatically matches historical runbooks")
    public ResponseEntity<IncidentDto.IncidentResponse> createIncident(@RequestBody IncidentDto.CreateIncidentRequest request) {
        return ResponseEntity.ok(incidentService.createIncident(request));
    }

    @PatchMapping("/incidents/{id}/status")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_ENGINEER')")
    @Operation(summary = "Update incident status and remediation details", description = "Updates status, root cause, or associated runbook")
    public ResponseEntity<IncidentDto.IncidentResponse> updateIncidentStatus(
            @PathVariable Long id,
            @RequestBody IncidentDto.UpdateIncidentStatusRequest request
    ) {
        return ResponseEntity.ok(incidentService.updateIncidentStatus(id, request));
    }

    @GetMapping("/runbooks")
    @Operation(summary = "List or search runbooks", description = "Searches knowledge-base runbooks matching target services or keywords")
    public ResponseEntity<List<IncidentDto.RunbookResponse>> getRunbooks(@RequestParam(required = false) String query) {
        return ResponseEntity.ok(incidentService.searchRunbooks(query));
    }

    @PostMapping("/runbooks")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_ENGINEER')")
    @Operation(summary = "Create a runbook", description = "Stores a new structured mitigation runbook with step-by-step instructions and auto-fix script")
    public ResponseEntity<IncidentDto.RunbookResponse> createRunbook(@RequestBody IncidentDto.CreateRunbookRequest request) {
        return ResponseEntity.ok(incidentService.createRunbook(request));
    }
}
