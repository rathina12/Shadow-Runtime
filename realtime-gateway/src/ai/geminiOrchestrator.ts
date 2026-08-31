import { getGeminiModel } from '../config/gemini';
import { getRedis } from '../config/redis';
import { getRecentLogs, getRecentTraces, getLiveMetrics } from '../telemetry/telemetryService';
import { TraceModel } from '../telemetry/models/Trace';
import { isDbConnected } from '../config/database';

export interface AiDiagnosisResult {
  incidentId?: string | number;
  serviceId: string;
  executiveSummary: string;
  rootCauseAnalysis: {
    primaryAnomaly: string;
    triggerMechanism: string;
    cascadingFailures: string[];
    affectedDownstreamServices: string[];
  };
  severityAssessment: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedBlastRadiusPercent: number;
  immediateRemediationSteps: string[];
  recommendedRunbookSnippet: string;
  aiModelUsed: string;
  cached: boolean;
  generatedAt: string;
}

export interface NlQueryResult {
  naturalLanguageQuery: string;
  interpretedIntent: string;
  mongoAggregationPipeline: any[];
  executionTimeMs: number;
  totalMatches: number;
  data: any[];
  aiExplanation: string;
  suggestedFollowUpQueries: string[];
}

export class GeminiOrchestrator {
  private redis = getRedis();

