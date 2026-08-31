export interface DependencyEdge {
  source: string;
  target: string;
  protocol?: string;
  isCritical?: boolean;
}

export interface BlastRadiusResult {
  failingServiceId: string;
  totalNodesInGraph: number;
  impactedServicesCount: number;
  impactSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedTrafficImpactPercent: number;
  directDependents: string[];
  indirectDependents: string[];
  traversalOrder: Array<{
    serviceId: string;
    hopDistance: number;
    parentService: string;
    isCriticalPath: boolean;
  }>;
  criticalPathsImpacted: string[][];
}

// Inverted topology: to find who depends on `target`, we look for incoming edges or callers
// If `payment-gateway` fails, `order-service` (which calls it) and `api-gateway` (which calls order-service) are affected!
const DEFAULT_TOPOLOGY_EDGES: DependencyEdge[] = [
  { source: 'api-gateway', target: 'auth-service', isCritical: true },
  { source: 'api-gateway', target: 'order-service', isCritical: true },
  { source: 'order-service', target: 'inventory-service', isCritical: true },
  { source: 'order-service', target: 'payment-gateway', isCritical: true },
  { source: 'order-service', target: 'notification-service', isCritical: false },
  { source: 'payment-gateway', target: 'database-cluster', isCritical: true },
  { source: 'inventory-service', target: 'database-cluster', isCritical: true },
  { source: 'auth-service', target: 'database-cluster', isCritical: true },
  { source: 'notification-service', target: 'analytics-worker', isCritical: false },
];

export class BlastRadiusEngine {
  private edges: DependencyEdge[];

  constructor(customEdges?: DependencyEdge[]) {
    this.edges = customEdges || DEFAULT_TOPOLOGY_EDGES;
  }

  calculateBlastRadius(failedServiceId: string): BlastRadiusResult {
    // Reverse graph lookup: find services that depend ON the failed service
    // e.g. caller -> target. If target fails, caller is impacted.
    const callersMap = new Map<string, Array<{ caller: string; isCritical: boolean }>>();
    const allServices = new Set<string>();

    for (const edge of this.edges) {
      allServices.add(edge.source);
      allServices.add(edge.target);

      if (!callersMap.has(edge.target)) {
        callersMap.set(edge.target, []);
      }
      callersMap.get(edge.target)!.push({
        caller: edge.source,
        isCritical: edge.isCritical !== false,
      });
    }

    // BFS Traversal
    const queue: Array<{ serviceId: string; hop: number; parent: string; isCritical: boolean }> = [];
    const visited = new Set<string>();
    const traversalOrder: BlastRadiusResult['traversalOrder'] = [];
    const directDependents: string[] = [];
    const indirectDependents: string[] = [];

    visited.add(failedServiceId);
    queue.push({ serviceId: failedServiceId, hop: 0, parent: 'ROOT_FAILURE', isCritical: true });

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.serviceId !== failedServiceId) {
        traversalOrder.push({
          serviceId: current.serviceId,
          hopDistance: current.hop,
          parentService: current.parent,
          isCriticalPath: current.isCritical,
        });

        if (current.hop === 1) {
          directDependents.push(current.serviceId);
        } else {
          indirectDependents.push(current.serviceId);
        }
      }

      // Find all services that call the current service
      const callers = callersMap.get(current.serviceId) || [];
      for (const edge of callers) {
        if (!visited.has(edge.caller)) {
          visited.add(edge.caller);
          queue.push({
            serviceId: edge.caller,
            hop: current.hop + 1,
            parent: current.serviceId,
            isCritical: edge.isCritical,
          });
        }
      }
    }

    const totalNodes = allServices.size || 8;
    const impactedCount = directDependents.length + indirectDependents.length;
    const trafficPercent = Math.min(100, Math.round((impactedCount / totalNodes) * 100));

    let impactSeverity: BlastRadiusResult['impactSeverity'] = 'LOW';
    if (trafficPercent >= 60 || failedServiceId === 'api-gateway' || failedServiceId === 'database-cluster') {
      impactSeverity = 'CRITICAL';
    } else if (trafficPercent >= 35) {
      impactSeverity = 'HIGH';
    } else if (trafficPercent >= 15) {
      impactSeverity = 'MEDIUM';
    }

    // Identify critical failure chains
    const criticalPathsImpacted: string[][] = [];
    for (const node of traversalOrder.filter(t => t.isCriticalPath)) {
      criticalPathsImpacted.push([failedServiceId, node.parentService, node.serviceId].filter(s => s !== 'ROOT_FAILURE'));
    }

    return {
      failingServiceId: failedServiceId,
      totalNodesInGraph: totalNodes,
      impactedServicesCount: impactedCount,
      impactSeverity,
      estimatedTrafficImpactPercent: trafficPercent,
      directDependents,
      indirectDependents,
      traversalOrder,
      criticalPathsImpacted,
    };
  }
}
