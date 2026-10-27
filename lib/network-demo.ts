// An illustrative request path, not a deployment or a performance measurement.
export const DEMO_NODES = [
  { id: "client", label: "Client", x: 60, y: 195, kind: "client", description: "Click to send a request." },
  { id: "gateway", label: "Gateway", x: 205, y: 195, kind: "gateway", description: "Routes requests to an available service." },
  { id: "api-a", label: "API A", x: 375, y: 100, kind: "service", description: "Handles requests while available." },
  { id: "api-b", label: "API B", x: 375, y: 290, kind: "service", description: "An alternate service when the other path fails." },
  { id: "database", label: "Database", x: 560, y: 195, kind: "database", description: "Stores the result before the response returns." },
] as const;

export type DemoNodeId = (typeof DEMO_NODES)[number]["id"];

export const DEMO_LINKS = [
  { id: "client-gateway", from: "client", to: "gateway" },
  { id: "gateway-api-a", from: "gateway", to: "api-a" },
  { id: "gateway-api-b", from: "gateway", to: "api-b" },
  { id: "api-a-database", from: "api-a", to: "database" },
  { id: "api-b-database", from: "api-b", to: "database" },
] as const satisfies readonly { id: string; from: DemoNodeId; to: DemoNodeId }[];

export function findDemoRoute(
  disabledLinks: readonly string[],
  pausedServices: readonly DemoNodeId[] = [],
): DemoNodeId[] {
  const disabled = new Set(disabledLinks);
  const paused = new Set(pausedServices);
  if (paused.has("client") || paused.has("database")) return [];
  const visited = new Set<DemoNodeId>(["client"]);
  const queue: DemoNodeId[][] = [["client"]];

  while (queue.length) {
    const route = queue.shift()!;
    const current = route[route.length - 1];
    if (current === "database") return route;

    for (const link of DEMO_LINKS) {
      if (disabled.has(link.id)) continue;
      const next = link.from === current ? link.to : link.to === current ? link.from : null;
      if (next && !paused.has(next) && !visited.has(next)) {
        visited.add(next);
        queue.push([...route, next]);
      }
    }
  }

  return [];
}
