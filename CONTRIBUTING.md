# Contributing

Shadow Runtime welcomes focused contributions to observability, reliability, performance analysis, and developer tooling.

## Local validation
- Gateway: `cd realtime-gateway && npm ci && npm test`.
- Core service: `cd core-service && mvn test`.
- Frontend: `cd frontend && npm ci && npm run build`.

## Engineering expectations
Prefer changes that are observable and testable. Performance changes should state the bottleneck being addressed and how the result was measured. Telemetry changes should preserve trace correlation and avoid exposing secrets or sensitive payloads.

## Pull request checklist
- [ ] Tests pass for affected services.
- [ ] New failure modes have safe fallbacks.
- [ ] Metrics/logging remain useful and bounded.
- [ ] Performance claims include a reproducible measurement.
- [ ] Documentation is updated for new operational behavior.
