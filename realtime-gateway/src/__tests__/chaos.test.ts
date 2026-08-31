import { ChaosEngine } from '../chaos/chaosEngine';

describe('Chaos Fault Injection & TTL Engine', () => {
  const chaos = new ChaosEngine();

  test('should inject latency fault and register active experiment', async () => {
    const exp = await chaos.injectFault({
      serviceId: 'payment-gateway',
      faultType: 'LATENCY',
      latencyMs: 900,
      ttlSeconds: 10,
    });

    expect(exp.serviceId).toBe('payment-gateway');
    expect(exp.faultType).toBe('LATENCY');
    expect(exp.latencyMs).toBe(900);

    const active = await chaos.getActiveFaultForService('payment-gateway');
    expect(active).not.toBeNull();
    expect(active?.faultType).toBe('LATENCY');

    const reverted = await chaos.revertChaos('payment-gateway');
    expect(reverted.reverted).toBe(true);
  });
});
