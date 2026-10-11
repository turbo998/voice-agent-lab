import { z } from "zod";

export const SHUTDOWN_MARGIN_MS = 26 * 60_000;
const APP_MONTH_MS = 100 * 60 * 60_000;
const MAX_WINDOW_MS = 3 * 60 * 60_000;
const month = (time: number): string => new Date(time).toISOString().slice(0, 7);
const resourceId = z.string().regex(
  /^\/subscriptions\/[a-f0-9-]{36}\/resourceGroups\/[a-zA-Z0-9_-]+\/providers\/Microsoft\.App\/containerApps\/[a-z0-9-]+$/,
);
const window = z.object({
  resourceId, startsAt: z.number().int().positive(),
  endsAt: z.number().int().positive(), reservedUntil: z.number().int().positive(),
  period: z.string().regex(/^\d{4}-\d{2}$/),
}).strict().refine(w => w.endsAt > w.startsAt &&
  w.endsAt - w.startsAt <= MAX_WINDOW_MS &&
  w.reservedUntil === w.endsAt + SHUTDOWN_MARGIN_MS &&
  w.period === month(w.startsAt) && w.period === month(w.reservedUntil),
  "Invalid operating reservation");
export const controlSchema = z.object({
  schema: z.literal(1), blocked: z.boolean(), windows: z.array(window).max(200),
}).strict().superRefine((state, ctx) => {
  const totals = new Map<string, number>();
  for (const w of state.windows) {
    const key = `${w.resourceId.toLowerCase()}:${w.period}`;
    const total = (totals.get(key) ?? 0) + w.reservedUntil - w.startsAt;
    totals.set(key, total);
    if (total > APP_MONTH_MS) ctx.addIssue({ code: "custom", message: "Operating month cap exceeded" });
  }
});
export type OperatingControl = z.infer<typeof controlSchema>;
export const initialControl = (): OperatingControl => ({ schema: 1, blocked: true, windows: [] });

export function reserveOperatingWindow(
  input: OperatingControl, appId: string, durationMs: number, now = Date.now(),
): OperatingControl {
  const state = controlSchema.parse(input);
  resourceId.parse(appId);
  if (!Number.isSafeInteger(now) || !Number.isSafeInteger(durationMs) ||
      durationMs <= 0 || durationMs > MAX_WINDOW_MS) throw new Error("OPERATING_WINDOW_INVALID");
  const endsAt = now + durationMs;
  const reservedUntil = endsAt + SHUTDOWN_MARGIN_MS;
  const period = month(now);
  if (month(reservedUntil) !== period) throw new Error("OPERATING_WINDOW_MONTH_BOUNDARY");
  if (state.windows.some(w => w.resourceId.toLowerCase() === appId.toLowerCase() &&
      w.reservedUntil > now)) throw new Error("OPERATING_WINDOW_OVERLAP");
  const reserved = state.windows.filter(w => w.period === period &&
    w.resourceId.toLowerCase() === appId.toLowerCase())
    .reduce((sum, w) => sum + w.reservedUntil - w.startsAt, 0);
  if (reserved + reservedUntil - now > APP_MONTH_MS) throw new Error("OPERATING_MONTH_CAP");
  state.windows = state.windows.filter(w => w.period === period);
  state.windows.push({ resourceId: appId, startsAt: now, endsAt, reservedUntil, period });
  state.blocked = false;
  return controlSchema.parse(state);
}

export function operatingWindowAllowed(input: unknown, appId: string, now = Date.now()): boolean {
  const state = controlSchema.parse(input);
  resourceId.parse(appId);
  if (!Number.isSafeInteger(now) || state.blocked) return false;
  return state.windows.some(w => w.resourceId.toLowerCase() === appId.toLowerCase() &&
    w.period === month(now) && w.startsAt <= now && now < w.endsAt &&
    w.endsAt > w.startsAt && w.reservedUntil === w.endsAt + SHUTDOWN_MARGIN_MS &&
    w.reservedUntil - w.startsAt <= MAX_WINDOW_MS + SHUTDOWN_MARGIN_MS);
}

export function scheduledWorkerHours(days: number): number {
  if (!Number.isInteger(days) || days < 28 || days > 31) throw new Error("OPERATING_MONTH_DAYS_INVALID");
  // Conservative full timeout for every scheduled execution, without free grants.
  return days * 24 * (3 * 30 + 30) / 3600;
}