  async diagnoseServiceIncident(serviceId: string, incidentTitle?: string): Promise<AiDiagnosisResult> {
    const cacheKey = `ai:diagnosis:${serviceId}:${incidentTitle || 'current'}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return { ...parsed, cached: true };
      } catch {}
    }

    const recentLogs = await getRecentLogs(25, serviceId);
    const recentTraces = await getRecentTraces(20, serviceId);
    const metrics = getLiveMetrics();
    const serviceMetric = metrics.find(m => m.serviceId === serviceId);

    const model = getGeminiModel();
    let diagnosis: AiDiagnosisResult;

    if (model) {
      try {
        const prompt = `
You are Shadow Runtime, an expert AI Site Reliability Engineer and backend observability orchestrator.
Diagnose an active incident for microservice: "${serviceId}".
Incident Title/Symptoms: "${incidentTitle || 'High Latency / Elevated Error Rates'}"

Current Live Telemetry State:
- Service Metrics: ${JSON.stringify(serviceMetric || {})}
- Sample Error/Recent Logs: ${JSON.stringify(recentLogs.slice(0, 10))}
- Recent Traces with Anomalies: ${JSON.stringify(recentTraces.slice(0, 5).map(t => ({ id: t.traceId, durationMs: t.durationMs, errors: t.hasErrors })))}

Provide your diagnosis in strict JSON format matching this schema:
{
  "executiveSummary": "Concise 2-sentence summary of what broke and why",
  "rootCauseAnalysis": {
    "primaryAnomaly": "Specific technical root cause (e.g., HikariCP connection pool exhaustion, Redis OOM)",
    "triggerMechanism": "What triggered this anomaly",
    "cascadingFailures": ["Step 1", "Step 2", "Step 3"],
    "affectedDownstreamServices": ["service-a", "service-b"]
  },
  "severityAssessment": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "estimatedBlastRadiusPercent": number (0 to 100),
  "immediateRemediationSteps": ["Command/Step 1", "Step 2", "Step 3"],
  "recommendedRunbookSnippet": "Markdown or CLI command"
}
`;
        const response = await model.generateContent(prompt);
        const text = response.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          diagnosis = {
            serviceId,
            ...parsed,
            aiModelUsed: 'gemini-1.5-flash',
            cached: false,
            generatedAt: new Date().toISOString(),
          };
        } else {
          throw new Error('Failed to parse Gemini JSON output');
        }
      } catch (err: any) {
        console.warn(`Gemini call failed (${err.message}). Falling back to deterministic AI diagnostic synthesis.`);
        diagnosis = this.synthesizeLocalDiagnosis(serviceId, incidentTitle, serviceMetric, recentLogs);
      }
    } else {
      diagnosis = this.synthesizeLocalDiagnosis(serviceId, incidentTitle, serviceMetric, recentLogs);
    }

    // Cache diagnosis for 60 seconds
    await this.redis.setex(cacheKey, 60, JSON.stringify(diagnosis));
    return diagnosis;
  }

  async translateAndExecuteNlQuery(queryText: string): Promise<NlQueryResult> {
    const startTime = Date.now();
    const cleanQuery = queryText.toLowerCase().trim();

    const model = getGeminiModel();
    let interpretedIntent = `Analyze traces matching: "${queryText}"`;
    let mongoPipeline: any[] = [];
    let explanation = '';
    let followUps: string[] = [
      'Show error rate trend for payment-gateway',
      'Find all traces with duration > 1000ms',
      'List top 5 slowest database queries'
    ];

    if (model) {
      try {
        const prompt = `
Translate this natural language observability query into a MongoDB aggregation pipeline for the 'traces' collection.
User Query: "${queryText}"

Collection Schema:
- traceId (string), rootServiceName (string), name (string), durationMs (number), statusCode ('OK'|'ERROR'), hasErrors (boolean), servicesInvolved (string[]), spans (array of spans with serviceName, durationMs, statusCode, httpStatusCode)

Respond with ONLY valid JSON:
{
  "interpretedIntent": "Clear summary of user intent",
  "pipeline": [ ...valid mongo pipeline stages... ],
  "explanation": "Brief explanation of query logic",
  "suggestedFollowUpQueries": ["Question 1", "Question 2", "Question 3"]
}
`;
        const res = await model.generateContent(prompt);
        const text = res.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          interpretedIntent = parsed.interpretedIntent;
          mongoPipeline = parsed.pipeline;
          explanation = parsed.explanation;
          if (parsed.suggestedFollowUpQueries) followUps = parsed.suggestedFollowUpQueries;
        }
      } catch (err) {}
    }

    // Heuristic pipeline builder if pipeline wasn't parsed
    if (!mongoPipeline || mongoPipeline.length === 0) {
      if (cleanQuery.includes('error') || cleanQuery.includes('500') || cleanQuery.includes('5xx') || cleanQuery.includes('fail')) {
        interpretedIntent = 'Filter all traces with error status or HTTP 5xx responses';
        mongoPipeline = [
          { $match: { hasErrors: true } },
          { $sort: { startTime: -1 } },
          { $limit: 20 }
        ];
        explanation = 'Matches traces where hasErrors=true, sorted chronologically descending.';
      } else if (cleanQuery.includes('slow') || cleanQuery.includes('latency') || cleanQuery.includes('>')) {
        interpretedIntent = 'Filter high latency traces exceeding SLA threshold';
        mongoPipeline = [
          { $match: { durationMs: { $gt: 300 } } },
          { $sort: { durationMs: -1 } },
          { $limit: 20 }
        ];
        explanation = 'Queries traces with execution duration > 300ms, sorted by longest duration first.';
      } else if (cleanQuery.includes('payment') || cleanQuery.includes('order') || cleanQuery.includes('auth')) {
        const target = cleanQuery.includes('payment') ? 'payment-gateway' : (cleanQuery.includes('order') ? 'order-service' : 'auth-service');
        interpretedIntent = `Filter traces involving ${target}`;
        mongoPipeline = [
          { $match: { servicesInvolved: target } },
          { $sort: { startTime: -1 } },
          { $limit: 20 }
        ];
        explanation = `Matches traces traversing ${target}.`;
      } else {
        interpretedIntent = 'Fetch recent distributed traces across all microservices';
        mongoPipeline = [
          { $sort: { startTime: -1 } },
          { $limit: 15 }
        ];
        explanation = 'Returns latest multi-service traces sorted by timestamp.';
      }
    }

    // Execute query against MongoDB or Memory
    let records: any[] = [];
    if (isDbConnected()) {
      try {
        records = await (TraceModel as any).aggregate(mongoPipeline);
      } catch {
        records = await getRecentTraces(20);
      }
    } else {
      records = await getRecentTraces(20);
      if (cleanQuery.includes('error') || cleanQuery.includes('fail')) {
        records = records.filter(r => r.hasErrors);
      } else if (cleanQuery.includes('slow') || cleanQuery.includes('latency')) {
        records = records.sort((a, b) => b.durationMs - a.durationMs);
      }
    }

    return {
      naturalLanguageQuery: queryText,
      interpretedIntent,
      mongoAggregationPipeline: mongoPipeline,
      executionTimeMs: Date.now() - startTime,
      totalMatches: records.length,
      data: records.slice(0, 20),
      aiExplanation: explanation || `Found ${records.length} matching telemetry records in the observability store.`,
      suggestedFollowUpQueries: followUps,
    };
  }

  async draftRunbook(serviceId: string, issue: string): Promise<any> {
    const model = getGeminiModel();
    if (model) {
      try {
        const prompt = `
Generate a DevOps/SRE incident mitigation runbook in Markdown for microservice: "${serviceId}".
Issue: "${issue}"

Format with:
# Runbook: [Title]
## Symptoms & Impact
## Immediate Mitigations (CLI commands)
## Root Cause Verification
## Rollback & Failover Steps
`;
        const res = await model.generateContent(prompt);
        return {
          serviceId,
          markdown: res.response.text(),
          source: 'gemini-1.5-flash',
        };
      } catch {}
    }

    return {
      serviceId,
      markdown: `
# Runbook: Emergency Recovery for ${serviceId}
## Symptoms & Impact
- Elevated P99 latency SLA breach (>500ms)
- Upstream cascading timeouts impacting checkout throughput

## Immediate Remediation
\`\`\`bash
# 1. Scale out service replicas
kubectl scale deployment ${serviceId} --replicas=5

# 2. Flush hot cache & restart connection pool
kubectl rollout restart deployment ${serviceId}
\`\`\`

## Verification
- Monitor \`/health\` endpoint for HTTP 200
- Check Grafana P95 latency stabilization < 200ms
`,
      source: 'shadow-runtime-ai-engine',
    };
  }

  private synthesizeLocalDiagnosis(
    serviceId: string,
    incidentTitle?: string,
    metric?: any,
    logs: any[] = []
  ): AiDiagnosisResult {
    const isPayment = serviceId === 'payment-gateway';
    const isOrder = serviceId === 'order-service';
    const isAuth = serviceId === 'auth-service';

    const primaryAnomaly = isPayment
      ? 'HikariCP database connection pool starvation under concurrent charge requests'
      : isOrder
      ? 'Upstream cascading timeout triggered by blocked downstream payment dependency'
      : isAuth
      ? 'Redis token verification cache eviction storm and thread contention'
      : 'Resource saturation and elevated GC pause latency';

    const triggerMechanism = isPayment
      ? 'Third-party PSP webhook acknowledgment timeout holding DB connections open beyond 30s'
      : isOrder
      ? 'Thread pool saturation on HTTP connection pool awaiting payment-gateway responses'
      : 'Burst in authentication handshakes exceeding maximum session cache threshold';

    const cascading = isPayment
      ? ['Stripe API connector latency spike to 1200ms', 'HikariPool-1 connections exhausted (10/10 active)', 'Incoming POST /payments/charge queued and timed out with HTTP 504']
      : ['Order orchestrator blocked on payment dispatch', 'API Gateway worker threads stalled awaiting order response', 'Cart checkout requests failing with HTTP 504'];

    const downstream = isPayment
      ? ['order-service', 'api-gateway', 'notification-service']
      : ['api-gateway', 'notification-service'];

    return {
      serviceId,
      executiveSummary: `Microservice '${serviceId}' is experiencing severe degradation due to ${primaryAnomaly}. This is causing downstream SLA breaches across ${downstream.length} connected services.`,
      rootCauseAnalysis: {
        primaryAnomaly,
        triggerMechanism,
        cascadingFailures: cascading,
        affectedDownstreamServices: downstream,
      },
      severityAssessment: 'HIGH',
      estimatedBlastRadiusPercent: isPayment ? 68 : (isOrder ? 45 : 30),
      immediateRemediationSteps: [
        `Scale deployment replicas: kubectl scale deployment ${serviceId} --replicas=4`,
        `Increase max connection pool limit: export SPRING_DATASOURCE_HIKARI_MAX_POOL_SIZE=40`,
        `Enable circuit breaker fail-fast fallback to prevent upstream queue starvation`
      ],
      recommendedRunbookSnippet: `kubectl rollout restart deployment/${serviceId} && curl -X POST http://localhost:8080/api/v1/chaos/recover`,
      aiModelUsed: 'shadow-ai-deterministic-engine',
      cached: false,
      generatedAt: new Date().toISOString(),
    };
  }
}
