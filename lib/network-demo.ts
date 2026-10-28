// Browser-local illustration. Timings control animation, not network benchmarks.
export type RouteId = "a" | "b";
export type NodeId = "source" | "router-a" | "router-b" | "destination";
export type Point = { x: number; y: number };
export type PacketStatus = "in-flight" | "delivered" | "blocked" | "dropped";
export type DemoPacket = {
  id: number;
  route: RouteId;
  progress: number;
  startedAt: number;
  finishedAt: number | null;
  status: PacketStatus;
  sample: boolean;
};
export type LabState = {
  running: boolean;
  now: number;
  nextPacketAt: number;
  nextId: number;
  linkBroken: boolean;
  policyBlocked: boolean;
  packets: DemoPacket[];
  selectedPacketId: number | null;
};
export type LabAction =
  | { type: "tick"; ms: number }
  | { type: "set-running"; running: boolean }
  | { type: "toggle-link" }
  | { type: "toggle-policy" }
  | { type: "select-packet"; id: number | "latest" | null }
  | { type: "reset" };

export const PACKET_INTERVAL = 1300;
export const JOURNEY_MS = 3200;
export const FADE_MS = 650;
export const HISTORY_SIZE = 4;
export const DEMO_NODES = [
  { id: "source", label: "Source" },
  { id: "router-a", label: "Router A" },
  { id: "router-b", label: "Router B" },
  { id: "destination", label: "Destination" },
] as const;

export function createLabState(): LabState {
  return {
    running: false, now: 0, nextPacketAt: 0, nextId: 1,
    linkBroken: false, policyBlocked: false, packets: [], selectedPacketId: null,
  };
}
export function activeRoute(state: LabState): RouteId {
  return state.linkBroken ? "b" : "a";
}
export function networkMessage(state: LabState) {
  if (state.policyBlocked) return state.linkBroken
    ? "Traffic rerouted. Destination policy still blocks it."
    : "Connection blocked by destination policy.";
  return state.linkBroken
    ? "Traffic rerouted. Destination still reachable."
    : "Traffic reaches its destination through Router A.";
}
export function packetStatus(packet: DemoPacket) {
  switch (packet.status) {
    case "delivered": return "Delivered";
    case "blocked": return "Blocked by policy";
    case "dropped": return "Dropped at broken link";
    default: return "In transit";
  }
}
export function inspectedPacket(state: LabState) {
  return state.packets.find((packet) => packet.id === state.selectedPacketId);
}
function spawn(state: LabState, sample = false) {
  const packet: DemoPacket = {
    id: state.nextId++, route: activeRoute(state), progress: sample ? 1 : 0,
    startedAt: state.now, finishedAt: sample ? state.now : null,
    status: sample ? state.policyBlocked ? "blocked" : "delivered" : "in-flight", sample,
  };
  state.packets.push(packet);
  return packet;
}
function prune(state: LabState) {
  const completed = state.packets.filter((packet) => packet.finishedAt !== null);
  if (completed.length <= HISTORY_SIZE) return;
  completed.sort((a, b) => b.finishedAt! - a.finishedAt! || b.id - a.id);
  const recent = new Set(completed.slice(0, HISTORY_SIZE).map((packet) => packet.id));
  state.packets = state.packets.filter((packet) => packet.finishedAt === null
    || (!packet.sample && state.now - packet.finishedAt < FADE_MS) || recent.has(packet.id) || packet.id === state.selectedPacketId);
}

export function labReducer(previous: LabState, action: LabAction): LabState {
  if (action.type === "reset") return { ...createLabState(), running: previous.running };
  if (action.type === "tick" && (!previous.running || !Number.isFinite(action.ms) || action.ms <= 0)) return previous;
  if (action.type === "set-running" && previous.running === action.running) return previous;
  // Completed packets never change. Only motion and link failures mutate
  // in-flight packets; share the rest with the previous immutable snapshot.
  const updatesPackets = action.type === "tick" || action.type === "toggle-link";
  const state = { ...previous, packets: updatesPackets
    ? previous.packets.map((packet) => packet.status === "in-flight" ? { ...packet } : packet)
    : previous.packets.slice() };
  switch (action.type) {
    case "set-running":
      state.running = action.running;
      if (state.running && state.nextPacketAt <= state.now) {
        spawn(state);
        state.nextPacketAt = state.now + PACKET_INTERVAL;
      }
      break;
    case "toggle-link":
      state.linkBroken = !state.linkBroken;
      if (state.linkBroken) {
        // Only the first hop breaks. Packets past Router A finish their path.
        for (const packet of state.packets) {
          if (packet.status === "in-flight" && packet.route === "a" && packet.progress < 0.5) {
            packet.status = "dropped";
            packet.finishedAt = state.now;
          }
        }
      }
      break;
    case "toggle-policy":
      state.policyBlocked = !state.policyBlocked;
      break;
    case "select-packet": {
      if (action.id === "latest") {
        // Static samples keep inspection useful without playback, including
        // for reduced-motion visitors. The UI explicitly labels these samples.
        const completed = state.packets.filter((packet) => !packet.sample && packet.finishedAt !== null)
          .sort((a, b) => b.finishedAt! - a.finishedAt! || b.id - a.id);
        const packet = state.running
          ? completed[0] ?? state.packets.find((item) => item.status === "in-flight") ?? spawn(state, true)
          : spawn(state, true);
        state.selectedPacketId = packet.id;
      } else {
        if (action.id !== null && !state.packets.some((packet) => packet.id === action.id)) return previous;
        state.selectedPacketId = action.id;
      }
      break;
    }
    case "tick": {
      const target = state.now + Math.min(action.ms, 100);
      // Split at arrivals/emissions to keep outcomes independent of frame rate.
      while (state.now < target - 0.000001) {
        let nextEvent = Math.min(target, state.nextPacketAt);
        for (const packet of state.packets) {
          if (packet.status === "in-flight") nextEvent = Math.min(nextEvent, packet.startedAt + JOURNEY_MS);
        }
        state.now = nextEvent;
        for (const packet of state.packets) {
          if (packet.status !== "in-flight") continue;
          packet.progress = Math.min(1, (state.now - packet.startedAt) / JOURNEY_MS);
          if (packet.progress >= 1 - 0.000001) {
            packet.progress = 1;
            packet.status = state.policyBlocked ? "blocked" : "delivered";
            packet.finishedAt = state.now;
          }
        }
        if (state.now >= state.nextPacketAt - 0.000001) {
          spawn(state);
          state.nextPacketAt = state.now + PACKET_INTERVAL;
        }
      }
      break;
    }
  }
  prune(state);
  return state;
}

