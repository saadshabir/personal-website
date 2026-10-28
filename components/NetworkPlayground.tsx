"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  DEMO_NODES, activeRoute, inspectedPacket, networkMessage, nodePosition,
  packetPoint, packetStatus, routePath,
} from "@/lib/network-demo";
import NetworkPackets from "@/components/NetworkPackets";
import { useNetworkLab } from "@/components/useNetworkLab";

function ControlIcon({ kind }: { kind: "link" | "policy" | "pause" | "play" | "reset" | "close" }) {
  return <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "link" && <><path d="m8 12 4-4M6 13l-1 1a3 3 0 0 1-4-4l3-3a3 3 0 0 1 4 0M12 7l1-1a3 3 0 0 1 4 4l-3 3a3 3 0 0 1-4 0" transform="translate(1 0)" /></>}
    {kind === "policy" && <path d="m10 2 6 2.5V9c0 4-2.5 6.5-6 9-3.5-2.5-6-5-6-9V4.5ZM7 10h6" />}
    {kind === "pause" && <path d="M7 5v10M13 5v10" />}
    {kind === "play" && <path d="m7 4 9 6-9 6Z" />}
    {kind === "reset" && <><path d="M4 7a6 6 0 1 1 0 6M4 3v4h4" /></>}
    {kind === "close" && <path d="m5 5 10 10M15 5 5 15" />}
  </svg>;
}

