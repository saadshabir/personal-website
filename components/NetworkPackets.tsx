"use client";

import { memo, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import { FADE_MS, packetPoint, type LabState } from "@/lib/network-demo";

type Props = {
  model: RefObject<LabState>;
  paint: RefObject<(state: LabState) => void>;
  compact: boolean;
  reducedMotion: boolean;
  onSelect: (id: number) => void;
};
const POOL_SIZE = 8;

const NetworkPackets = memo(function NetworkPackets({ model, paint, compact, reducedMotion, onSelect }: Props) {
  const slots = useRef<(SVGGElement | null)[]>([]);
  useLayoutEffect(() => {
    const drawn = slots.current.map((element) => ({
      element, visible: null as boolean | null, id: 0, route: "", progress: -1,
      opacity: "", className: "",
    }));
    const draw = (state: LabState) => {
      const visible = reducedMotion ? [] : state.packets.filter((packet) => !packet.sample
        && (packet.finishedAt === null || state.now - packet.finishedAt < FADE_MS));
      for (let index = 0; index < POOL_SIZE; index++) {
        const slot = drawn[index];
        const element = slot?.element;
        if (!element) continue;
        const packet = visible[index];
        if (slot.visible !== !!packet) {
          element.style.visibility = packet ? "visible" : "hidden";
          slot.visible = !!packet;
        }
        if (!packet) continue;
        if (slot.route !== packet.route || slot.progress !== packet.progress) {
          const point = packetPoint(packet, compact);
          const tail = packetPoint({ route: packet.route, progress: Math.max(0, packet.progress - 0.025) }, compact);
          element.setAttribute("transform", `translate(${point.x} ${point.y})`);
          element.firstElementChild?.setAttribute("d", `M${tail.x - point.x} ${tail.y - point.y}L0 0`);
          slot.route = packet.route;
          slot.progress = packet.progress;
        }
        const opacity = String(packet.finishedAt === null ? 1 : Math.max(0, 1 - (state.now - packet.finishedAt) / FADE_MS));
        if (slot.opacity !== opacity) {
          element.style.opacity = opacity;
          slot.opacity = opacity;
        }
        if (slot.id !== packet.id) {
          element.setAttribute("data-packet-id", String(packet.id));
          slot.id = packet.id;
        }
        const className = `network-packet is-${packet.status}${packet.id === state.selectedPacketId ? " is-selected" : ""}`;
        if (slot.className !== className) {
          element.setAttribute("class", className);
          slot.className = className;
        }
      }
    };
    paint.current = draw;
    draw(model.current);
    return () => { paint.current = () => {}; };
  }, [compact, reducedMotion, model, paint]);

  return (
    <g className="network-packets" aria-hidden="true">
      {Array.from({ length: POOL_SIZE }, (_, index) => (
        <g key={index} ref={(element) => { slots.current[index] = element; }}
          className="network-packet" style={{ visibility: "hidden" }}
          onClick={() => {
            const id = Number(slots.current[index]?.getAttribute("data-packet-id"));
            if (id > 0) onSelect(id);
          }}>
          <path className="packet-tail" />
          <circle className="packet-hit-area" r="18" />
          <circle className="packet-ring" r="10" />
          <circle className="packet-dot" r="4.5" />
        </g>
      ))}
    </g>
  );
});
export default NetworkPackets;
