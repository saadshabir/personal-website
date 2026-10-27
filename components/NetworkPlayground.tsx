"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { DEMO_LINKS, DEMO_NODES, findDemoRoute, type DemoNodeId } from "@/lib/network-demo";

const getNode = (id: DemoNodeId) => DEMO_NODES.find((node) => node.id === id)!;
const COMPACT_POSITIONS: Record<DemoNodeId, { x: number; y: number }> = {
  client: { x: 185, y: 48 },
  gateway: { x: 185, y: 138 },
  "api-a": { x: 85, y: 248 },
  "api-b": { x: 285, y: 248 },
  database: { x: 185, y: 358 },
};
const getPosition = (id: DemoNodeId, compact = false) => compact ? COMPACT_POSITIONS[id] : getNode(id);
const getPath = (ids: readonly DemoNodeId[], compact = false) => ids.map((id, index) => {
  const node = getPosition(id, compact);
  return `${index ? "L" : "M"} ${node.x} ${node.y}`;
}).join(" ");
const REQUEST_DURATION_MS = 2200;

function RequestPacket({ path }: { path: string }) {
  const motion = useRef<SVGAnimateMotionElement>(null);
  useEffect(() => { motion.current?.beginElement(); }, [path]);
  return (
    <circle r="5" className="network-packet">
      <animateMotion ref={motion} path={path} dur={`${REQUEST_DURATION_MS}ms`} begin="indefinite" fill="freeze" />
    </circle>
  );
}

function activateWithKeyboard(event: KeyboardEvent<SVGGElement>, action: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
}

