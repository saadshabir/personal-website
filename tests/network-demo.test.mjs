import assert from "node:assert/strict";
import test from "node:test";
import {
  activeRoute, createLabState, FADE_MS, HISTORY_SIZE, inspectedPacket, JOURNEY_MS,
  labReducer, networkMessage, nodePosition, packetPoint,
} from "../lib/network-demo.ts";

const act = (state, type, values = {}) => labReducer(state, { type, ...values });
const start = () => act(createLabState(), "set-running", { running: true });
function advance(initial, ms, frame = 50) {
  let state = initial;
  for (let elapsed = 0; elapsed < ms - 0.000001; elapsed += frame) {
    state = act(state, "tick", { ms: Math.min(frame, ms - elapsed) });
  }
  return state;
}

test("normal packets take the primary route and arrive at the destination", () => {
  const state = advance(start(), 7000);
  assert.equal(activeRoute(state), "a");
  assert.ok(state.packets.filter((packet) => packet.status === "delivered").length >= 3);
  assert.ok(state.packets.every((packet) => packet.route === "a"));
  assert.ok(state.packets.every((packet) => ["in-flight", "delivered"].includes(packet.status)));
});

test("breaking a link drops traffic on that hop without teleporting; new traffic uses the backup", () => {
  let state = advance(start(), 600);
  const before = state.packets[0];
  const positions = [false, true].map((compact) => packetPoint(before, compact));
  state = act(state, "toggle-link");
  assert.equal(state.packets[0].status, "dropped");
  assert.deepEqual([false, true].map((compact) => packetPoint(state.packets[0], compact)), positions);
  state = advance(state, 4500);
  assert.ok(state.packets.some((packet) => packet.route === "b" && packet.status === "delivered"));
  assert.equal(state.packets.find((packet) => packet.id === before.id).status, "dropped");
  assert.match(networkMessage(state), /still reachable/);
});

test("a packet that has passed the broken hop finishes on its original route", () => {
  let state = advance(start(), 1800);
  assert.ok(state.packets[0].progress > 0.5);
  state = act(state, "toggle-link");
  assert.equal(state.packets[0].status, "in-flight");
  state = advance(state, 1500);
  assert.equal(state.packets[0].route, "a");
  assert.equal(state.packets[0].status, "delivered");
});

test("restoration uses the primary for new packets while backup packets keep their paths", () => {
  let state = advance(act(start(), "toggle-link"), 1800);
  const inFlight = state.packets.find((packet) => packet.route === "b");
  const point = packetPoint(inFlight);
  state = act(state, "toggle-link");
  assert.deepEqual(packetPoint(state.packets.find((packet) => packet.id === inFlight.id)), point);
  state = advance(state, 5000);
  assert.ok(state.packets.some((packet) => packet.route === "b" && packet.status === "delivered"));
  assert.ok(state.packets.some((packet) => packet.route === "a" && packet.status === "delivered"));
});

test("destination policy blocks both routes, including when routing and policy change together", () => {
  for (const broken of [false, true]) {
    let state = act(start(), "toggle-policy");
    if (broken) state = act(state, "toggle-link");
    state = advance(state, 10000);
    const completed = state.packets.filter((packet) => packet.finishedAt !== null);
    assert.ok(completed.length >= 3);
    assert.ok(completed.every((packet) => packet.status === "blocked"));
    assert.ok(completed.every((packet) => packet.progress === 1));
    assert.match(networkMessage(state), /block/);
  }
});

test("policy is evaluated at arrival and never rewrites a completed packet's outcome", () => {
  let state = advance(start(), JOURNEY_MS - 100);
  state = act(state, "toggle-policy");
  state = advance(state, 100);
  assert.equal(state.packets[0].status, "blocked");
  state = act(state, "toggle-policy");
  state = advance(state, 1400);
  assert.equal(state.packets[0].status, "blocked");
  assert.ok(state.packets.some((packet) => packet.status === "delivered"));
});

test("pause freezes traffic and the fade clock; reset clears faults without changing pause preference", () => {
  let state = act(advance(start(), 700), "toggle-link");
  state = act(state, "set-running", { running: false });
  assert.equal(advance(state, 6000), state);
  state = act(state, "reset");
  assert.deepEqual(state, createLabState());
  state = advance(act(state, "set-running", { running: true }), 5000);
  const reset = act(state, "reset");
  assert.equal(reset.running, true);
  assert.equal(reset.packets.length, 0);
  assert.equal(reset.linkBroken, false);
  assert.ok(advance(reset, 4000).packets.some((packet) => packet.status === "delivered"));
});

