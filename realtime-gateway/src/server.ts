import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import { initRedis } from './config/redis';
import { initSocketServer } from './sockets/socketManager';
import { startTrafficSimulator, stopTrafficSimulator, isSimulatorActive } from './simulator/trafficSimulator';

// Telemetry handlers
import {
  handleIngest,
  handleGetTraces,
  handleGetTraceById,
  handleGetLogs,
  handleGetLiveMetrics,
  handleCreateSnapshot,
  handleGetSnapshots,
} from './telemetry/telemetryController';

// AI handlers
import {
  handleDiagnose,
  handleNlQuery,
  handleDraftRunbook,
} from './ai/aiController';

// Chaos handlers
import {
  handleInjectFault,
  handleGetActiveChaos,
  handleRevertChaos,
} from './chaos/chaosController';

// Prediction & Blast Radius handlers
import {
  handleGetShadowProfiles,
  handleCompareShadow,
} from './prediction/predictionController';
import {
  handleCalculateBlastRadius,
} from './blastradius/blastRadiusController';

const app = express();
const httpServer = createServer(app);

// Middlewares
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Services
initRedis();
initSocketServer(httpServer);
connectDatabase().then(() => {
  // Auto-start traffic simulator for rich live demonstration
  startTrafficSimulator(2000);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'shadow-runtime-realtime-gateway',
    status: 'UP',
    simulatorActive: isSimulatorActive(),
    timestamp: Date.now(),
  });
});

// Telemetry routes
app.post('/api/telemetry/ingest', handleIngest);
app.get('/api/telemetry/traces', handleGetTraces);
app.get('/api/telemetry/traces/:id', handleGetTraceById);
app.get('/api/telemetry/logs', handleGetLogs);
app.get('/api/telemetry/metrics', handleGetLiveMetrics);
app.post('/api/telemetry/snapshots', handleCreateSnapshot);
app.get('/api/telemetry/snapshots', handleGetSnapshots);

// AI & Gemini routes
app.post('/api/ai/diagnose', handleDiagnose);
app.post('/api/ai/nl-query', handleNlQuery);
app.post('/api/ai/draft-runbook', handleDraftRunbook);

// Chaos Engineering routes
app.post('/api/chaos/inject', handleInjectFault);
app.get('/api/chaos/active', handleGetActiveChaos);
app.post('/api/chaos/revert', handleRevertChaos);
app.delete('/api/chaos/:serviceId', handleRevertChaos);

// Predictive Shadow & Blast Radius routes
app.get('/api/prediction/profiles', handleGetShadowProfiles);
app.post('/api/prediction/compare', handleCompareShadow);
app.get('/api/blast-radius/:serviceId', handleCalculateBlastRadius);

// Simulator control routes
app.post('/api/simulator/start', (req, res) => {
  startTrafficSimulator();
  res.json({ status: 'started' });
});
app.post('/api/simulator/stop', (req, res) => {
  stopTrafficSimulator();
  res.json({ status: 'stopped' });
});

// Start listening
httpServer.listen(config.port, () => {
  console.log(`🚀 Shadow Runtime Real-time Gateway listening on http://localhost:${config.port}`);
});

export { app, httpServer };
