import { randomUUID } from "node:crypto";
import { LabError } from "../../../packages/business-core/contracts.js";
import type { LabState, Reservation, StateStore } from "../../../packages/business-core/state.js";

const caps = {
  retell: { cents: 500, minutes: 15, concurrent: 2, lifetime: true },
  retell_text: { cents: 200, minutes: 0, concurrent: 1, lifetime: true },
  live: { cents: 1000, minutes: 60, concurrent: 1, lifetime: false },
  model: { cents: 2000, minutes: 0, concurrent: 2, lifetime: false },
} as const;
const active = (r: Reservation) => ["reserved", "active", "uncertain"].includes(r.status);
export function reserveIn(state: LabState, bucket: Reservation["bucket"], sessionId: string, cents: number, minutes = 0, now = Date.now()) {
  if (state.paused) throw new LabError("LAB_PAUSED", 423, "New billable work is paused.");
  if (!Number.isFinite(cents) || cents <= 0 || !Number.isFinite(minutes) || minutes < 0 || minutes > 3) {
    throw new LabError("INVALID_RESERVATION", 400, "Invalid cost reservation.");
  }
  const cap = caps[bucket], period = cap.lifetime ? "trial" : new Date(now).toISOString().slice(0, 7);
  const roundedCents = Math.ceil(cents);
  const all = Object.values(state.reservations).filter(r => r.bucket === bucket && r.period === period && r.status !== "rejected");
  if (all.reduce((a, r) => a + r.cents, 0) + roundedCents > cap.cents ||
      (cap.minutes > 0 && all.reduce((a, r) => a + r.minutes, 0) + minutes > cap.minutes)) {
    throw new LabError("BUDGET_EXHAUSTED", 402, "Reserved learning budget exhausted; no recharge or overage.");
  }
  const running = Object.values(state.reservations).filter(active);
  if (["retell", "live"].includes(bucket) && running.some(r => r.sessionId === sessionId && ["retell", "live"].includes(r.bucket))) {
    throw new LabError("SESSION_BUSY", 409, "The bound session already has an active or uncertain voice operation.");
  }
  if (running.filter(r => r.bucket === bucket).length >= cap.concurrent ||
      (["retell", "live"].includes(bucket) && running.filter(r => ["retell", "live"].includes(r.bucket)).length >= 2)) {
    throw new LabError("CONCURRENCY_LIMIT", 429, "Another operation must end before starting.");
  }
  const reservation: Reservation = { id: randomUUID(), bucket, period, cents: roundedCents, minutes, sessionId, status: "reserved", createdAt: now };
  state.reservations[reservation.id] = reservation;
  return reservation;
}
export const reserve = (store: StateStore, bucket: Reservation["bucket"], sessionId: string, cents: number, minutes = 0) =>
  store.update(state => reserveIn(state, bucket, sessionId, cents, minutes));
export async function settle(store: StateStore, id: string, status: Reservation["status"]) {
  await store.update(state => {
    const reservation = state.reservations[id];
    if (!reservation) throw new LabError("RESERVATION_NOT_FOUND", 404, "Reservation not found.");
    if (reservation.status !== "ended") reservation.status = status;
  });
}
export function budgetSummary(state: LabState) {
  return Object.entries(caps).map(([bucket, cap]) => ({
    bucket, capCents: cap.cents, capMinutes: cap.minutes,
    reservedCents: Object.values(state.reservations).filter(r => r.bucket === bucket && r.status !== "rejected" &&
      (cap.lifetime || r.period === new Date().toISOString().slice(0, 7))).reduce((a, r) => a + r.cents, 0),
    reservedMinutes: Object.values(state.reservations).filter(r => r.bucket === bucket && r.status !== "rejected" &&
      (cap.lifetime || r.period === new Date().toISOString().slice(0, 7))).reduce((a, r) => a + r.minutes, 0),
  }));
}
