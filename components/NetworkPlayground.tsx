"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import { DEMO_LINKS, DEMO_NODES, findDemoRoute, type DemoNodeId } from "@/lib/network-demo";

const nodesById = Object.fromEntries(DEMO_NODES.map((node) => [node.id, node])) as Record<DemoNodeId, (typeof DEMO_NODES)[number]>;
const getNode = (id: DemoNodeId) => nodesById[id];
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
type NetworkStyle = CSSProperties & { [key: `--${string}`]: string };

function pathStyle(ids: readonly DemoNodeId[]): NetworkStyle {
  return {
    "--wide-path": `path("${getPath(ids)}")`,
    "--compact-path": `path("${getPath(ids, true)}")`,
  };
}

function positionStyle(wide: { x: number; y: number }, compact: { x: number; y: number }): NetworkStyle {
  return {
    "--wide-position": `translate(${wide.x}px, ${wide.y}px)`,
    "--compact-position": `translate(${compact.x}px, ${compact.y}px)`,
  };
}

// Geometry is static; only route and availability change during interaction.
const nodes = DEMO_NODES.map((node) => ({
  ...node,
  style: positionStyle(node, COMPACT_POSITIONS[node.id]),
}));
const links = DEMO_LINKS.map((link) => {
  const from = getNode(link.from);
  const to = getNode(link.to);
  const compactFrom = COMPACT_POSITIONS[link.from];
  const compactTo = COMPACT_POSITIONS[link.to];
  return {
    ...link,
    label: `${from.label} to ${to.label}`,
    style: pathStyle([link.from, link.to]),
    crossStyle: positionStyle(
      { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 },
      { x: (compactFrom.x + compactTo.x) / 2, y: (compactFrom.y + compactTo.y) / 2 },
    ),
  };
});

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
  const routeKey = route.join(",");
  const routeStyle = useMemo((): NetworkStyle => {
    const roundTrip = [...route, ...route.slice(0, -1).reverse()];
    return {
      ...pathStyle(route),
      "--wide-request-path": `path("${getPath(roundTrip)}")`,
      "--compact-request-path": `path("${getPath(roundTrip, true)}")`,
      "--request-duration": `${REQUEST_DURATION_MS}ms`,
    };
  }, [route]);
  const serviceLabel = route.find((id) => getNode(id).kind === "service");
  const via = serviceLabel ? getNode(serviceLabel).label : "a service";
  const infoNode = hoveredNode ?? focusedNode;
  const nodeInfo = infoNode ? getNode(infoNode) : null;
  const inFlight = requestId !== null && route.length > 0;

  useEffect(() => {
    if (requestId === null) return;
    if (!routeKey) {
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
  }, [requestId, routeKey, via, reducedMotion]);

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
    const description = describeRoute(next, pausedServices);
    setNotice(description);
    const link = links.find((item) => item.id === id)!;
    setAnnouncement(`${link.label} ${next.includes(id) ? "disconnected" : "restored"}. ${description}`);
  }

  function toggleService(id: DemoNodeId) {
    const next = pausedServices.includes(id)
      ? pausedServices.filter((service) => service !== id)
      : [...pausedServices, id];
    setPausedServices(next);
    const description = `${getNode(id).label} ${next.includes(id) ? "paused" : "restarted"}. ${describeRoute(disabledLinks, next)}`;
    setNotice(description);
    setAnnouncement(description);
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

  return (
    <div className="network-visual">
      <div className="network-canvas">
        <svg
          className={`network-svg${inFlight ? " has-request" : ""}`}
          // CSS selects the geometry and viewport ratio without a resize listener
          // or a second, hidden graph. Slice keeps SVG units uniform in both layouts.
          viewBox="0 0 640 410"
          preserveAspectRatio="xMinYMin slice"
          style={routeStyle}
          role="group"
          aria-labelledby="network-title"
          aria-describedby="network-description network-instructions"
          onKeyDown={(event) => {
            if (event.key === "Escape") { setHoveredNode(null); setFocusedNode(null); }
          }}
        >
          <title id="network-title">A small resilient service network</title>
          <desc id="network-description">Click Client to send a request. Click connections to disconnect or restore them. Click API A or API B to pause or restart a service. Requests use an available service and return to the client. Hover or focus a node to learn what it does. This is an illustrative simulation.</desc>
          <defs>
            <linearGradient id="route-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#94abc9" />
              <stop offset="45%" stopColor="#9fc2bc" />
              <stop offset="100%" stopColor="#b09bc6" />
            </linearGradient>
          </defs>

          {links.map((link) => {
            const disabled = disabledLinks.includes(link.id);
            const unavailable = pausedServices.includes(link.from) || pausedServices.includes(link.to);
            return (
              <g
                key={link.id}
                className={`network-link${disabled ? " is-disconnected" : ""}${unavailable ? " is-unavailable" : ""}`}
                style={link.style}
                role="button"
                tabIndex={0}
                aria-label={`${disabled ? "Restore" : "Disconnect"} link ${link.label}`}
                aria-pressed={disabled}
                onClick={() => toggleLink(link.id)}
                onKeyDown={(event) => activateWithKeyboard(event, () => toggleLink(link.id))}
              >
                <path className="link-hit-area" />
                <path className="link-line" />
                {disabled && <text className="link-cross network-position" style={link.crossStyle} y="6" textAnchor="middle" aria-hidden="true">×</text>}
              </g>
            );
          })}

          {route.length > 0 && <path className="route-glow" stroke="url(#route-gradient)" />}
          {route.length > 0 && <path className="route-line" stroke="url(#route-gradient)" />}
          {inFlight && !reducedMotion && (
            <circle key={`${requestId}:${routeKey}`} r="5" className="network-packet" />
          )}

          {nodes.map((node) => {
            const isService = node.kind === "service";
            const paused = pausedServices.includes(node.id);
            const action = node.kind === "client" ? sendRequest : isService ? () => toggleService(node.id) : undefined;
            const label = node.kind === "client" ? "Send a request from Client" : isService ? `${paused ? "Restart" : "Pause"} ${node.label} service` : `${node.label}. ${node.description}`;
            return (
              <g
                key={node.id}
                className={`network-node network-position ${node.kind}${action ? " is-interactive" : ""}${node.kind === "client" || node.kind === "database" ? " endpoint" : ""}${route.includes(node.id) ? " on-route" : ""}${paused ? " is-paused" : ""}${inFlight && node.kind === "client" ? " is-sending" : ""}`}
                style={node.style}
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
                <text y="47" textAnchor="middle" className="node-label" aria-hidden="true">{node.label}</text>
              </g>
            );
          })}
        </svg>
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
