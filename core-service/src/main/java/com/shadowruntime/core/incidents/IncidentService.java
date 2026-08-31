package com.shadowruntime.core.incidents;

import com.shadowruntime.core.incidents.dto.IncidentDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final RunbookRepository runbookRepository;

    public List<IncidentDto.IncidentResponse> getAllIncidents() {
        return incidentRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<IncidentDto.IncidentResponse> getActiveIncidents() {
        return incidentRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(inc -> !"RESOLVED".equalsIgnoreCase(inc.getStatus()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public IncidentDto.IncidentResponse getIncidentById(Long id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found with ID: " + id));
        return mapToResponse(incident);
    }

    @Transactional
    public IncidentDto.IncidentResponse createIncident(IncidentDto.CreateIncidentRequest request) {
        // Auto-match runbook if not explicitly supplied
        Long runbookId = request.getMatchedRunbookId();
        if (runbookId == null) {
            runbookId = autoMatchRunbook(request.getServiceId(), request.getTitle(), request.getTriggerMetric());
        }

        Incident incident = Incident.builder()
                .serviceId(request.getServiceId())
                .title(request.getTitle())
                .description(request.getDescription())
                .severity(request.getSeverity() != null ? request.getSeverity() : "MEDIUM")
                .status("OPEN")
                .triggerMetric(request.getTriggerMetric())
                .rootCauseSummary(request.getRootCauseSummary())
                .matchedRunbookId(runbookId)
                .createdAt(Instant.now())
                .build();

        return mapToResponse(incidentRepository.save(incident));
    }

    @Transactional
    public IncidentDto.IncidentResponse updateIncidentStatus(Long id, IncidentDto.UpdateIncidentStatusRequest request) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found with ID: " + id));

        if (request.getStatus() != null) {
            incident.setStatus(request.getStatus());
            if ("RESOLVED".equalsIgnoreCase(request.getStatus())) {
                incident.setResolvedAt(Instant.now());
            }
        }
        if (request.getRootCauseSummary() != null) {
            incident.setRootCauseSummary(request.getRootCauseSummary());
        }
        if (request.getMatchedRunbookId() != null) {
            incident.setMatchedRunbookId(request.getMatchedRunbookId());
        }

        return mapToResponse(incidentRepository.save(incident));
    }

    // Runbook operations
    public List<IncidentDto.RunbookResponse> getAllRunbooks() {
        return runbookRepository.findAll().stream()
                .map(this::mapRunbook)
                .collect(Collectors.toList());
    }

    public List<IncidentDto.RunbookResponse> searchRunbooks(String query) {
        if (query == null || query.isBlank()) {
            return getAllRunbooks();
        }
        return runbookRepository.searchRunbooks(query).stream()
                .map(this::mapRunbook)
                .collect(Collectors.toList());
    }

    @Transactional
    public IncidentDto.RunbookResponse createRunbook(IncidentDto.CreateRunbookRequest request) {
        Runbook runbook = Runbook.builder()
                .title(request.getTitle())
                .targetService(request.getTargetService())
                .symptoms(request.getSymptoms())
                .rootCauseCategory(request.getRootCauseCategory())
                .stepsMarkdown(request.getStepsMarkdown())
                .autoFixScript(request.getAutoFixScript())
                .createdAt(Instant.now())
                .build();

        return mapRunbook(runbookRepository.save(runbook));
    }

    private Long autoMatchRunbook(String serviceId, String title, String trigger) {
        List<Runbook> targetRunbooks = runbookRepository.findByTargetService(serviceId);
        if (!targetRunbooks.isEmpty()) {
            return targetRunbooks.get(0).getId();
        }

        String searchKeyword = title != null ? title : (trigger != null ? trigger : serviceId);
        List<Runbook> matched = runbookRepository.searchRunbooks(searchKeyword);
        return matched.isEmpty() ? null : matched.get(0).getId();
    }

    private IncidentDto.IncidentResponse mapToResponse(Incident incident) {
        IncidentDto.RunbookResponse runbookResponse = null;
        if (incident.getMatchedRunbookId() != null) {
            Optional<Runbook> rb = runbookRepository.findById(incident.getMatchedRunbookId());
            runbookResponse = rb.map(this::mapRunbook).orElse(null);
        }

        return IncidentDto.IncidentResponse.builder()
                .id(incident.getId())
                .serviceId(incident.getServiceId())
                .title(incident.getTitle())
                .description(incident.getDescription())
                .severity(incident.getSeverity())
                .status(incident.getStatus())
                .triggerMetric(incident.getTriggerMetric())
                .rootCauseSummary(incident.getRootCauseSummary())
                .matchedRunbookId(incident.getMatchedRunbookId())
                .matchedRunbook(runbookResponse)
                .createdAt(incident.getCreatedAt())
                .resolvedAt(incident.getResolvedAt())
                .build();
    }

    private IncidentDto.RunbookResponse mapRunbook(Runbook runbook) {
        return IncidentDto.RunbookResponse.builder()
                .id(runbook.getId())
                .title(runbook.getTitle())
                .targetService(runbook.getTargetService())
                .symptoms(runbook.getSymptoms())
                .rootCauseCategory(runbook.getRootCauseCategory())
                .stepsMarkdown(runbook.getStepsMarkdown())
                .autoFixScript(runbook.getAutoFixScript())
                .createdAt(runbook.getCreatedAt())
                .build();
    }
}