test("inspection works without playback and samples the current route and policy", () => {
  let state = act(createLabState(), "toggle-link");
  state = act(state, "toggle-policy");
  state = act(state, "select-packet", { id: "latest" });
  assert.equal(state.running, false);
  assert.equal(inspectedPacket(state).sample, true);
  assert.equal(inspectedPacket(state).route, "b");
  assert.equal(inspectedPacket(state).status, "blocked");
  state = act(state, "toggle-policy");
  assert.equal(inspectedPacket(state).status, "blocked");
  state = act(state, "select-packet", { id: "latest" });
  assert.equal(inspectedPacket(state).status, "delivered");
});

test("inspection pins one packet, history stays bounded, and closing releases the old pin", () => {
  let state = act(advance(start(), 3500), "select-packet", { id: 1 });
  state = advance(state, 120000);
  assert.equal(inspectedPacket(state).id, 1);
  assert.ok(state.packets.filter((packet) => packet.finishedAt !== null).length <= HISTORY_SIZE + 1);
  const snapshot = state;
  assert.equal(act(state, "select-packet", { id: -1 }), snapshot);
  state = act(state, "select-packet", { id: null });
  assert.equal(inspectedPacket(state), undefined);
  assert.ok(!state.packets.some((packet) => packet.id === 1));
});

test("model outcomes and progress are independent of display refresh rate", () => {
  for (const broken of [false, true]) {
    let initial = start();
    if (broken) initial = act(act(initial, "toggle-link"), "toggle-policy");
    const baseline = advance(initial, 10000, 100);
    for (const frame of [1000 / 30, 1000 / 60, 1000 / 120]) {
      const state = advance(initial, 10000, frame);
      assert.equal(state.packets.length, baseline.packets.length);
      for (const [index, packet] of state.packets.entries()) {
        const expected = baseline.packets[index];
        assert.equal(packet.id, expected.id);
        assert.equal(packet.status, expected.status);
        assert.equal(packet.route, expected.route);
        assert.ok(Math.abs(packet.progress - expected.progress) < 0.000001);
        if (packet.finishedAt !== null) assert.ok(Math.abs(packet.finishedAt - expected.finishedAt) < 0.000001);
      }
    }
  }
});

test("packet geometry crosses each router continuously and stays bounded in both layouts", () => {
  for (const compact of [false, true]) {
    for (const route of ["a", "b"]) {
      const router = nodePosition(route === "a" ? "router-a" : "router-b", compact);
      assert.deepEqual(packetPoint({ route, progress: 0.5 }, compact), router);
      let previous = packetPoint({ route, progress: 0 }, compact);
      for (let step = 1; step <= 1000; step++) {
        const point = packetPoint({ route, progress: step / 1000 }, compact);
        assert.ok(point.x > 0 && point.x < (compact ? 370 : 620));
        assert.ok(point.y > 0 && point.y < 370);
        assert.ok(Math.hypot(point.x - previous.x, point.y - previous.y) < 1);
        previous = point;
      }
      assert.deepEqual(packetPoint({ route, progress: NaN }, compact), packetPoint({ route, progress: 0 }, compact));
    }
  }
});

test("rapid fault, policy, pause, and inspection changes preserve bounded state and valid packets", () => {
  let seed = 9147;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed; };
  let state = start();
  for (let step = 0; step < 3500; step++) {
    const before = structuredClone(state);
    const choice = random() % 100;
    const action = choice < 4 ? { type: "toggle-link" }
      : choice < 8 ? { type: "toggle-policy" }
      : choice < 10 ? { type: "set-running", running: !state.running }
      : choice < 12 ? { type: "select-packet", id: "latest" }
      : choice < 14 ? { type: "select-packet", id: null }
      : { type: "tick", ms: 33.333 };
    const next = labReducer(state, action);
    assert.deepEqual(state, before);
    state = next;
    assert.ok(state.packets.length <= 9);
    const visible = state.packets.filter((packet) => !packet.sample && (packet.finishedAt === null || state.now - packet.finishedAt < FADE_MS));
    assert.ok(visible.length <= 8);
    for (const packet of state.packets) {
      assert.ok(packet.progress >= 0 && packet.progress <= 1);
      for (const compact of [false, true]) {
        const point = packetPoint(packet, compact);
        assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
      }
    }
  }
});
