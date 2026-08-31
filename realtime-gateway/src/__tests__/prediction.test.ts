import { PredictiveShadowEngine } from '../prediction/predictiveShadowEngine';

describe('Predictive Shadow Engine', () => {
  const prediction = new PredictiveShadowEngine();

  test('should return shadow baselines and compute anomalies', async () => {
    const profiles = await prediction.getShadowProfiles();
    expect(profiles['payment-gateway']).toBeDefined();
    expect(profiles['payment-gateway'].slaUpperLimitMs).toBe(350);

    // Normal execution
    const normal = await prediction.compareExecutionWithShadow('payment-gateway', 180);
    expect(normal.isAnomaly).toBe(false);

    // Degraded execution breaching SLA
    const degraded = await prediction.compareExecutionWithShadow('payment-gateway', 1200);
    expect(degraded.isAnomaly).toBe(true);
    expect(degraded.actualStatus).toBe('DEGRADED');
  });
});
