import { z } from "zod";
import { AzureControlStore } from "./control-store.js";
import { reserveOperatingWindow } from "./operating-windows.js";

async function main(): Promise<void> {
  const config = z.object({
    AZURE_STORAGE_BLOB_ENDPOINT: z.url(),
    OPERATING_APP_IDS: z.string().max(2048),
    OPERATING_ACTION: z.enum(["reserve", "block"]),
    OPERATING_MINUTES: z.coerce.number().int().min(1).max(180),
  }).parse(process.env);
  const appIds = z.array(z.string()).length(2).parse(JSON.parse(config.OPERATING_APP_IDS));
  if (appIds[0]!.toLowerCase() === appIds[1]!.toLowerCase()) throw new Error("OPERATING_TARGETS_INVALID");
  const store = new AzureControlStore(config.AZURE_STORAGE_BLOB_ENDPOINT);
  const now = Date.now();
  const state = await store.update(previous => {
    if (config.OPERATING_ACTION === "block") return { ...previous, blocked: true };
    return appIds.reduce((next, id) =>
      reserveOperatingWindow(next, id, config.OPERATING_MINUTES * 60_000, now), previous);
  });
  console.log(JSON.stringify({
    event: "operating_control_updated",
    blocked: state.blocked,
    reservationCount: state.windows.length,
    ...(config.OPERATING_ACTION === "reserve" ? { endsAt: now + config.OPERATING_MINUTES * 60_000 } : {}),
  }));
}

await main().catch(() => {
  console.error(JSON.stringify({ event: "operating_control_update_failed", code: "RESERVATION_UNCONFIRMED" }));
  process.exitCode = 1;
});
