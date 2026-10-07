# Shadow Runtime — Production AI Hardening

## Goal
Use Shadow Runtime itself to observe the reliability of its AI features.

## Signals
- LLM request latency and P95 latency
- success/fallback/error/cache-hit counts
- estimated input/output token volume
- provider/model identifier
- operation type

## Reliability principles
1. AI failures must degrade to deterministic incident synthesis where possible.
2. Model telemetry must be measurable independently from application telemetry.
3. Generated Mongo pipelines require validation before execution.
4. Model output parsing errors are operational failures and should be counted.
5. CI must run both TypeScript/Jest and Spring Boot tests.

## Next hardening steps
- wire telemetry into Gemini diagnosis/query/runbook paths;
- expose metrics endpoint;
- add schema validation for generated JSON;
- whitelist Mongo aggregation stages;
- add provider timeout/retry budgets;
- add rate limiting and circuit breaking;
- deploy metrics/logging to CloudWatch once AWS infrastructure is provisioned.
