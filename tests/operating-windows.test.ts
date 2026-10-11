import assert from "node:assert/strict";
import test from "node:test";
import {
  initialControl, operatingWindowAllowed, reserveOperatingWindow,
  scheduledWorkerHours, SHUTDOWN_MARGIN_MS, type OperatingControl,
} from "../integrations/private/operating-windows.js";

const app = ["", "subscriptions", "11111111-1111-1111-1111-111111111111",
  "resourceGroups", "synthetic-lab", "providers", "Microsoft.App",
  "containerApps", "synthetic-app"].join("/");
const other = app.replace("synthetic-app", "synthetic-other");
const now = Date.UTC(2026, 9, 2);
test("operating lease binds exact app and reserves activation plus shutdown margin", () => {
  const state = reserveOperatingWindow(initialControl(), app, 60_000, now);
  assert.equal(operatingWindowAllowed(state, app, now), true);
  assert.equal(operatingWindowAllowed(state, other, now), false);
  assert.equal(operatingWindowAllowed(state, app, now + 60_000), false);
  assert.equal(state.windows[0]!.reservedUntil, now + 60_000 + SHUTDOWN_MARGIN_MS);
  assert.throws(() => reserveOperatingWindow(state, app, 60_000, now + 60_000), /OVERLAP/);
  assert.equal(operatingWindowAllowed({ ...state, blocked: true }, app, now), false);
  assert.throws(() => operatingWindowAllowed({ ...state, windows: "invalid" }, app, now));
});
test("operating lease never refunds an old reservation or crosses month boundary", () => {
  let state: OperatingControl = initialControl();
  let start = now;
  for (let i = 0; i < 30; i++) {
    state = reserveOperatingWindow(state, app, 3 * 60 * 60_000, start);
    start += 3 * 60 * 60_000 + SHUTDOWN_MARGIN_MS;
  }
  assert.throws(() => reserveOperatingWindow(state, app, 3 * 60 * 60_000, start), /MONTH_CAP/);
  assert.throws(() => reserveOperatingWindow(initialControl(), app, 60_000,
    Date.UTC(2026, 9, 31, 23, 50)), /MONTH_BOUNDARY/);
  assert.throws(() => reserveOperatingWindow(initialControl(), app, 4 * 60 * 60_000, now), /INVALID/);
  assert.equal(scheduledWorkerHours(31), 24.8);
  assert.ok(scheduledWorkerHours(31) + 0.2 < 30);
});
