package com.shadowruntime.core.registry;

import com.shadowruntime.core.registry.dto.ServiceDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceRegistryService {

    private final ServiceRepository serviceRepository;
    private final DependencyRepository dependencyRepository;

    public List<ServiceDto.ServiceDetail> getAllServices() {
        return serviceRepository.findAll().stream()
                .map(this::mapToDetail)
                .collect(Collectors.toList());
    }

    public ServiceDto.ServiceDetail getServiceById(String id) {
        MonitoredService service = serviceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Service with id '" + id + "' not found"));
        return mapToDetail(service);
    }

    public ServiceDto.TopologyResponse getTopology() {
        List<ServiceDto.ServiceDetail> services = getAllServices();
        List<ServiceDto.DependencyDetail> edges = dependencyRepository.findAll().stream()
                .map(this::mapDependency)
                .collect(Collectors.toList());

        return ServiceDto.TopologyResponse.builder()
                .services(services)
                .edges(edges)
                .build();
    }

    @Transactional
    public ServiceDto.ServiceDetail createService(ServiceDto.CreateServiceRequest request) {
        MonitoredService service = MonitoredService.builder()
                .id(request.getId())
                .name(request.getName())
                .description(request.getDescription())
                .tier(request.getTier() != null ? request.getTier() : "TIER_2_CORE")
                .status(request.getStatus() != null ? request.getStatus() : "HEALTHY")
                .healthCheckUrl(request.getHealthCheckUrl())
                .slaThresholdMs(request.getSlaThresholdMs() != null ? request.getSlaThresholdMs() : 250)
                .ownerTeam(request.getOwnerTeam() != null ? request.getOwnerTeam() : "Platform Team")
                .endpoints(request.getEndpoints() != null ? request.getEndpoints() : List.of())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return mapToDetail(serviceRepository.save(service));
    }

    @Transactional
    public ServiceDto.ServiceDetail updateServiceStatus(String id, String status) {
        MonitoredService service = serviceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Service not found"));
        service.setStatus(status);
        service.setUpdatedAt(Instant.now());
        return mapToDetail(serviceRepository.save(service));
    }

    @Transactional
    public ServiceDto.DependencyDetail createDependency(String sourceId, String targetId, String protocol, int avgLatency, boolean isCritical) {
        ServiceDependency dependency = ServiceDependency.builder()
                .sourceServiceId(sourceId)
                .targetServiceId(targetId)
                .protocol(protocol)
                .avgLatencyMs(avgLatency)
                .isCritical(isCritical)
                .build();

        return mapDependency(dependencyRepository.save(dependency));
    }

    private ServiceDto.ServiceDetail mapToDetail(MonitoredService service) {
        List<ServiceDto.DependencyDetail> upstreams = dependencyRepository.findByTargetServiceId(service.getId())
                .stream().map(this::mapDependency).collect(Collectors.toList());

        List<ServiceDto.DependencyDetail> downstreams = dependencyRepository.findBySourceServiceId(service.getId())
                .stream().map(this::mapDependency).collect(Collectors.toList());

        return ServiceDto.ServiceDetail.builder()
                .id(service.getId())
                .name(service.getName())
                .description(service.getDescription())
                .tier(service.getTier())
                .status(service.getStatus())
                .healthCheckUrl(service.getHealthCheckUrl())
                .slaThresholdMs(service.getSlaThresholdMs())
                .ownerTeam(service.getOwnerTeam())
                .endpoints(service.getEndpoints())
                .upstreamDependencies(upstreams)
                .downstreamDependencies(downstreams)
                .createdAt(service.getCreatedAt())
                .updatedAt(service.getUpdatedAt())
                .build();
    }

    private ServiceDto.DependencyDetail mapDependency(ServiceDependency dep) {
        return ServiceDto.DependencyDetail.builder()
                .id(dep.getId())
                .sourceServiceId(dep.getSourceServiceId())
                .targetServiceId(dep.getTargetServiceId())
                .protocol(dep.getProtocol())
                .avgLatencyMs(dep.getAvgLatencyMs())
                .isCritical(dep.getIsCritical())
                .build();
    }
}
