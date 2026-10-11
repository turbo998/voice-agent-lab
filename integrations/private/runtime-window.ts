import { AzureControlStore } from "./control-store.js";
import { operatingWindowAllowed } from "./operating-windows.js";

export async function enforceRuntimeWindow(
  endpoint: string, appId: string | undefined, shutdown: () => Promise<void>,
): Promise<void> {
  if (!appId) throw new Error("OPERATING_APP_ID_REQUIRED");
  const control = new AzureControlStore(endpoint);
  if (!operatingWindowAllowed(await control.read(), appId)) throw new Error("OPERATING_WINDOW_CLOSED");
  let checking = false;
  let stopping = false;
  const timer = setInterval(() => {
    if (checking || stopping) return;
    checking = true;
    void control.read().then(state => {
      if (!operatingWindowAllowed(state, appId)) throw new Error("OPERATING_WINDOW_CLOSED");
    }).catch(async () => {
      stopping = true;
      clearInterval(timer);
      console.error(JSON.stringify({ event: "operating_window_shutdown", code: "WINDOW_CLOSED_OR_UNAVAILABLE" }));
      await shutdown();
    }).catch(() => {
      console.error(JSON.stringify({ event: "operating_window_shutdown_unconfirmed" }));
      process.exitCode = 1;
    }).finally(() => { checking = false; });
  }, 15_000);
  timer.unref();
}
