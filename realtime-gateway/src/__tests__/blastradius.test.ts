import { BlastRadiusEngine } from '../blastradius/blastRadiusEngine';

describe('Blast Radius Engine BFS Calculation', () => {
  const engine = new BlastRadiusEngine();

  test('should calculate blast radius for payment-gateway failure', () => {
    const result = engine.calculateBlastRadius('payment-gateway');
    expect(result.failingServiceId).toBe('payment-gateway');
    expect(result.directDependents).toContain('order-service');
    expect(result.indirectDependents).toContain('api-gateway');
    expect(result.impactedServicesCount).toBeGreaterThanOrEqual(2);
    expect(result.estimatedTrafficImpactPercent).toBeGreaterThan(0);
  });

  test('should identify critical impact for database cluster failure', () => {
    const result = engine.calculateBlastRadius('database-cluster');
    expect(result.failingServiceId).toBe('database-cluster');
    expect(result.impactSeverity).toBe('CRITICAL');
  });
});
