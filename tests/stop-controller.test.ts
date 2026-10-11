import assert from "node:assert/strict";
import test from "node:test";
import { stopOutsideWindows } from "../integrations/private/stop-controller.js";
import { initialControl, reserveOperatingWindow } from "../integrations/private/operating-windows.js";

const app = ["", "subscriptions", "11111111-1111-1111-1111-111111111111",
  "resourceGroups", "synthetic-lab", "providers", "Microsoft.App",
  "containerApps", "synthetic-app"].join("/");
const other = app.replace("synthetic-app", "synthetic-other");
const now = Date.UTC(2026, 9, 2);
test("independent controller deactivates expired and unreadable windows, never activates", async () => {
  const stopped: string[] = [];
  const state = reserveOperatingWindow(initialControl(), app, 60_000, now);
  const controller = {
    readControl: async (): Promise<unknown> => state,
    revisions: async () => [{ name: "active", active: true }, { name: "old", active: false }],
    deactivate: async (id: string) => { stopped.push(id); },
  };
  assert.deepEqual(await stopOutsideWindows(controller, [app, other], now), {
    controlUnavailable: false, deactivated: 1,
  });
  assert.deepEqual(stopped, [other]);
  stopped.length = 0;
  controller.readControl = async () => { throw new Error("synthetic unavailable"); };
  assert.deepEqual(await stopOutsideWindows(controller, [app, other], now), {
    controlUnavailable: true, deactivated: 2,
  });
  assert.deepEqual(stopped.sort(), [app, other].sort());
});
test("controller never reports success after an unconfirmed revision stop", async () => {
  await assert.rejects(stopOutsideWindows({
    readControl: async () => initialControl(),
    revisions: async () => [{ name: "active", active: true }],
    deactivate: async () => { throw new Error("synthetic stop failed"); },
  }, [app], now), /stop failed/);
});
