import { v4 as uuidv4 } from 'uuid';
import { ingestTelemetry } from '../telemetry/telemetryService';
import { ISpan } from '../telemetry/models/Span';
import { chaosEngine } from '../chaos/chaosEngine';

let isSimulatorRunning = false;
let simulationInterval: NodeJS.Timeout | null = null;

export function startTrafficSimulator(intervalMs = 2500): void {
  if (isSimulatorRunning) return;
  isSimulatorRunning = true;
  console.log('🚀 Microservice Network Traffic Simulator started');

  simulationInterval = setInterval(async () => {
    try {
      await generateSimulatedTransaction();
    } catch (err: any) {
      console.warn(`Simulator iteration warning: ${err.message}`);
    }
  }, intervalMs);
}

export function stopTrafficSimulator(): void {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  isSimulatorRunning = false;
  console.log('🛑 Microservice Traffic Simulator stopped');
}

export function isSimulatorActive(): boolean {
  return isSimulatorRunning;
}

async function generateSimulatedTransaction(): Promise<void> {
  const transactionTypes = ['CHECKOUT_ORDER', 'GET_CATALOG', 'USER_AUTH', 'ORDER_STATUS'];
  const chosenType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];

  const traceId = `trace_${uuidv4().substring(0, 12)}`;
  const now = Date.now();
  const spans: ISpan[] = [];
  const logs: any[] = [];

  if (chosenType === 'CHECKOUT_ORDER') {
    // Flow: Gateway -> Auth -> Order -> Inventory -> Payment -> DB -> Notify
    const rootSpanId = `span_${uuidv4().substring(0, 8)}`;
    const authSpanId = `span_${uuidv4().substring(0, 8)}`;
    const orderSpanId = `span_${uuidv4().substring(0, 8)}`;
    const invSpanId = `span_${uuidv4().substring(0, 8)}`;
    const paySpanId = `span_${uuidv4().substring(0, 8)}`;
    const dbSpanId = `span_${uuidv4().substring(0, 8)}`;
    const notifSpanId = `span_${uuidv4().substring(0, 8)}`;

    // Check active chaos for each service
    const payChaos = await chaosEngine.getActiveFaultForService('payment-gateway');
    const orderChaos = await chaosEngine.getActiveFaultForService('order-service');

    const isPayError = payChaos && payChaos.faultType === 'HTTP_ERROR';
    const payExtraLatency = payChaos ? (payChaos.latencyMs || 800) : 0;
    const orderExtraLatency = orderChaos ? (orderChaos.latencyMs || 600) : 0;

    const dbLatency = 12 + Math.floor(Math.random() * 15);
    const payLatency = isPayError ? 35 : (160 + payExtraLatency + Math.floor(Math.random() * 40));
    const invLatency = 25 + Math.floor(Math.random() * 20);
    const authLatency = 30 + Math.floor(Math.random() * 15);
    const notifLatency = 15 + Math.floor(Math.random() * 10);
    const orderLatency = invLatency + payLatency + orderExtraLatency + 20;
    const totalDuration = authLatency + orderLatency + 15;

    // Database Span
    spans.push({
      spanId: dbSpanId,
      traceId,
      parentSpanId: paySpanId,
      serviceName: 'database-cluster',
      name: 'SQL: INSERT INTO payments_ledger',
      kind: 'CLIENT',
      startTime: now + authLatency + invLatency + 20,
      endTime: now + authLatency + invLatency + 20 + dbLatency,
      durationMs: dbLatency,
      statusCode: isPayError ? 'ERROR' : 'OK',
      attributes: { 'db.statement': 'INSERT INTO ledger (tx_id, amount, status) VALUES (?, ?, ?)', 'db.type': 'postgresql' }
    });

    // Payment Gateway Span
    spans.push({
      spanId: paySpanId,
      traceId,
      parentSpanId: orderSpanId,
      serviceName: 'payment-gateway',
      name: 'POST /payments/charge',
      kind: 'SERVER',
      startTime: now + authLatency + invLatency + 10,
      endTime: now + authLatency + invLatency + 10 + payLatency,
      durationMs: payLatency,
      statusCode: isPayError ? 'ERROR' : 'OK',
      httpMethod: 'POST',
      httpUrl: 'http://payment-gateway:8083/payments/charge',
      httpStatusCode: isPayError ? (payChaos?.httpStatusCode || 500) : 200,
      statusMessage: isPayError ? 'Payment authorization failed: upstream connector timeout' : undefined,
    });

    if (isPayError) {
      logs.push({
        serviceId: 'payment-gateway',
        traceId,
        spanId: paySpanId,
        level: 'ERROR',
        message: 'CRITICAL: PSP payment authorization timed out on /payments/charge. HTTP 500 returned.',
        timestamp: now + authLatency + invLatency + 10 + payLatency,
      });
    }

    // Inventory Span
    spans.push({
      spanId: invSpanId,
      traceId,
      parentSpanId: orderSpanId,
      serviceName: 'inventory-service',
      name: 'POST /inventory/reserve',
      kind: 'SERVER',
      startTime: now + authLatency + 5,
      endTime: now + authLatency + 5 + invLatency,
      durationMs: invLatency,
      statusCode: 'OK',
      httpMethod: 'POST',
      httpUrl: 'http://inventory-service:8084/inventory/reserve',
      httpStatusCode: 200,
    });

    // Notification Span
    spans.push({
      spanId: notifSpanId,
      traceId,
      parentSpanId: orderSpanId,
      serviceName: 'notification-service',
      name: 'KAFKA: order_confirmed_event',
      kind: 'PRODUCER',
      startTime: now + authLatency + invLatency + payLatency + 5,
      endTime: now + authLatency + invLatency + payLatency + 5 + notifLatency,
      durationMs: notifLatency,
      statusCode: isPayError ? 'ERROR' : 'OK',
    });

    // Order Service Span
    spans.push({
      spanId: orderSpanId,
      traceId,
      parentSpanId: rootSpanId,
      serviceName: 'order-service',
      name: 'POST /orders/checkout',
      kind: 'SERVER',
      startTime: now + authLatency,
      endTime: now + authLatency + orderLatency,
      durationMs: orderLatency,
      statusCode: isPayError ? 'ERROR' : 'OK',
      httpMethod: 'POST',
      httpUrl: 'http://order-service:8082/orders/checkout',
      httpStatusCode: isPayError ? 502 : 201,
    });

    // Auth Service Span
    spans.push({
      spanId: authSpanId,
      traceId,
      parentSpanId: rootSpanId,
      serviceName: 'auth-service',
      name: 'POST /auth/verify',
      kind: 'SERVER',
      startTime: now + 5,
      endTime: now + 5 + authLatency,
      durationMs: authLatency,
      statusCode: 'OK',
      httpMethod: 'POST',
      httpUrl: 'http://auth-service:8081/auth/verify',
      httpStatusCode: 200,
    });

    // API Gateway Root Span
    spans.push({
      spanId: rootSpanId,
      traceId,
      serviceName: 'api-gateway',
      name: 'POST /api/v1/checkout',
      kind: 'SERVER',
      startTime: now,
      endTime: now + totalDuration,
      durationMs: totalDuration,
      statusCode: isPayError ? 'ERROR' : 'OK',
      httpMethod: 'POST',
      httpUrl: 'https://api.shadowruntime.io/api/v1/checkout',
      httpStatusCode: isPayError ? 502 : 200,
    });

    logs.push({
      serviceId: 'api-gateway',
      traceId,
      spanId: rootSpanId,
      level: isPayError ? 'WARN' : 'INFO',
      message: `Completed POST /api/v1/checkout in ${totalDuration}ms with status ${isPayError ? 502 : 200}`,
      timestamp: now + totalDuration,
    });

    await ingestTelemetry({
      traces: [{
        traceId,
        rootSpanId,
        rootServiceName: 'api-gateway',
        name: 'POST /api/v1/checkout',
        startTime: now,
        endTime: now + totalDuration,
        durationMs: totalDuration,
        statusCode: isPayError ? 'ERROR' : 'OK',
        spans,
      }],
      logs,
    });
  } else {
    // Standard Catalog / Auth Flow
    const rootSpanId = `span_${uuidv4().substring(0, 8)}`;
    const childSpanId = `span_${uuidv4().substring(0, 8)}`;
    const dbSpanId = `span_${uuidv4().substring(0, 8)}`;

    const targetService = chosenType === 'GET_CATALOG' ? 'inventory-service' : 'auth-service';
    const childDuration = 28 + Math.floor(Math.random() * 25);
    const dbDuration = 10 + Math.floor(Math.random() * 10);
    const totalDuration = childDuration + dbDuration + 12;

    spans.push({
      spanId: dbSpanId,
      traceId,
      parentSpanId: childSpanId,
      serviceName: 'database-cluster',
      name: 'SQL: SELECT * FROM resources',
      kind: 'CLIENT',
      startTime: now + 12,
      endTime: now + 12 + dbDuration,
      durationMs: dbDuration,
      statusCode: 'OK',
    });

    spans.push({
      spanId: childSpanId,
      traceId,
      parentSpanId: rootSpanId,
      serviceName: targetService,
      name: chosenType === 'GET_CATALOG' ? 'GET /inventory/items' : 'POST /oauth/token',
      kind: 'SERVER',
      startTime: now + 5,
      endTime: now + 5 + childDuration,
      durationMs: childDuration,
      statusCode: 'OK',
      httpMethod: chosenType === 'GET_CATALOG' ? 'GET' : 'POST',
      httpStatusCode: 200,
    });

    spans.push({
      spanId: rootSpanId,
      traceId,
      serviceName: 'api-gateway',
      name: chosenType === 'GET_CATALOG' ? 'GET /api/v1/products' : 'POST /api/v1/auth/login',
      kind: 'SERVER',
      startTime: now,
      endTime: now + totalDuration,
      durationMs: totalDuration,
      statusCode: 'OK',
      httpStatusCode: 200,
    });

    await ingestTelemetry({
      traces: [{
        traceId,
        rootSpanId,
        rootServiceName: 'api-gateway',
        name: chosenType === 'GET_CATALOG' ? 'GET /api/v1/products' : 'POST /api/v1/auth/login',
        startTime: now,
        endTime: now + totalDuration,
        durationMs: totalDuration,
        statusCode: 'OK',
        spans,
      }],
    });
  }
}