export default function NetworkPlayground({ children }: { children: ReactNode }) {
  const { state, model, paint, dispatch, reducedMotion } = useNetworkLab();
  const [compact, setCompact] = useState(false);
  const prefix = useId();
  const inspectorRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const inspectRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<Element | null>(null);
  const selected = inspectedPacket(state);
  const isInspecting = !!selected;
  const route = activeRoute(state);

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 480px)");
    const update = () => setCompact(narrow.matches);
    update();
    narrow.addEventListener("change", update);
    return () => narrow.removeEventListener("change", update);
  }, []);

  const selectPacket = useCallback((id: number | "latest") => {
    returnFocus.current = document.activeElement;
    dispatch({ type: "select-packet", id });
  }, [dispatch]);

  const closeInspector = useCallback((restoreFocus = true) => {
    dispatch({ type: "select-packet", id: null });
    if (restoreFocus) {
      const target = returnFocus.current;
      if (target instanceof HTMLElement && target !== document.body && target.isConnected) target.focus();
      else inspectRef.current?.focus();
    }
  }, [dispatch]);

  useEffect(() => {
    if (!isInspecting) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeInspector(); }
    };
    const onOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !inspectorRef.current?.contains(event.target)
        && !inspectRef.current?.contains(event.target)) closeInspector(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onOutside);
    };
  }, [isInspecting, closeInspector]);

  const breakPoint = packetPoint({ route: "a", progress: 0.24 }, compact);

  return (
    <>
      <div className="hero-copy">
        {children}
        <p className="network-caption">Change the network.<br />See what happens to the traffic.</p>
      </div>
      <div className="network-visual">
        <div className="network-canvas">
          <svg className="network-svg" viewBox={compact ? "0 0 370 370" : "0 0 620 370"}
            role="group" aria-labelledby={prefix + "-title"} aria-describedby={prefix + "-description"}>
            <title id={prefix + "-title"}>An interactive network</title>
            <desc id={prefix + "-description"}>Traffic travels from Source through Router A or Router B to Destination. Break the primary link to use the backup route, or block traffic at the destination. Use Inspect a packet for keyboard-accessible packet details.</desc>
            {(["a", "b"] as const).map((id) => ([0, 1] as const).map((half) => {
              const broken = id === "a" && half === 0 && state.linkBroken;
              const selectedPath = selected?.route === id;
              return <g key={id + half} className={`network-link${route === id ? " is-active" : ""}${broken ? " is-broken" : ""}${selectedPath ? " is-inspected" : ""}`}>
                <path className="route-underlay" d={routePath(id, half, compact)} />
                <path className="route-line" d={routePath(id, half, compact)} />
              </g>;
            }))}
            {state.linkBroken && <g className="link-break" transform={`translate(${breakPoint.x} ${breakPoint.y})`} aria-hidden="true">
              <circle r="10" /><path d="m-3-3 6 6m0-6-6 6" />
            </g>}
            <NetworkPackets model={model} paint={paint} compact={compact} reducedMotion={reducedMotion} onSelect={selectPacket} />
            {DEMO_NODES.map((node) => {
              const point = nodePosition(node.id, compact);
              const endpoint = node.id === "source" || node.id === "destination";
              const blocked = node.id === "destination" && state.policyBlocked;
              const active = endpoint || node.id === (route === "a" ? "router-a" : "router-b");
              const labelX = compact ? endpoint ? 36 : node.id === "router-a" ? -26 : 26 : 0;
              const labelAnchor = compact ? node.id === "router-a" ? "end" : "start" : "middle";
              return <g key={node.id} transform={`translate(${point.x} ${point.y})`}
                className={`network-node${endpoint ? " endpoint" : ""}${active ? " is-active" : ""}${blocked ? " is-blocked" : ""}`} aria-hidden="true">
                <circle className="node-halo" r="28" />
                {blocked && <circle className="policy-ring" r="27" />}
                <circle className="node-body" r={endpoint ? 21 : 18} />
                {node.id === "source" ? <g className="node-icon">
                  <rect x="-8" y="-6" width="16" height="11" rx="2" /><path d="M-4 9h8M0 5v4" />
                </g> : node.id === "destination" ? <g className="node-icon">
                  {blocked ? <><rect x="-6" y="-1" width="12" height="9" rx="2" /><path d="M-4-1v-3a4 4 0 0 1 8 0v3" /></>
                    : <><rect x="-8" y="-8" width="16" height="16" rx="3" /><path d="M-4-3h8M-4 3h8" /></>}
                </g> : <path className="node-icon" d="M-8-4H6m-3-3 3 3-3 3M8 4H-6m3-3-3 3 3 3" />}
                <text className="node-label" x={labelX} y={compact ? 5 : 47} textAnchor={labelAnchor}>{node.label}</text>
              </g>;
            })}
          </svg>
          {selected && <div className="packet-inspector" ref={inspectorRef} role="dialog" aria-modal="false"
            aria-labelledby={prefix + "-packet-title"} id={prefix + "-inspector"}>
            <div className="packet-heading">
              <span id={prefix + "-packet-title"}>{selected.sample ? "Sample packet" : `Packet ${String(selected.id).padStart(3, "0")}`}</span>
              <button ref={closeRef} type="button" onClick={() => closeInspector()} aria-label="Close packet details"><ControlIcon kind="close" /></button>
            </div>
            <dl>
              <div><dt>Route</dt><dd>Source → Router {selected.route.toUpperCase()}<br />→ Destination</dd></div>
              <div><dt>Protocol</dt><dd>TCP · port 443</dd></div>
              <div><dt>Outcome</dt><dd data-status={selected.status}>{packetStatus(selected)}</dd></div>
            </dl>
          </div>}
        </div>
        <div className="network-controls">
          <div className="network-actions">
            <button type="button" className="network-action link-action" aria-pressed={state.linkBroken} onClick={() => dispatch({ type: "toggle-link" })}>
              <ControlIcon kind="link" />{state.linkBroken ? "Restore link" : "Break a link"}
            </button>
            <button type="button" className="network-action policy-action" aria-pressed={state.policyBlocked} onClick={() => dispatch({ type: "toggle-policy" })}>
              <ControlIcon kind="policy" />{state.policyBlocked ? "Allow traffic" : "Block traffic"}
            </button>
          </div>
          <div className="network-utilities">
            {!reducedMotion && <button type="button" className="network-icon-button" aria-label={state.running ? "Pause traffic" : "Resume traffic"} title={state.running ? "Pause traffic" : "Resume traffic"}
              onClick={() => dispatch({ type: "set-running", running: !state.running })}><ControlIcon kind={state.running ? "pause" : "play"} /></button>}
            <button type="button" className="network-icon-button" aria-label="Reset network" title="Reset network" onClick={() => dispatch({ type: "reset" })}><ControlIcon kind="reset" /></button>
          </div>
        </div>
        <p className="network-result" role="status" aria-live="polite" aria-atomic="true">
          <span className={`result-dot${state.policyBlocked ? " is-blocked" : state.linkBroken ? " is-rerouted" : ""}`} aria-hidden="true" />
          <span>{!state.running && !reducedMotion ? "Paused. " : ""}{networkMessage(state)}</span>
        </p>
        <div className="network-footnote">
          <span>Illustrative simulation</span>
          <button type="button" ref={inspectRef} aria-expanded={isInspecting} aria-controls={prefix + "-inspector"}
            onClick={() => isInspecting ? closeInspector() : selectPacket("latest")}>
            Inspect a packet <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </>
  );
}
