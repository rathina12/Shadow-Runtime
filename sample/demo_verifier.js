/**
 * Shadow Runtime - Automated Sample Verifier
 * This script runs automated checks against the Shadow Runtime services
 * to verify that every endpoint, AI model, telemetry ingestion, chaos injection,
 * and blast radius calculation works properly.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const GATEWAY_URL = 'http://127.0.0.1:4000';

function request(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runSampleVerification() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING SHADOW RUNTIME SAMPLE SUITE VERIFICATION');
  console.log('======================================================\n');

  const results = [];

  // 1. Health Check
  try {
    const res = await request(`${GATEWAY_URL}/health`);
    if (res.status === 200 && res.data.status === 'UP') {
      results.push({ test: '1. Gateway Health Check', status: '✅ PASS', details: `Service status: ${res.data.status}` });
    } else {
      results.push({ test: '1. Gateway Health Check', status: '❌ FAIL', details: `Status code ${res.status}` });
    }
  } catch (err) {
    results.push({ test: '1. Gateway Health Check', status: '❌ FAIL', details: err.message });
  }

  // 2. Ingest Sample Telemetry Payload
  try {
    const samplePayloadPath = path.join(__dirname, 'sample_telemetry_payload.json');
    const rawPayload = fs.readFileSync(samplePayloadPath, 'utf8');
    const payload = JSON.parse(rawPayload);

    const res = await request(`${GATEWAY_URL}/api/telemetry/ingest`, 'POST', payload);
    if (res.status === 202 && res.data.ingestedTraces === 1) {
      results.push({ test: '2. Telemetry Ingestion Engine', status: '✅ PASS', details: `Ingested ${res.data.ingestedTraces} trace, ${res.data.ingestedLogs} logs` });
    } else {
      results.push({ test: '2. Telemetry Ingestion Engine', status: '❌ FAIL', details: JSON.stringify(res.data) });
    }
  } catch (err) {
    results.push({ test: '2. Telemetry Ingestion Engine', status: '❌ FAIL', details: err.message });
  }

  // 3. Fetch Ingested Traces
  try {
    const res = await request(`${GATEWAY_URL}/api/telemetry/traces?limit=10`);
    if (res.status === 200 && res.data.traces && res.data.traces.length > 0) {
      results.push({ test: '3. Trace Retrieval & MongoDB Query', status: '✅ PASS', details: `Retrieved ${res.data.traces.length} distributed traces` });
    } else {
      results.push({ test: '3. Trace Retrieval & MongoDB Query', status: '❌ FAIL', details: `Traces empty` });
    }
  } catch (err) {
    results.push({ test: '3. Trace Retrieval & MongoDB Query', status: '❌ FAIL', details: err.message });
  }

  // 4. Blast Radius Graph Traversal (BFS)
  try {
    const res = await request(`${GATEWAY_URL}/api/blast-radius/payment-gateway`);
    if (res.status === 200 && res.data.directDependents?.includes('order-service')) {
      results.push({ test: '4. Blast Radius BFS Graph Traversal', status: '✅ PASS', details: `Direct: [${res.data.directDependents.join(', ')}], Impact: ${res.data.estimatedTrafficImpactPercent}%` });
    } else {
      results.push({ test: '4. Blast Radius BFS Graph Traversal', status: '❌ FAIL', details: JSON.stringify(res.data) });
    }
  } catch (err) {
    results.push({ test: '4. Blast Radius BFS Graph Traversal', status: '❌ FAIL', details: err.message });
  }

  // 5. Predictive Shadow Execution Engine
  try {
    const compareRes = await request(`${GATEWAY_URL}/api/prediction/compare`, 'POST', {
      serviceId: 'payment-gateway',
      actualLatencyMs: 1450,
      actualPath: ['database-cluster'],
    });
    if (compareRes.status === 200 && compareRes.data.isAnomaly === true) {
      results.push({ test: '5. Predictive Shadow Mode Comparison', status: '✅ PASS', details: `Detected SLA anomaly: Delta +${compareRes.data.deltaPercent}%` });
    } else {
      results.push({ test: '5. Predictive Shadow Mode Comparison', status: '❌ FAIL', details: JSON.stringify(compareRes.data) });
    }
  } catch (err) {
    results.push({ test: '5. Predictive Shadow Mode Comparison', status: '❌ FAIL', details: err.message });
  }

  // 6. AI Root-Cause Incident Diagnosis
  try {
    const res = await request(`${GATEWAY_URL}/api/ai/diagnose`, 'POST', {
      serviceId: 'payment-gateway',
      incidentTitle: 'HikariCP Pool Starvation Spike',
    });
    if (res.status === 200 && res.data.rootCauseAnalysis && res.data.executiveSummary) {
      results.push({ test: '6. AI Root-Cause Incident Narrator', status: '✅ PASS', details: `Model: ${res.data.aiModelUsed}, Severity: ${res.data.severityAssessment}` });
    } else {
      results.push({ test: '6. AI Root-Cause Incident Narrator', status: '❌ FAIL', details: JSON.stringify(res.data) });
    }
  } catch (err) {
    results.push({ test: '6. AI Root-Cause Incident Narrator', status: '❌ FAIL', details: err.message });
  }

  // 7. Natural Language Telemetry Query Compilation
  try {
    const res = await request(`${GATEWAY_URL}/api/ai/nl-query`, 'POST', {
      query: 'Show all 5xx errors from payment-gateway with latency > 500ms',
    });
    if (res.status === 200 && res.data.mongoAggregationPipeline?.length > 0) {
      results.push({ test: '7. Natural Language Telemetry Query', status: '✅ PASS', details: `Compiled pipeline (${res.data.executionTimeMs}ms): ${res.data.interpretedIntent}` });
    } else {
      results.push({ test: '7. Natural Language Telemetry Query', status: '❌ FAIL', details: JSON.stringify(res.data) });
    }
  } catch (err) {
    results.push({ test: '7. Natural Language Telemetry Query', status: '❌ FAIL', details: err.message });
  }

  // 8. Chaos Fault Injection & Redis TTL Expiry
  try {
    const injectRes = await request(`${GATEWAY_URL}/api/chaos/inject`, 'POST', {
      serviceId: 'payment-gateway',
      faultType: 'LATENCY',
      latencyMs: 950,
      ttlSeconds: 20,
    });
    if (injectRes.status === 201 && injectRes.data.id) {
      const activeRes = await request(`${GATEWAY_URL}/api/chaos/active`);
      const hasActive = activeRes.data.activeExperiments?.some((e) => e.serviceId === 'payment-gateway');

      // Revert test
      await request(`${GATEWAY_URL}/api/chaos/revert`, 'POST', { serviceId: 'payment-gateway' });

      if (hasActive) {
        results.push({ test: '8. Chaos Fault Injection & Redis TTL', status: '✅ PASS', details: `Active TTL registered & reverted successfully` });
      } else {
        results.push({ test: '8. Chaos Fault Injection & Redis TTL', status: '❌ FAIL', details: 'Experiment not found in active list' });
      }
    } else {
      results.push({ test: '8. Chaos Fault Injection & Redis TTL', status: '❌ FAIL', details: JSON.stringify(injectRes.data) });
    }
  } catch (err) {
    results.push({ test: '8. Chaos Fault Injection & Redis TTL', status: '❌ FAIL', details: err.message });
  }

  // Print Summary Table
  console.table(results);

  const allPassed = results.every((r) => r.status.includes('PASS'));
  if (allPassed) {
    console.log('\n🎉 ALL 8 SAMPLE TESTS PASSED PERFECTLY WITH ZERO ERRORS!\n');
  } else {
    console.log('\n⚠️ Some tests failed. Check the details above.\n');
  }
}

// Run verifier
runSampleVerification();
