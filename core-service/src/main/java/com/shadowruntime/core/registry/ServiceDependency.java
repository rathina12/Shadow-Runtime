package com.shadowruntime.core.registry;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "service_dependencies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceDependency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String sourceServiceId; // Caller (e.g. api-gateway)

    @Column(nullable = false)
    private String targetServiceId; // Callee (e.g. order-service)

    private String protocol; // "HTTP_REST", "GRPC", "ASYNC_KAFKA", "REDIS_TCP", "POSTGRES_TCP"

    @Column(nullable = false)
    private Integer avgLatencyMs;

    @Column(nullable = false)
    private Boolean isCritical;
}
