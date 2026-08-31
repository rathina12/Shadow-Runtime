# 🧪 Shadow Runtime — Sample Test & Verification Suite

This directory contains standalone sample telemetry payloads and an automated end-to-end verification script for **Shadow Runtime**.

---

## 📁 Files Included

1. **`sample_telemetry_payload.json`**:
   - Realistic distributed trace payload representing an e-commerce checkout failure (`api-gateway` ➔ `auth-service` ➔ `order-service` ➔ `payment-gateway` (HTTP 500 timeout) ➔ `database-cluster`).
   - Includes OpenTelemetry formatted spans, timings, attributes, and service logs.

2. **`demo_verifier.js`**:
   - Automated Node.js end-to-end test runner.
   - Tests 8 distinct subsystems:
     1. Gateway Health Status (`GET /health`)
     2. OpenTelemetry Telemetry Ingestion (`POST /api/telemetry/ingest`)
     3. Distributed Trace Retrieval (`GET /api/telemetry/traces`)
     4. BFS Blast Radius Graph Traversal (`GET /api/blast-radius/:serviceId`)
     5. Predictive Shadow Mode Anomaly Detection (`POST /api/prediction/compare`)
     6. Gemini AI Root-Cause Incident Diagnosis (`POST /api/ai/diagnose`)
     7. Natural Language Telemetry Query Compilation (`POST /api/ai/nl-query`)
     8. Chaos Fault Injection & Redis TTL Session (`POST /api/chaos/inject` & `POST /api/chaos/revert`)

---

## 🚀 Running the Sample Verifier

```powershell
# 1. Start the Real-time Gateway (if not already running)
cd realtime-gateway
npm start

# 2. Run the Sample Verifier (in another terminal)
node sample/demo_verifier.js
```