export default function NetworkPlayground() {
  const [disabledLinks, setDisabledLinks] = useState<string[]>([]);
  const [pausedServices, setPausedServices] = useState<DemoNodeId[]>([]);
  const [requestId, setRequestId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [hoveredNode, setHoveredNode] = useState<DemoNodeId | null>(null);
  const [focusedNode, setFocusedNode] = useState<DemoNodeId | null>(null);
  const [reducedMotion, setReducedMotion] = useState(true);
  const requestSequence = useRef(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const route = useMemo(() => findDemoRoute(disabledLinks, pausedServices), [disabledLinks, pausedServices]);
  const routePath = getPath(route);
  const serviceLabel = route.find((id) => getNode(id).kind === "service");
  const via = serviceLabel ? getNode(serviceLabel).label : "a service";
  const infoNode = hoveredNode ?? focusedNode;
  const nodeInfo = infoNode ? getNode(infoNode) : null;
  const inFlight = requestId !== null && route.length > 0;

  useEffect(() => {
    if (requestId === null) return;
    if (!routePath) {
      setRequestId(null);
      setNotice("No route available.");
      setAnnouncement("Request stopped. No route available. Restore a connection or service.");
      return;
    }
    setAnnouncement(`Request sent through ${via}.`);
    const timer = window.setTimeout(() => {
      setRequestId(null);
      setNotice(`Request returned through ${via}.`);
      setAnnouncement(`Request delivered to the database and returned through ${via}.`);
    }, reducedMotion ? 300 : REQUEST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [requestId, routePath, via, reducedMotion]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function describeRoute(links: readonly string[], services: readonly DemoNodeId[]) {
    const next = findDemoRoute(links, services);
    const service = next.find((id) => getNode(id).kind === "service");
    return service ? `Requests use ${getNode(service).label}.` : "No route available.";
  }

  function toggleLink(id: string) {
    const next = disabledLinks.includes(id)
      ? disabledLinks.filter((link) => link !== id)
      : [...disabledLinks, id];
    setDisabledLinks(next);
    setNotice(describeRoute(next, pausedServices));
    const link = DEMO_LINKS.find((item) => item.id === id)!;
    setAnnouncement(`${getNode(link.from).label} to ${getNode(link.to).label} ${next.includes(id) ? "disconnected" : "restored"}. ${describeRoute(next, pausedServices)}`);
  }

  function toggleService(id: DemoNodeId) {
    const next = pausedServices.includes(id)
      ? pausedServices.filter((service) => service !== id)
      : [...pausedServices, id];
    setPausedServices(next);
    setNotice(`${getNode(id).label} ${next.includes(id) ? "paused" : "restarted"}. ${describeRoute(disabledLinks, next)}`);
    setAnnouncement(`${getNode(id).label} ${next.includes(id) ? "paused" : "restarted"}. ${describeRoute(disabledLinks, next)}`);
  }

  function sendRequest() {
    setNotice("");
    if (!route.length) {
      setNotice("No route available.");
      setAnnouncement("Request could not be sent. Restore a connection or service.");
      return;
    }
    setRequestId(++requestSequence.current);
  }

  function reset() {
    setDisabledLinks([]);
    setPausedServices([]);
    setRequestId(null);
    setNotice("");
    setHoveredNode(null);
    setFocusedNode(null);
    setAnnouncement("Network reset. All connections and services are available.");
  }

  function renderNetwork(layout: "wide" | "compact") {
    const compact = layout === "compact";
    const displayPath = getPath(route, compact);
    const displayRequestPath = getPath([...route, ...route.slice(0, -1).reverse()], compact);
    return (
      <svg
        className={`network-svg network-svg-${layout}${inFlight ? " has-request" : ""}`}
        viewBox={compact ? "0 0 370 410" : "0 0 640 390"}
        role="group"
        aria-labelledby={`network-title-${layout}`}
        aria-describedby={`network-description-${layout} network-instructions`}
        onKeyDown={(event) => {
          if (event.key === "Escape") { setHoveredNode(null); setFocusedNode(null); }
        }}
      >
        <title id={`network-title-${layout}`}>A small resilient service network</title>
        <desc id={`network-description-${layout}`}>Click Client to send a request. Click connections to disconnect or restore them. Click API A or API B to pause or restart a service. Requests use an available service and return to the client. Hover or focus a node to learn what it does. This is an illustrative simulation.</desc>
        <defs>
          <linearGradient id={`route-gradient-${layout}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#94abc9" />
            <stop offset="45%" stopColor="#9fc2bc" />
            <stop offset="100%" stopColor="#b09bc6" />
          </linearGradient>
        </defs>

        {DEMO_LINKS.map((link) => {
          const from = { ...getNode(link.from), ...getPosition(link.from, compact) };
          const to = { ...getNode(link.to), ...getPosition(link.to, compact) };
          const disabled = disabledLinks.includes(link.id);
          const unavailable = pausedServices.includes(link.from) || pausedServices.includes(link.to);
          return (
            <g
              key={link.id}
              className={`network-link${disabled ? " is-disconnected" : ""}${unavailable ? " is-unavailable" : ""}`}
              role="button"
              tabIndex={0}
              aria-label={`${disabled ? "Restore" : "Disconnect"} link ${from.label} to ${to.label}`}
              aria-pressed={disabled}
              onClick={() => toggleLink(link.id)}
              onKeyDown={(event) => activateWithKeyboard(event, () => toggleLink(link.id))}
            >
              <line className="link-hit-area" x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
              <line className="link-line" x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
              {disabled && <text className="link-cross" x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 + 6} textAnchor="middle" aria-hidden="true">×</text>}
            </g>
          );
        })}

        {displayPath && <path className="route-glow" d={displayPath} stroke={`url(#route-gradient-${layout})`} />}
        {displayPath && <path className="route-line" d={displayPath} stroke={`url(#route-gradient-${layout})`} />}
        {inFlight && !reducedMotion && (
          <RequestPacket key={requestId} path={displayRequestPath} />
        )}

        {DEMO_NODES.map((node) => {
          const position = getPosition(node.id, compact);
          const sideLabel = compact && node.kind !== "service";
          const isService = node.kind === "service";
          const paused = pausedServices.includes(node.id);
          const action = node.kind === "client" ? sendRequest : isService ? () => toggleService(node.id) : undefined;
          const label = node.kind === "client" ? "Send a request from Client" : isService ? `${paused ? "Restart" : "Pause"} ${node.label} service` : `${node.label}. ${node.description}`;
          return (
            <g
              key={node.id}
              className={`network-node${action ? " is-interactive" : ""}${node.kind === "client" || node.kind === "database" ? " endpoint" : ""}${route.includes(node.id) ? " on-route" : ""}${paused ? " is-paused" : ""}${inFlight && node.kind === "client" ? " is-sending" : ""}`}
              transform={`translate(${position.x}, ${position.y})`}
              role={action ? "button" : "img"}
              tabIndex={0}
              aria-label={label}
              aria-pressed={isService ? paused : undefined}
              aria-describedby={infoNode === node.id ? "network-tooltip" : undefined}
              onClick={action}
              onKeyDown={action ? (event) => activateWithKeyboard(event, action) : undefined}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onFocus={() => { setFocusedNode(node.id); setHoveredNode(null); }}
              onBlur={() => setFocusedNode(null)}
            >
              <circle className="node-hit-area" r="22" />
              <circle className="node-halo" r="28" />
              <circle className="node-body" r="18" />
              {node.kind === "client" ? (
                <>
                  <rect x="-8" y="-6" width="16" height="10" rx="1.5" className="endpoint-icon" />
                  <path d="M 0 4 V 8 M -5 8 H 5" className="endpoint-icon" />
                </>
              ) : node.kind === "database" ? (
                <>
                  <ellipse className="endpoint-icon" cy="-5" rx="7" ry="3" />
                  <path className="endpoint-icon" d="M -7 -5 V 5 C -7 9 7 9 7 5 V -5 M -7 0 C -7 4 7 4 7 0" />
                </>
              ) : paused ? <path className="node-pause" d="M -4 -5 V 5 M 4 -5 V 5" /> : <circle className="node-center" r="4" />}
              <text x={sideLabel ? 35 : 0} y={sideLabel ? 6 : 47} textAnchor={sideLabel ? "start" : "middle"} className="node-label" aria-hidden="true">{node.label}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  return (
    <div className="network-visual">
      <div className="network-canvas">
        {renderNetwork("wide")}
        {renderNetwork("compact")}
        {nodeInfo && (
          <div id="network-tooltip" className="network-tooltip" role="tooltip">
            <span>{nodeInfo.label}</span>
            <p>{nodeInfo.kind === "service" ? pausedServices.includes(nodeInfo.id) ? "Paused. Click to restart." : "Handles requests. Click to pause." : nodeInfo.description}</p>
          </div>
        )}
        <p className="network-notice" aria-hidden="true">{notice}</p>
      </div>
      <div className="network-caption">
        <p id="network-instructions">Click Client to send a request. Break a link or pause a service.</p>
        <button type="button" onClick={reset}>Reset</button>
      </div>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
      <noscript>Enable JavaScript to send requests and change the network.</noscript>
    </div>
  );
}