export function nodePosition(id: NodeId, compact = false): Point {
  const positions = compact ? {
    source: { x: 185, y: 42 }, "router-a": { x: 82, y: 170 },
    "router-b": { x: 288, y: 170 }, destination: { x: 185, y: 308 },
  } : {
    source: { x: 58, y: 178 }, "router-a": { x: 310, y: 76 },
    "router-b": { x: 310, y: 280 }, destination: { x: 562, y: 178 },
  };
  return positions[id];
}
type Curve = [Point, Point, Point, Point];
function routeCurves(route: RouteId, compact: boolean): [Curve, Curve] {
  const source = nodePosition("source", compact);
  const router = nodePosition(route === "a" ? "router-a" : "router-b", compact);
  const destination = nodePosition("destination", compact);
  if (compact) return [
    [{ x: source.x, y: source.y + 22 }, { x: source.x, y: 112 }, { x: router.x, y: 112 }, router],
    [router, { x: router.x, y: 240 }, { x: destination.x, y: 240 }, { x: destination.x, y: destination.y - 27 }],
  ];
  return [
    [{ x: source.x + 22, y: source.y }, { x: 182, y: source.y }, { x: 182, y: router.y }, router],
    [router, { x: 438, y: router.y }, { x: 438, y: destination.y }, { x: destination.x - 27, y: destination.y }],
  ];
}
function onCurve([a, b, c, d]: Curve, t: number): Point {
  const u = 1 - t;
  return {
    x: u ** 3 * a.x + 3 * u ** 2 * t * b.x + 3 * u * t ** 2 * c.x + t ** 3 * d.x,
    y: u ** 3 * a.y + 3 * u ** 2 * t * b.y + 3 * u * t ** 2 * c.y + t ** 3 * d.y,
  };
}
export function routePath(route: RouteId, half: 0 | 1, compact = false) {
  const [a, b, c, d] = routeCurves(route, compact)[half];
  return `M${a.x} ${a.y}C${b.x} ${b.y} ${c.x} ${c.y} ${d.x} ${d.y}`;
}
// The renderer and packets share these curves. Cached arc-length samples keep
// motion steady and switch directly to the new geometry on responsive resize.
const paths = new Map<string, { point: Point; distance: number }[]>();
for (const compact of [false, true]) {
  for (const route of ["a", "b"] as const) {
    routeCurves(route, compact).forEach((curve, half) => {
      const points = Array.from({ length: 81 }, (_, index) => onCurve(curve, index / 80));
      let distance = 0;
      paths.set(`${compact}-${route}-${half}`, points.map((point, index) => {
        if (index) distance += Math.hypot(point.x - points[index - 1].x, point.y - points[index - 1].y);
        return { point, distance };
      }));
    });
  }
}
export function packetPoint(packet: Pick<DemoPacket, "route" | "progress">, compact = false): Point {
  const progress = Number.isFinite(packet.progress) ? Math.max(0, Math.min(1, packet.progress)) : 0;
  const half = progress < 0.5 ? 0 : 1;
  const points = paths.get(`${compact}-${packet.route}-${half}`)!;
  const target = (progress * 2 - half) * points[points.length - 1].distance;
  let low = 1, high = points.length - 1;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (points[middle].distance < target) low = middle + 1;
    else high = middle;
  }
  const next = points[low], previous = points[low - 1];
  const t = (target - previous.distance) / (next.distance - previous.distance);
  return { x: previous.point.x + (next.point.x - previous.point.x) * t, y: previous.point.y + (next.point.y - previous.point.y) * t };
}
