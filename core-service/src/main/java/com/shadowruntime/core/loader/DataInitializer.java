package com.shadowruntime.core.loader;

import com.shadowruntime.core.auth.Role;
import com.shadowruntime.core.auth.User;
import com.shadowruntime.core.auth.UserRepository;
import com.shadowruntime.core.incidents.Incident;
import com.shadowruntime.core.incidents.IncidentRepository;
import com.shadowruntime.core.incidents.Runbook;
import com.shadowruntime.core.incidents.RunbookRepository;
import com.shadowruntime.core.registry.MonitoredService;
import com.shadowruntime.core.registry.ServiceDependency;
import com.shadowruntime.core.registry.ServiceRepository;
import com.shadowruntime.core.registry.DependencyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final DependencyRepository dependencyRepository;
    private final IncidentRepository incidentRepository;
    private final RunbookRepository runbookRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUsers();
        seedServices();
        seedDependencies();
        seedRunbooks();
        seedIncidents();
        log.info(">>> Shadow Runtime Core Service: Initial demo data successfully seeded!");
    }

    private void seedUsers() {
        if (userRepository.count() > 0) return;

        User admin = User.builder()
                .username("admin")
                .email("admin@shadowruntime.io")
                .password(passwordEncoder.encode("admin123"))
                .role(Role.ROLE_ADMIN)
                .team("Infrastructure & Security")
                .createdAt(Instant.now())
                .build();

        User dev = User.builder()
                .username("alex_dev")
                .email("alex@shadowruntime.io")
                .password(passwordEncoder.encode("developer123"))
                .role(Role.ROLE_ENGINEER)
                .team("Core Platform")
                .createdAt(Instant.now())
                .build();

        User viewer = User.builder()
                .username("viewer")
                .email("viewer@shadowruntime.io")
                .password(passwordEncoder.encode("viewer123"))
                .role(Role.ROLE_VIEWER)
                .team("Product Analytics")
                .createdAt(Instant.now())
                .build();

        userRepository.saveAll(Arrays.asList(admin, dev, viewer));
        log.info("Seeded 3 default users (admin, alex_dev, viewer)");
    }

    private void seedServices() {
        if (serviceRepository.count() > 0) return;

        List<MonitoredService> services = List.of(
                MonitoredService.builder()
                        .id("api-gateway")
                        .name("API Gateway & Edge Router")
                        .description("Edge ingress proxy, rate limiting, and SSL termination")
                        .tier("TIER_1_CRITICAL")
                        .status("HEALTHY")
                        .healthCheckUrl("http://api-gateway:8080/health")
                        .slaThresholdMs(100)
                        .ownerTeam("Edge Platform")
                        .endpoints(List.of("GET /api/v1/health", "POST /api/v1/checkout", "GET /api/v1/products", "POST /api/v1/auth/login"))
                        .build(),

                MonitoredService.builder()
                        .id("auth-service")
                        .name("Authentication & Session Service")
                        .description("JWT token issuance, OAuth2 federation, and RBAC policy enforcement")
                        .tier("TIER_1_CRITICAL")
                        .status("HEALTHY")
                        .healthCheckUrl("http://auth-service:8081/health")
                        .slaThresholdMs(80)
                        .ownerTeam("Security Team")
                        .endpoints(List.of("POST /oauth/token", "POST /auth/verify", "GET /auth/jwks.json"))
                        .build(),

                MonitoredService.builder()
                        .id("order-service")
                        .name("Order Processing Service")
                        .description("Coordinates multi-step checkout workflow and state transitions")
                        .tier("TIER_1_CRITICAL")
                        .status("HEALTHY")
                        .healthCheckUrl("http://order-service:8082/health")
                        .slaThresholdMs(250)
                        .ownerTeam("Core Commerce")
                        .endpoints(List.of("POST /orders", "GET /orders/{id}", "PATCH /orders/{id}/cancel"))
                        .build(),

                MonitoredService.builder()
                        .id("payment-gateway")
                        .name("Payment Gateway Adapter")
                        .description("PCI-compliant processing bridge for Stripe and PayPal transactions")
                        .tier("TIER_1_CRITICAL")
                        .status("HEALTHY")
                        .healthCheckUrl("http://payment-gateway:8083/health")
                        .slaThresholdMs(350)
                        .ownerTeam("Payments Team")
                        .endpoints(List.of("POST /payments/charge", "POST /payments/refund", "GET /payments/status/{id}"))
                        .build(),

                MonitoredService.builder()
                        .id("inventory-service")
                        .name("Inventory & Stock Service")
                        .description("Real-time warehouse inventory locks and stock availability tracking")
                        .tier("TIER_2_CORE")
                        .status("HEALTHY")
                        .healthCheckUrl("http://inventory-service:8084/health")
                        .slaThresholdMs(150)
                        .ownerTeam("Supply Chain")
                        .endpoints(List.of("POST /inventory/reserve", "GET /inventory/{sku}", "POST /inventory/release"))
                        .build(),

                MonitoredService.builder()
                        .id("notification-service")
                        .name("Notification & Dispatch Worker")
                        .description("Async dispatch of transactional SMS, emails, and mobile push notifications")
                        .tier("TIER_3_AUX")
                        .status("HEALTHY")
                        .healthCheckUrl("http://notification-service:8085/health")
                        .slaThresholdMs(500)
                        .ownerTeam("Growth & Engagement")
                        .endpoints(List.of("POST /notify/email", "POST /notify/sms", "POST /notify/push"))
                        .build(),

                MonitoredService.builder()
                        .id("analytics-worker")
                        .name("Real-time Analytics Worker")
                        .description("Consumes Kafka event stream for clickstream and business BI metrics")
                        .tier("TIER_3_AUX")
                        .status("HEALTHY")
                        .healthCheckUrl("http://analytics-worker:8086/health")
                        .slaThresholdMs(600)
                        .ownerTeam("Data Engineering")
                        .endpoints(List.of("POST /events/stream", "GET /metrics/summary"))
                        .build(),

                MonitoredService.builder()
                        .id("database-cluster")
                        .name("Primary DB & Cache Tier")
                        .description("High-availability PostgreSQL cluster and Redis cluster")
                        .tier("TIER_1_CRITICAL")
                        .status("HEALTHY")
                        .healthCheckUrl("http://db-primary:5432/health")
                        .slaThresholdMs(50)
                        .ownerTeam("Database Reliability Engineering")
                        .endpoints(List.of("TCP:5432 / PostgreSQL", "TCP:6379 / Redis Master"))
                        .build()
        );

        serviceRepository.saveAll(services);
        log.info("Seeded 8 microservices into service registry");
    }

    private void seedDependencies() {
        if (dependencyRepository.count() > 0) return;

        List<ServiceDependency> deps = List.of(
                ServiceDependency.builder().sourceServiceId("api-gateway").targetServiceId("auth-service").protocol("HTTP_REST").avgLatencyMs(42).isCritical(true).build(),
                ServiceDependency.builder().sourceServiceId("api-gateway").targetServiceId("order-service").protocol("HTTP_REST").avgLatencyMs(65).isCritical(true).build(),
                ServiceDependency.builder().sourceServiceId("order-service").targetServiceId("inventory-service").protocol("GRPC").avgLatencyMs(38).isCritical(true).build(),
                ServiceDependency.builder().sourceServiceId("order-service").targetServiceId("payment-gateway").protocol("HTTP_REST").avgLatencyMs(185).isCritical(true).build(),
                ServiceDependency.builder().sourceServiceId("order-service").targetServiceId("notification-service").protocol("ASYNC_KAFKA").avgLatencyMs(15).isCritical(false).build(),
                ServiceDependency.builder().sourceServiceId("payment-gateway").targetServiceId("database-cluster").protocol("POSTGRES_TCP").avgLatencyMs(22).isCritical(true).build(),
                ServiceDependency.builder().sourceServiceId("inventory-service").targetServiceId("database-cluster").protocol("POSTGRES_TCP").avgLatencyMs(18).isCritical(true).build(),
                ServiceDependency.builder().sourceServiceId("auth-service").targetServiceId("database-cluster").protocol("POSTGRES_TCP").avgLatencyMs(16).isCritical(true).build(),
                ServiceDependency.builder().sourceServiceId("notification-service").targetServiceId("analytics-worker").protocol("ASYNC_KAFKA").avgLatencyMs(12).isCritical(false).build()
        );

        dependencyRepository.saveAll(deps);
        log.info("Seeded 9 topology dependency edges");
    }

    private void seedRunbooks() {
        if (runbookRepository.count() > 0) return;

        List<Runbook> runbooks = List.of(
                Runbook.builder()
                        .title("Mitigate Payment Gateway HikariCP Connection Pool Starvation")
                        .targetService("payment-gateway")
                        .symptoms("HTTP 504 gateway timeout storm, HikariPool-1 connection acquisition timeout (>30000ms), thread lockup on /payments/charge")
                        .rootCauseCategory("CONNECTION_POOL_EXHAUSTION")
                        .stepsMarkdown("""
                                ### HikariCP Connection Pool Exhaustion Mitigation
                                1. **Check Active Pool Connections**: Inspect metrics dashboard for `hikaricp.active_connections >= max_pool_size`.
                                2. **Scale DB Pool Capacity**: Execute live scale-up of connection pool to 50 connections:
                                   `kubectl set env deployment/payment-gateway SPRING_DATASOURCE_HIKARI_MAX_POOL_SIZE=50`
                                3. **Restart Degraded Replicas**: Trigger rolling rollout to release deadlocked worker threads:
                                   `kubectl rollout restart deployment/payment-gateway`
                                4. **Verify Health**: Check `/health` endpoint and P95 latency recovery below 250ms.
                                """)
                        .autoFixScript("kubectl scale deployment payment-gateway --replicas=4 && kubectl rollout restart deployment payment-gateway")
                        .build(),

                Runbook.builder()
                        .title("Resolve Upstream Cascading Timeout on Order Processing")
                        .targetService("order-service")
                        .symptoms("Cascading 504 timeouts at API Gateway, thread pool saturation in order-service")
                        .rootCauseCategory("TIMEOUT_CASCADE")
                        .stepsMarkdown("""
                                ### Cascading Timeout Remediation
                                1. **Activate Circuit Breaker**: Flip payment gateway circuit breaker to OPEN to fail-fast:
                                   `curl -X POST http://order-service:8082/actuator/resilience4j/circuitbreakers/paymentGateway/transitionToOpenState`
                                2. **Flush Pending Queue**: Drop stalled async Kafka dispatch tasks.
                                3. **Verify API Gateway Status**: Confirm HTTP 424 or 503 fallback responses with graceful checkout messaging.
                                """)
                        .autoFixScript("curl -X POST http://localhost:8082/actuator/circuitbreakers/payment/open")
                        .build(),

                Runbook.builder()
                        .title("Mitigate Redis Session Cache OOM / Eviction Spikes")
                        .targetService("auth-service")
                        .symptoms("Auth service elevated login failure rate, Redis maxmemory reached, continuous key evictions")
                        .rootCauseCategory("MEMORY_LEAK")
                        .stepsMarkdown("""
                                ### Redis Cache OOM Resolution
                                1. **Inspect Memory Usage**: Run `redis-cli info memory` to identify fragmented memory.
                                2. **Adjust Eviction Policy**: Switch eviction to `allkeys-lru`:
                                   `redis-cli config set maxmemory-policy allkeys-lru`
                                3. **Purge Expired Sessions**: Flush orphaned guest session keys older than 24h.
                                """)
                        .autoFixScript("redis-cli config set maxmemory-policy allkeys-lru && redis-cli memory purge")
                        .build()
        );

        runbookRepository.saveAll(runbooks);
        log.info("Seeded 3 automated remediation runbooks");
    }

    private void seedIncidents() {
        if (incidentRepository.count() > 0) return;

        Incident incident = Incident.builder()
                .serviceId("payment-gateway")
                .title("High Latency & Connection Pool Starvation on Payment Gateway")
                .description("Spike in P99 latency exceeding 1,850ms on /payments/charge endpoint due to database connection timeout under peak load.")
                .severity("HIGH")
                .status("INVESTIGATING")
                .triggerMetric("p99_latency_1850ms_sla_breached")
                .rootCauseSummary("Database connection pool capacity (10) saturated by long-running third-party Stripe webhook validations, blocking incoming charge requests.")
                .matchedRunbookId(1L)
                .createdAt(Instant.now().minus(18, ChronoUnit.MINUTES))
                .build();

        incidentRepository.save(incident);
        log.info("Seeded 1 active incident record");
    }
}
