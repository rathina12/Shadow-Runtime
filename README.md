# 👁️ Shadow Runtime — AI-Powered Backend Execution Observability Platform

> **Shadow Runtime** watches a distributed network of backend microservices in real time and gives developers a visual, AI-explained picture of what is happening inside their system — request flows, performance bottlenecks, cascading errors, and root causes — without expensive commercial APM tools.

---

## 🏗️ Polyglot Multi-Service Architecture

```
┌────────────────────────────────────────────────────────┐
│   Next.js 15 + TypeScript (App Router + React Flow)    │  Modern Observability UI
│   - Live animated topology map with packet flows       │  - Predictive Shadow Mode
│   - AI Root-Cause Drawer & NL Query Terminal           │  - Replay / Rewind Scrubber
│   - Chaos Engineering trigger console                  │  - Cost Attribution Explorer
└──────────────────────────┬─────────────────────────────┘
                           │ REST + WebSocket
┌──────────────────────────▼─────────────────────────────┐
│   Node.js + TypeScript (Express + Socket.IO)           │  Real-Time Gateway & AI Engine
│   - OpenTelemetry ingestion (/api/telemetry/ingest)    │  - Gemini AI Root-Cause Narrator
│   - Predictive Shadow Engine (Latency Distributions)   │  - NL to Mongo Query Compiler
│   - BFS Graph Blast Radius Traversal                   │  - Microservice Traffic Generator
│   - Chaos Injection Middleware (Redis TTL auto-expiry) │
└─────────────┬──────────────────────────┬───────────────┘
              │                          │ internal REST
┌─────────────▼───────────────┐   ┌──────▼────────────────────────────────┐
│ MongoDB                     │   │ Spring Boot 3 (Java 17)                │
│ - Raw OpenTelemetry Spans   │   │ - JWT Auth & RBAC (Admin, Dev, Viewer) │
│ - Distributed Traces        │   │ - Monitored Service Registry Topology  │
│ - Service Execution Logs    │   │ - Incident Records & Runbook Matcher   │
│ - Historical Snapshots      │   │ - Endpoint Compute Cost Attribution    │
└─────────────────────────────┘   │ - Swagger / OpenAPI UI Docs           │
                                  └───────────────┬───────────────────────┘
┌─────────────────────────────┐                   │
│ Redis                       │                   │
│ - Live Pub/Sub broadcasts   │            ┌──────▼──────┐
│ - AI Response Caching       │            │ PostgreSQL  │
│ - Chaos Session TTL Expiry  │            │ (Structured │
└─────────────────────────────┘            │  DB Tier)   │
                                           └─────────────┘
```

---

## ✨ 10 Core Features Implemented

1. **Live Architecture Map**: Real-time animated React Flow graph showing microservices with pulsing health halos, live RPS, P95 latencies, and flowing packet animations.
2. **AI Root-Cause Explanation**: Correlates traces, error stack traces, and topology to call Google Gemini for plain-English incident summaries, cascading failure steps, and remediation scripts.
3. **Predictive Shadow Mode**: Statistical baseline comparison computing P50/P90/P99 latency expectations, rendered as a translucent cyber "ghost" overlay against actual execution.
4. **Blast Radius Visualization**: Graph BFS traversal from failing services highlighting direct and transitive downstream impacted nodes in amber/red with traffic impact percentages.
5. **Natural Language Telemetry Queries**: Translates plain English (e.g., *"Show all 5xx errors from payment-gateway"*) into validated MongoDB aggregation pipelines and tabular traces.
6. **Auto-Generated Runbooks**: Spring Boot matches active incidents against past resolutions with automated 1-click CLI fix scripts.
7. **Cost Attribution Calculator**: Computes hourly, daily, and monthly infrastructure compute burn rates per endpoint, service, and team.
8. **Chaos Testing Engine**: Injects latency or HTTP 5xx error storms into any service with automatic Redis TTL countdown and zero orphaned failure states.
9. **Replay / Rewind Mode**: Timeline scrubber allowing developers to rewind system state back 1m, 5m, 15m, 1h ago to replay historical cascading failures.
10. **Enterprise Auth & RBAC**: Spring Boot issued JWT bearer tokens supporting Admin, Engineer, and Viewer roles.

---

## 🚀 Quickstart & Running Locally

### Option A: Docker Compose (All Services in One Command)
```bash
# Clone and spin up all containers (Postgres, Mongo, Redis, Spring Boot, Gateway, Frontend)
docker-compose up --build
```
- **Dashboard UI**: [http://localhost:3000](http://localhost:3000)
- **Real-Time Gateway**: [http://localhost:4000](http://localhost:4000)
- **Spring Boot OpenAPI Swagger**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

---

### Option B: Local Development Mode

#### 1. Start Spring Boot Core Service
```bash
cd core-service
mvn spring-boot:run
```
*Note: Core Service automatically starts on port `8080` with in-memory H2 PostgreSQL mode and pre-seeded demo microservices, incidents, and runbooks.*

#### 2. Start Real-Time Gateway & AI Orchestrator
```bash
cd realtime-gateway
npm install
npm run dev
```
*Gateway starts on port `4000`, initializes Socket.IO, and runs the built-in microservice network traffic simulator.*

#### 3. Start Next.js Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
*Open [http://localhost:3000](http://localhost:3000) in your browser.*

---

## 🧪 Testing

### Gateway & AI Engine Unit Tests (Jest)
```bash
cd realtime-gateway
npm test
```

### Spring Boot Core Service Tests (JUnit)
```bash
cd core-service
mvn test
```

---

## 🔑 Default Demo Credentials
- **Admin**: `admin` / `admin123` (Full RBAC controls, chaos injection, service mutations)
- **Engineer**: `alex_dev` / `developer123` (Runbook execution, diagnosis)
- **Viewer**: `viewer` / `viewer123` (Read-only monitoring)
